import { useEffect, useMemo, useState } from 'react';
import { Eye, Users, BarChart3 } from 'lucide-react';
import { api, humanizeError } from '../api.js';
import AdminShell from '../components/AdminShell.jsx';

const RANGES = [
  { key: '7d', label: '7 jours' },
  { key: '30d', label: '30 jours' },
  { key: '90d', label: '90 jours' },
  { key: '365d', label: '1 an' },
];

const DEVICE_LABELS = { mobile: 'Mobile', tablet: 'Tablette', desktop: 'Ordinateur' };

const countryNames =
  typeof Intl !== 'undefined' && Intl.DisplayNames
    ? new Intl.DisplayNames(['fr'], { type: 'region' })
    : null;

function countryLabel(code) {
  if (!code) return 'Inconnu';
  try {
    return countryNames?.of(code) || code;
  } catch {
    return code;
  }
}

function flag(code) {
  if (!code || code.length !== 2) return '🌐';
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export default function Analytics() {
  const [range, setRange] = useState('30d');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .analyticsStats(range)
      .then((s) => !cancelled && (setStats(s), setError(null)))
      .catch((e) => !cancelled && setError(humanizeError(e, 'Impossible de charger les statistiques.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [range]);

  const actions = (
    <div className="flex items-center gap-1 rounded-full bg-cream border border-cream-dark p-1">
      {RANGES.map((r) => (
        <button
          key={r.key}
          type="button"
          onClick={() => setRange(r.key)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            range === r.key ? 'bg-forest text-cream' : 'text-mute hover:text-forest'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );

  return (
    <AdminShell title="Analytiques" actions={actions}>
      <main className="max-w-5xl mx-auto w-full px-6 py-8">
        <p className="text-sm text-mute mb-6">
          Mesure d'audience interne, <strong className="text-ink">sans cookie ni traceur tiers</strong>.
          Aucune adresse IP n'est conservée ; les visiteurs uniques sont comptés via un identifiant
          anonyme renouvelé chaque jour.
        </p>

        {error && (
          <div className="rounded-2xl bg-ochre/10 border border-ochre/30 text-ink px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {loading && !stats ? (
          <div className="text-mute">Chargement des statistiques…</div>
        ) : stats ? (
          <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Kpi icon={Eye} label="Pages vues" value={stats.totals.views} />
              <Kpi icon={Users} label="Visiteurs uniques" value={stats.totals.visitors} />
            </div>

            {/* timeseries */}
            <Panel title="Pages vues par jour" className="mt-6">
              <DailyChart series={stats.series} days={stats.days} />
            </Panel>

            {stats.totals.views === 0 ? (
              <p className="mt-6 text-mute italic">
                Aucune visite enregistrée sur cette période pour le moment.
              </p>
            ) : (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Panel title="Pages les plus consultées">
                  <RankList
                    items={stats.pages.map((p) => ({ key: p.path, label: p.path, value: p.views }))}
                  />
                </Panel>
                <Panel title="Pays">
                  <RankList
                    items={stats.countries.map((c) => ({
                      key: c.country,
                      label: `${flag(c.country)}  ${countryLabel(c.country)}`,
                      value: c.views,
                    }))}
                    empty="Localisation indisponible (trafic local ou non géolocalisé)."
                  />
                </Panel>
                <Panel title="Régions">
                  <RankList
                    items={stats.regions.map((r) => ({
                      key: `${r.country}-${r.region}`,
                      label: `${flag(r.country)}  ${r.region} · ${countryLabel(r.country)}`,
                      value: r.views,
                    }))}
                    empty="Aucune région identifiée."
                  />
                </Panel>
                <Panel title="Appareils">
                  <RankList
                    items={stats.devices.map((d) => ({
                      key: d.device,
                      label: DEVICE_LABELS[d.device] || d.device,
                      value: d.views,
                    }))}
                  />
                </Panel>
                <Panel title="Sources de trafic (referrers)" className="md:col-span-2">
                  <RankList
                    items={stats.referrers.map((r) => ({ key: r.host, label: r.host, value: r.views }))}
                    empty="Aucune source externe — visites en accès direct."
                  />
                </Panel>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </AdminShell>
  );
}

function Kpi({ icon: Icon, label, value }) {
  return (
    <div className="bg-white border border-cream-dark rounded-3xl p-6 flex items-center gap-4">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-forest/5 text-forest">
        <Icon size={22} />
      </span>
      <span>
        <span className="block font-display text-3xl text-forest">{value.toLocaleString('fr-FR')}</span>
        <span className="block text-xs uppercase tracking-widest text-mute">{label}</span>
      </span>
    </div>
  );
}

function Panel({ title, children, className = '' }) {
  return (
    <section className={`bg-white border border-cream-dark rounded-3xl p-6 ${className}`}>
      <h2 className="text-xs uppercase tracking-widest text-ochre font-medium mb-4">{title}</h2>
      {children}
    </section>
  );
}

function RankList({ items, empty = 'Aucune donnée.' }) {
  if (!items?.length) return <p className="text-sm text-mute italic">{empty}</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-2.5">
      {items.map((it) => (
        <li key={it.key} className="relative">
          <div className="flex items-center justify-between gap-3 text-sm relative z-10 px-2.5 py-1.5">
            <span className="truncate text-ink">{it.label}</span>
            <span className="font-medium text-forest tabular-nums">{it.value.toLocaleString('fr-FR')}</span>
          </div>
          <div
            className="absolute inset-y-0 left-0 rounded-lg bg-sage/25"
            style={{ width: `${Math.max((it.value / max) * 100, 4)}%` }}
            aria-hidden="true"
          />
        </li>
      ))}
    </ul>
  );
}

function DailyChart({ series, days }) {
  // Build a continuous day axis and map the (sparse) series onto it.
  const data = useMemo(() => {
    const byDay = new Map(series.map((r) => [r.day, r]));
    const out = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const row = byDay.get(key);
      out.push({ day: key, views: row?.views || 0, visitors: row?.visitors || 0 });
    }
    return out;
  }, [series, days]);

  const max = Math.max(...data.map((d) => d.views), 1);
  const totalViews = data.reduce((s, d) => s + d.views, 0);

  if (totalViews === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-mute italic py-8 justify-center">
        <BarChart3 size={16} /> Pas encore de données sur cette période.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end gap-[2px] h-40">
        {data.map((d) => (
          <div key={d.day} className="group relative flex-1 flex items-end h-full">
            <div
              className="w-full rounded-t bg-forest/80 group-hover:bg-ochre transition-colors"
              style={{ height: `${Math.max((d.views / max) * 100, d.views > 0 ? 3 : 0)}%` }}
            />
            <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-forest text-cream text-[11px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              {new Date(d.day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} ·{' '}
              {d.views} vue{d.views > 1 ? 's' : ''} · {d.visitors} visiteur{d.visitors > 1 ? 's' : ''}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-mute">
        <span>{new Date(data[0].day).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
        <span>
          {new Date(data[data.length - 1].day).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
          })}
        </span>
      </div>
    </div>
  );
}
