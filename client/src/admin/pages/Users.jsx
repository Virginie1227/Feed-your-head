import { useEffect, useState } from 'react';
import { Plus, Trash2, X, CheckCircle, AlertCircle } from 'lucide-react';
import { api, humanizeError } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import AdminShell from '../components/AdminShell.jsx';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null); // user being edited
  const [toast, setToast] = useState(null);

  const reload = async () => {
    setLoading(true);
    const res = await api.listUsers();
    setItems(res.items);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  const flash = (kind, message) => {
    setToast({ kind, message });
    window.setTimeout(() => setToast(null), 3500);
  };

  const onCreate = async (data) => {
    try {
      await api.createUser(data);
      await reload();
      setCreating(false);
      flash('success', 'Utilisateur créé.');
    } catch (err) {
      flash('error', errorMessage(err));
    }
  };

  const onUpdate = async (id, patch) => {
    try {
      await api.updateUser(id, patch);
      await reload();
      setEditing(null);
      flash('success', 'Utilisateur mis à jour.');
    } catch (err) {
      flash('error', errorMessage(err));
    }
  };

  const onDelete = async (u) => {
    if (!window.confirm(`Supprimer définitivement ${u.name} (${u.email}) ?`)) return;
    try {
      await api.deleteUser(u.id);
      await reload();
      flash('success', 'Utilisateur supprimé.');
    } catch (err) {
      flash('error', errorMessage(err));
    }
  };

  return (
    <AdminShell title="Utilisateurs">
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-mute">Comptes ayant accès au back-office.</p>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-2 rounded-full bg-forest text-cream px-4 py-2 text-sm hover:bg-forest-light"
          >
            <Plus size={14} /> Nouvel utilisateur
          </button>
        </div>

        {loading ? (
          <p className="text-mute text-sm">Chargement…</p>
        ) : (
          <ul className="bg-white border border-cream-dark rounded-3xl divide-y divide-cream-dark">
            {items.map((u) => (
              <li key={u.id} className="p-5 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-ink truncate">{u.name}</div>
                  <div className="text-sm text-mute truncate">{u.email}</div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {u.id === currentUser?.id && (
                    <span className="text-[10px] uppercase tracking-widest text-ochre">vous</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditing(u)}
                    className="text-xs text-mute hover:text-ochre px-3 py-1.5 rounded-full border border-cream-dark"
                  >
                    Modifier
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(u)}
                    disabled={u.id === currentUser?.id}
                    aria-label="Supprimer"
                    title={u.id === currentUser?.id ? 'Vous ne pouvez pas supprimer votre propre compte.' : 'Supprimer'}
                    className="text-mute hover:text-ochre p-1.5 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {creating && <UserFormModal title="Nouvel utilisateur" onClose={() => setCreating(false)} onSubmit={onCreate} requirePassword />}
      {editing && (
        <UserFormModal
          title={`Modifier ${editing.name}`}
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={(data) => onUpdate(editing.id, data)}
        />
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

function errorMessage(err) {
  if (err?.body?.error === 'email_taken') return 'Cet email est déjà utilisé.';
  if (err?.body?.error === 'cannot_delete_self') return 'Vous ne pouvez pas supprimer votre propre compte.';
  if (err?.body?.error === 'last_admin') return 'Impossible de supprimer le dernier administrateur.';
  if (err?.body?.error === 'invalid_input') return 'Champs invalides (mot de passe ≥ 8 caractères, email valide).';
  return humanizeError(err);
}

function UserFormModal({ title, initial = {}, onClose, onSubmit, requirePassword = false }) {
  const [email, setEmail] = useState(initial.email ?? '');
  const [name, setName] = useState(initial.name ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const payload = { email, name };
    if (password) payload.password = password;
    if (requirePassword && !password) {
      setBusy(false);
      return;
    }
    await onSubmit(payload);
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <form onSubmit={submit} className="bg-cream rounded-3xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between px-6 py-4 border-b border-cream-dark">
          <h2 className="font-display text-2xl text-forest">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-mute hover:text-ochre p-1">
            <X size={18} />
          </button>
        </header>
        <div className="p-6 space-y-4">
          <Field label="Nom" value={name} onChange={setName} required />
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Field
            label={requirePassword ? 'Mot de passe' : 'Nouveau mot de passe (laissez vide pour conserver)'}
            type="password"
            value={password}
            onChange={setPassword}
            required={requirePassword}
            placeholder="Au moins 8 caractères"
          />
        </div>
        <footer className="px-6 py-4 border-t border-cream-dark flex justify-end gap-3">
          <button type="button" onClick={onClose} className="text-sm text-mute hover:text-ochre">Annuler</button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-ochre text-white px-5 py-2 text-sm hover:bg-ochre/90 disabled:opacity-60"
          >
            {busy ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </footer>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required, placeholder }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-mute font-medium mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-cream-dark bg-white px-3.5 py-2.5 text-ink focus:border-ochre/60"
      />
    </div>
  );
}
