import { TextField, TextAreaField, NumberField, CheckboxField, ListField, Section } from '../components/Form.jsx';

const set = (obj, key, value) => ({ ...(obj ?? {}), [key]: value });

// ──────────────────────────────────────────────────────────────────
//  BRAND (settings.brand)
// ──────────────────────────────────────────────────────────────────
function BrandEditor({ value, onChange }) {
  return (
    <Section title="Identité de marque">
      <TextField label="Nom de marque" value={value.name} onChange={(v) => onChange(set(value, 'name', v))} />
      <TextField label="Baseline (kicker du Hero)" value={value.baseline} onChange={(v) => onChange(set(value, 'baseline', v))} />
    </Section>
  );
}

// ──────────────────────────────────────────────────────────────────
//  INTRO (settings.intro)
// ──────────────────────────────────────────────────────────────────
function IntroEditor({ value, onChange }) {
  return (
    <Section title="Animation d'accueil">
      <CheckboxField
        label="Activer l'animation d'intro"
        description="Affichée une fois par session. Les visiteurs récurrents la voient à nouveau dans une nouvelle session."
        value={value.enabled}
        onChange={(v) => onChange(set(value, 'enabled', v))}
      />
      <NumberField label="Durée totale (ms)" value={value.durationMs} min={1000} max={10000} step={100} onChange={(v) => onChange(set(value, 'durationMs', v))} />
      <TextField label="Libellé du bouton Skip" value={value.skipLabel} onChange={(v) => onChange(set(value, 'skipLabel', v))} />
    </Section>
  );
}

// ──────────────────────────────────────────────────────────────────
//  CONTACT INFO (settings.contact)
// ──────────────────────────────────────────────────────────────────
function ContactInfoEditor({ value, onChange }) {
  return (
    <Section title="Coordonnées & services tiers">
      <TextField label="Email de contact" type="email" value={value.email} onChange={(v) => onChange(set(value, 'email', v))} />
      <TextField label="URL LinkedIn" value={value.linkedin} onChange={(v) => onChange(set(value, 'linkedin', v))} />
      <TextField label="URL Calendly" value={value.calendlyUrl} onChange={(v) => onChange(set(value, 'calendlyUrl', v))} placeholder="https://calendly.com/…" />
    </Section>
  );
}

// ──────────────────────────────────────────────────────────────────
//  NAV (settings.nav)
// ──────────────────────────────────────────────────────────────────
function NavEditor({ value, onChange }) {
  return (
    <Section title="Menu de navigation">
      <ListField
        items={value ?? []}
        onChange={onChange}
        newItem={() => ({ label: 'Nouveau lien', href: '#', hidden: false })}
        addLabel="Ajouter un lien"
        renderItem={(item, setItem) => (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <TextField label="Libellé" value={item.label} onChange={(v) => setItem({ ...item, label: v })} />
              <TextField label="Ancre (#section)" value={item.href} onChange={(v) => setItem({ ...item, href: v })} />
            </div>
            <CheckboxField
              label="Masquer ce lien du menu"
              description="Le lien reste enregistré mais n'apparaît pas dans la navigation du site."
              value={item.hidden}
              onChange={(v) => setItem({ ...item, hidden: v })}
            />
          </div>
        )}
      />
    </Section>
  );
}

// ──────────────────────────────────────────────────────────────────
//  FOOTER (settings.footer)
// ──────────────────────────────────────────────────────────────────
function FooterEditor({ value, onChange }) {
  return (
    <Section title="Pied de page">
      <TextField label="Mention de droits" value={value.rights} onChange={(v) => onChange(set(value, 'rights', v))} />
    </Section>
  );
}

// ──────────────────────────────────────────────────────────────────
//  MENTIONS LÉGALES (settings.legal) — champs factuels d'identité
//  Le texte juridique (RGPD, cookies, mesure d'audience) reste dans le code.
// ──────────────────────────────────────────────────────────────────
function LegalEditor({ value, onChange }) {
  const v = value ?? {};
  return (
    <>
      <Section title="Éditeur du site">
        <TextField label="Nom de l'éditrice" value={v.editorName} onChange={(x) => onChange(set(v, 'editorName', x))} placeholder="Virginie Coulange" />
        <TextField label="Statut / forme juridique" value={v.editorStatus} onChange={(x) => onChange(set(v, 'editorStatus', x))} placeholder="consultante RH indépendante" />
        <TextField label="SIRET" value={v.siret} onChange={(x) => onChange(set(v, 'siret', x))} placeholder="990 850 125 00016" />
        <TextField label="Adresse postale (optionnel)" value={v.address} onChange={(x) => onChange(set(v, 'address', x))} placeholder="laisser vide pour « à compléter »" />
      </Section>
      <Section title="Hébergement">
        <TextField label="Nom de l'hébergeur" value={v.hostName} onChange={(x) => onChange(set(v, 'hostName', x))} placeholder="Railway Corporation" />
        <TextField label="Adresse de l'hébergeur" value={v.hostAddress} onChange={(x) => onChange(set(v, 'hostAddress', x))} placeholder="548 Market St Suite 68956, San Francisco, CA 94104, États-Unis" />
      </Section>
    </>
  );
}

export const SETTINGS_EDITORS = {
  brand: BrandEditor,
  intro: IntroEditor,
  contact: ContactInfoEditor,
  nav: NavEditor,
  footer: FooterEditor,
  legal: LegalEditor,
};

export const SETTINGS_LABELS = {
  brand: 'Marque',
  intro: 'Intro animée',
  contact: 'Coordonnées',
  nav: 'Menu de navigation',
  footer: 'Pied de page',
  legal: 'Mentions légales',
};
