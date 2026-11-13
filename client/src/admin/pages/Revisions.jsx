import { useEffect, useState } from 'react';
import { RotateCcw, Eye, CheckCircle, AlertCircle, X } from 'lucide-react';
import { api, humanizeError } from '../api.js';
import AdminShell from '../components/AdminShell.jsx';
import { SECTION_LABELS } from '../editors/SectionEditors.jsx';
import { SETTINGS_LABELS } from '../editors/SettingsEditors.jsx';

export default function Revisions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewing, setPreviewing] = useState(null);
  const [toast, setToast] = useState(null);

  const reload = async () => {
    setLoading(true);
    const res = await api.listRevisions();
    setItems(res.items);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  const flash = (kind, message) => {
    setToast({ kind, message });
    window.setTimeout(() => setToast(null), 3500);
  };

  const onRestore = async (rev) => {
    if (!window.confirm(`Restaurer cette révision (${labelFor(rev)} · ${formatDate(rev.created_at)}) ?\n\nL'état actuel sera lui-même sauvegardé en révision avant remplacement.`)) return;
    try {
      await api.restoreRevision(rev.id);
      await reload();
      flash('success', 'Révision restaurée.');
    } catch (err) {
      flash('error', humanizeError(err));
    }
  };

  const onPreview = async (rev) => {
    try {
      const res = await api.getRevision(rev.id);
      setPreviewing(res.revision);
    } catch (err) {
      flash('error', 'Erreur lors du chargement.');
    }
  };

  return (
    <AdminShell title="Révisions">
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <p className="text-sm text-mute mb-6">
          Historique des 50 dernières modifications par élément. Chaque enregistrement crée automatiquement une révision.
        </p>

        {loading ? (
          <p className="text-mute text-sm">Chargement…</p>
        ) : items.length === 0 ? (
          <p className="text-mute text-sm">Aucune révision pour le moment.</p>
        ) : (
          <ul className="bg-white border border-cream-dark rounded-3xl divide-y divide-cream-dark">
            {items.map((rev) => (
              <li key={rev.id} className="p-5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-ochre">{rev.kind}</span>
                    <span className="font-medium text-ink truncate">{labelFor(rev)}</span>
                  </div>
                  <div className="text-xs text-mute mt-0.5">
                    {formatDate(rev.created_at)}
                    {rev.user_name && ` · par ${rev.user_name}`}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onPreview(rev)}
                    aria-label="Aperçu"
                    className="text-xs text-mute hover:text-ochre inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-cream-dark"
                  >
                    <Eye size={12} /> Aperçu
                  </button>
                  <button
                    type="button"
                    onClick={() => onRestore(rev)}
                    aria-label="Restaurer"
                    className="text-xs text-cream bg-forest hover:bg-forest-light inline-flex items-center gap-1 px-3 py-1.5 rounded-full"
                  >
                    <RotateCcw size={12} /> Restaurer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {previewing && (
        <PreviewModal revision={previewing} onClose={() => setPreviewing(null)} />
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm shadow-lg ${
            toast.kind === 'success' ? 'bg-forest text-cream' : 'bg-ochre text-white'
          }`}
        >
          {toast.kind === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{toast.message}</span>
        </div>
      )}
    </AdminShell>
  );
}

function labelFor(rev) {
  if (rev.kind === 'settings') return SETTINGS_LABELS[rev.entity_id] ?? rev.entity_id;
  // section
  if (rev.snapshot?.type) return SECTION_LABELS[rev.snapshot.type] ?? rev.snapshot.type;
  return `Section ${rev.entity_id?.slice(0, 8) ?? ''}`;
}

function formatDate(iso) {
  if (!iso) return '';
  // SQLite stores CURRENT_TIMESTAMP in UTC as "YYYY-MM-DD HH:MM:SS" (no zone):
  // mark it as UTC so it's shown in the editor's local time (Paris).
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(iso) ? `${iso.replace(' ', 'T')}Z` : iso;
  const d = new Date(normalized);
  return d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

function PreviewModal({ revision, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-cream rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between px-6 py-4 border-b border-cream-dark">
          <h2 className="font-display text-2xl text-forest">Aperçu de la révision</h2>
          <button onClick={onClose} aria-label="Fermer" className="text-mute hover:text-ochre p-1">
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          <pre className="bg-white border border-cream-dark rounded-2xl p-4 text-xs text-ink whitespace-pre-wrap break-words">
            {JSON.stringify(revision.snapshot, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
