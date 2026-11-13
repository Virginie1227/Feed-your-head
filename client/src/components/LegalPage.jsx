import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/ContentContext.jsx';
import Logo from './Logo.jsx';

export default function LegalPage() {
  const settings = useSettings();
  const brand = settings?.brand?.name ?? 'Feed Your Head';
  const email = settings?.contact?.email ?? 'contact@feedyourhead.fr';

  // Factual identity fields are editable from the back office (Réglages →
  // Mentions légales). Defaults below keep the page identical when the
  // `legal` settings key doesn't exist yet (e.g. an already-seeded prod DB).
  const legal = settings?.legal ?? {};
  const editorName = legal.editorName || 'Virginie Coulange';
  const editorStatus = legal.editorStatus || 'consultante RH indépendante';
  const siret = legal.siret || '990 850 125 00016';
  const address = legal.address || '';
  // The site runs on Railway (IONOS only manages the domain name / DNS).
  const hostName = legal.hostName || 'Railway Corporation';
  const hostAddress = legal.hostAddress || '548 Market St Suite 68956, San Francisco, CA 94104, États-Unis';

  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="border-b border-cream-dark">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 h-16 md:h-20 flex items-center justify-between">
          <Link to="/" aria-label={brand} className="text-forest">
            <Logo variant="lockup" className="h-8 w-auto" />
          </Link>
          <Link
            to="/"
            className="text-sm text-mute hover:text-ochre transition-colors"
          >
            ← Retour au site
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 lg:px-10 py-16 md:py-24">
        <h1 className="font-display text-3xl md:text-4xl text-forest mb-2">
          Mentions légales & confidentialité
        </h1>
        <p className="text-mute text-sm mb-12">
          Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
        </p>

        <section className="space-y-4 mb-12">
          <h2 className="font-display text-2xl text-forest">Éditeur du site</h2>
          <p className="text-mute leading-relaxed text-justify">
            Le présent site <strong className="text-ink">{brand}</strong> est édité par{' '}
            {editorName}{editorStatus ? `, ${editorStatus}` : ''}.
          </p>
          <p className="text-mute leading-relaxed text-justify">
            Contact :{' '}
            <a href={`mailto:${email}`} className="text-forest hover:text-ochre transition-colors">
              {email}
            </a>
          </p>
          <p className="text-mute leading-relaxed text-sm">
            SIRET : <strong className="text-ink">{siret}</strong>.{' '}
            {address ? `Adresse : ${address}.` : "Adresse postale : à compléter par l'éditrice."}
          </p>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="font-display text-2xl text-forest">Hébergement</h2>
          <p className="text-mute leading-relaxed text-justify">
            Le site est hébergé par <strong className="text-ink">{hostName}</strong>
            {hostAddress ? `, ${hostAddress}` : ''}.
          </p>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="font-display text-2xl text-forest">Propriété intellectuelle</h2>
          <p className="text-mute leading-relaxed text-justify">
            L'ensemble des contenus (textes, images, logos, identité visuelle) présents sur ce site
            sont la propriété de leur auteur respectif. Toute reproduction, même partielle, est
            interdite sans autorisation préalable.
          </p>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="font-display text-2xl text-forest">Données personnelles (RGPD)</h2>
          <p className="text-mute leading-relaxed text-justify">
            <strong className="text-ink">Responsable de traitement :</strong> {editorName}, joignable à{' '}
            <a href={`mailto:${email}`} className="text-forest hover:text-ochre transition-colors">
              {email}
            </a>
            .
          </p>
          <p className="text-mute leading-relaxed text-justify">
            <strong className="text-ink">Données collectées :</strong> uniquement celles que vous
            transmettez via le formulaire de contact ou par e-mail (nom, adresse e-mail, contenu du
            message, et le cas échéant nom de votre organisation).
          </p>
          <p className="text-mute leading-relaxed text-justify">
            <strong className="text-ink">Finalité :</strong> répondre à votre demande et assurer le
            suivi de notre échange. Aucune prospection commerciale automatisée n'est effectuée.
          </p>
          <p className="text-mute leading-relaxed text-justify">
            <strong className="text-ink">Base légale :</strong> votre consentement (art. 6.1.a RGPD)
            et l'intérêt légitime à répondre à une sollicitation entrante (art. 6.1.f RGPD).
          </p>
          <p className="text-mute leading-relaxed text-justify">
            <strong className="text-ink">Durée de conservation :</strong> 3 ans à compter du dernier
            contact, puis archivage ou suppression.
          </p>
          <p className="text-mute leading-relaxed text-justify">
            <strong className="text-ink">Destinataires :</strong> les données ne sont jamais cédées
            ni louées. Les messages envoyés via le formulaire de contact sont acheminés par notre
            prestataire d'envoi d'e-mails <strong className="text-ink">Brevo</strong> (Sendinblue SAS,
            France), agissant comme sous-traitant au sens du RGPD, dont les serveurs sont situés dans
            l'Union européenne. Aucune donnée n'est transférée hors de l'Union européenne.
          </p>
          <p className="text-mute leading-relaxed text-justify">
            <strong className="text-ink">Vos droits :</strong> conformément au RGPD (UE 2016/679) et
            à la loi « Informatique et Libertés » modifiée, vous disposez d'un droit d'accès, de
            rectification, d'effacement, de limitation, d'opposition, ainsi que d'un droit à la
            portabilité de vos données et d'un droit de définir des directives relatives à leur sort
            après votre décès. Pour exercer ces droits, écrivez à{' '}
            <a href={`mailto:${email}`} className="text-forest hover:text-ochre transition-colors">
              {email}
            </a>
            . Une réponse vous sera apportée sous un délai d'un mois maximum.
          </p>
          <p className="text-mute leading-relaxed text-justify">
            <strong className="text-ink">Réclamation :</strong> si vous estimez, après nous avoir
            contactés, que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à
            la CNIL —{' '}
            <a
              href="https://www.cnil.fr/fr/plaintes"
              target="_blank"
              rel="noreferrer noopener"
              className="text-forest hover:text-ochre transition-colors"
            >
              www.cnil.fr/fr/plaintes
            </a>
            .
          </p>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="font-display text-2xl text-forest">Cookies & traceurs</h2>
          <p className="text-mute leading-relaxed text-justify">
            Ce site <strong className="text-ink">n'utilise aucun cookie de mesure d'audience, de
            publicité ou de traceur tiers</strong> (pas de Google Analytics, Meta Pixel, etc.). Aucun
            recueil de consentement n'est donc requis pour la consultation du site public.
          </p>
          <p className="text-mute leading-relaxed text-justify">
            <strong className="text-ink">Cookies strictement nécessaires :</strong> un cookie de
            session est déposé uniquement lors d'une connexion à l'espace d'administration{' '}
            <code className="text-ink">/admin</code>, afin de maintenir l'authentification. Il est
            supprimé à la déconnexion.
          </p>
          <p className="text-mute leading-relaxed text-justify">
            <strong className="text-ink">Stockage local :</strong> votre navigateur peut conserver,
            via <code className="text-ink">localStorage</code> / <code className="text-ink">sessionStorage</code>,
            l'information que vous avez vu l'animation d'accueil et fermé le présent bandeau
            d'information. Ces données restent sur votre appareil et ne nous sont jamais transmises.
          </p>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="font-display text-2xl text-forest">Mesure d'audience</h2>
          <p className="text-mute leading-relaxed text-justify">
            Afin de comprendre la fréquentation du site, une mesure d'audience{' '}
            <strong className="text-ink">interne, sans cookie et sans service tiers</strong> est
            réalisée. À chaque page consultée, sont enregistrés de manière agrégée : la page visitée,
            la source de provenance (site référent), le type d'appareil (mobile, tablette, ordinateur)
            et une localisation approximative (pays et région).
          </p>
          <p className="text-mute leading-relaxed text-justify">
            <strong className="text-ink">Aucune adresse IP n'est conservée.</strong> La localisation
            est déduite de l'adresse IP au moment de la visite via une base de données hors ligne, puis
            l'adresse IP est immédiatement écartée. Le décompte des visiteurs uniques repose sur un
            identifiant anonyme et non réversible, renouvelé chaque jour, qui ne permet ni de suivre un
            visiteur d'un jour à l'autre, ni de l'identifier, ni de le suivre sur d'autres sites.
          </p>
          <p className="text-mute leading-relaxed text-justify">
            Ce dispositif respecte les conditions de l'exemption de consentement prévue par la CNIL pour
            la mesure d'audience (finalité strictement limitée à l'établissement de statistiques
            anonymes, pas de recoupement avec d'autres traitements, pas de suivi inter-sites). Aucun
            bandeau de consentement n'est donc requis.
          </p>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="font-display text-2xl text-forest">Sécurité</h2>
          <p className="text-mute leading-relaxed text-justify">
            Le site applique les bonnes pratiques de sécurité usuelles : connexion HTTPS, en-têtes
            de sécurité (Helmet), et restriction d'accès à l'administration par authentification.
            Les mots de passe sont stockés sous forme hachée.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-2xl text-forest">Liens externes</h2>
          <p className="text-mute leading-relaxed text-justify">
            Ce site peut contenir des liens vers des sites tiers (notamment LinkedIn). Nous ne
            sommes pas responsables du contenu ou de la politique de confidentialité de ces sites.
          </p>
        </section>
      </main>

      <footer className="border-t border-cream-dark">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 py-8 text-sm text-mute">
          © {new Date().getFullYear()} {brand}.{' '}
          <Link to="/" className="hover:text-ochre transition-colors">
            Retour au site
          </Link>
        </div>
      </footer>
    </div>
  );
}
