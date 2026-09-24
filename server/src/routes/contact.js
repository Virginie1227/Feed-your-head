import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { requireAuth } from '../auth/middleware.js';

const router = Router();

// Le formulaire envoie via l'API transactionnelle Brevo (HTTPS, port 443) :
// Railway bloque les ports SMTP sortants, donc on ne peut pas passer par le
// SMTP IONOS. Brevo (société FR, données en UE) relaie le message vers la
// boîte de Virginie. From = son adresse (à authentifier dans Brevo),
// Reply-To = le visiteur.
const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const FROM = process.env.CONTACT_FROM || 'virginie@feedyourhead.fr';
const TO = process.env.CONTACT_TO || FROM;

// Anti-spam : 10 envois/h par IP.
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'too_many_requests' },
});

const ContactSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(320),
  company: z.string().trim().max(200).optional().default(''),
  message: z.string().trim().min(1).max(5000),
  website: z.string().max(200).optional(), // honeypot — must stay empty
});

router.post('/', limiter, async (req, res) => {
  const parsed = ContactSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'invalid_input' });

  const { name, email, company, message, website } = parsed.data;

  // Honeypot tripped → pretend success, send nothing.
  if (website) return res.json({ ok: true });

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[contact] BREVO_API_KEY manquante — envoi désactivé');
    return res.status(503).json({ error: 'email_not_configured' });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const r = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: FROM, name: 'Feed Your Head — formulaire' },
        to: [{ email: TO }],
        replyTo: { email, name }, // la réponse va droit au visiteur
        subject: `Nouveau message du site${company ? ` — ${company}` : ''} (${name})`,
        textContent:
          `Nom : ${name}\n` +
          `Email : ${email}\n` +
          `Entreprise : ${company || '—'}\n` +
          `\n${message}\n`,
      }),
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      const reason = classify(r.status, detail);
      console.error('[contact] Brevo a refusé:', r.status, reason, detail.slice(0, 300));
      return res.status(502).json({ error: 'send_failed', reason });
    }
    res.json({ ok: true });
  } catch (err) {
    const reason = err.name === 'AbortError' ? 'timeout' : err.message;
    console.error('[contact] envoi échoué:', reason);
    res.status(502).json({ error: 'send_failed', reason });
  } finally {
    clearTimeout(timer);
  }
});

// Traduit un échec Brevo en cause actionnable. Le détail complet reste dans les
// logs ; ce code court remonte jusqu'au navigateur pour diagnostiquer sans y accéder.
function classify(status, detail) {
  const code = (() => {
    try {
      return JSON.parse(detail)?.code || '';
    } catch {
      return '';
    }
  })();
  if (status === 401) return 'api_key_rejected';
  if (status === 402 || code === 'not_enough_credits') return 'quota_exceeded';
  if (status === 403) return 'account_blocked';
  if (code === 'invalid_parameter' && /sender/i.test(detail)) return 'sender_not_validated';
  if (status === 400) return 'invalid_request';
  return 'brevo_error';
}

// Diagnostic réservé au back office : interroge Brevo pour dire d'un coup d'oeil
// si la clé est valide, s'il reste des crédits et si l'expéditeur est validé.
router.get('/diagnostic', requireAuth, async (_req, res) => {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return res.json({ ok: false, cause: 'BREVO_API_KEY absente des variables Railway' });

  const headers = { 'api-key': apiKey, accept: 'application/json' };
  const call = async (url) => {
    const r = await fetch(url, { headers });
    const body = await r.json().catch(() => ({}));
    return { status: r.status, body };
  };

  try {
    const account = await call('https://api.brevo.com/v3/account');
    if (account.status === 401) {
      return res.json({
        ok: false,
        cause: "La cle API est refusee par Brevo (401). Regenerez-la et recollez-la dans Railway.",
        detail: account.body,
      });
    }
    if (!(account.status >= 200 && account.status < 300)) {
      return res.json({ ok: false, cause: `Brevo repond ${account.status} sur /account`, detail: account.body });
    }

    const plans = account.body?.plan || [];
    const emailCredits = plans
      .filter((p) => p.creditsType === 'sendLimit' || p.type === 'free')
      .map((p) => p.credits)
      .filter((c) => typeof c === 'number');
    const outOfCredits = emailCredits.length > 0 && emailCredits.every((c) => c <= 0);

    const senders = await call('https://api.brevo.com/v3/senders');
    const list = senders.body?.senders || [];
    const match = list.find((s) => (s.email || '').toLowerCase() === FROM.toLowerCase());

    const problems = [];
    if (outOfCredits) problems.push('Quota d envois Brevo epuise.');
    if (!match) {
      problems.push(
        `L expediteur ${FROM} n est pas dans la liste des expediteurs Brevo. ` +
          'Ajoutez-le et validez-le dans Brevo > Expediteurs, domaines et IP.'
      );
    } else if (match.active === false) {
      problems.push(`L expediteur ${FROM} existe mais n est pas encore valide (lien de confirmation a cliquer).`);
    }

    res.json({
      ok: problems.length === 0,
      cause: problems.length ? problems.join(' ') : null,
      compte: account.body?.email || null,
      credits: emailCredits,
      expediteur_configure: FROM,
      destinataire: TO,
      expediteurs_brevo: list.map((s) => ({ email: s.email, actif: s.active })),
    });
  } catch (err) {
    res.status(502).json({ ok: false, cause: `Appel a Brevo impossible : ${err.message}` });
  }
});

export default router;
