import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { api, humanizeError } from '../api.js';
import AdminShell from '../components/AdminShell.jsx';
import { SECTION_EDITORS, SECTION_LABELS } from '../editors/SectionEditors.jsx';
import { SETTINGS_EDITORS, SETTINGS_LABELS } from '../editors/SettingsEditors.jsx';

const ADDABLE_TYPES = ['hero', 'approche', 'feedyourcrew', 'offres', 'methode', 'references', 'temoignages', 'ressources', 'apropos', 'contact'];

export default function ContentEditor() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState(null);
  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const reload = async () => {
    setLoading(true);
    try {
      const c = await api.content();
      setContent(c);
      return c;
    } finally {
      setLoading(false);
    }
  };

  const deriveDraft = (next, c) => {
    if (!c || !next) return null;
    if (next.kind === 'section') {
      const s = c.sections.find((x) => x.id === next.id);
      return s ? structuredClone(s.data) : null;
    }
    // Settings key may not exist yet in an already-seeded DB (e.g. `legal`
    // added after launch). Default to {} so its editor still opens.
    return structuredClone(c.settings[next.id] ?? {});
  };

  const switchTo = (next) => {
    setSelection(next);
    setDraft(deriveDraft(next, content));
    setDirty(false);
  };

  useEffect(() => {
    reload().then((c) => {
      if (c?.sections?.[0]) {
        const initial = { kind: 'section', id: c.sections[0].id };
        setSelection(initial);
        setDraft(deriveDraft(initial, c));
        setDirty(false);
      }
    }).catch((err) => flash('error', humanizeError(err, 'Impossible de charger le contenu.')));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // NB: content is reloaded after toggle/reorder/add/delete. We deliberately do
  // NOT re-derive the draft then, otherwise unsaved edits in the open editor
  // would be silently wiped. Only save() and switchTo() replace the draft.

  // Warn before leaving the page (tab close, reload, navigation) with unsaved edits.
  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const flash = (kind, message) => {
    setToast({ kind, message });
    window.setTimeout(() => setToast(null), 3500);
  };

  const save = async () => {
    if (!selection || !draft || saving) return;
    setSaving(true);
    try {
      if (selection.kind === 'section') {
        await api.updateSection(selection.id, { data: draft });
      } else {
        await api.updateSettings(selection.id, draft);
      }
      const c = await reload();
      setDraft(deriveDraft(selection, c));
      setDirty(false);
      flash('success', 'Modifications enregistrées.');
    } catch (err) {
      flash('error', humanizeError(err, 'Erreur lors de l’enregistrement.'));
    } finally {
      setSaving(false);
    }
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = content.sections.map((s) => s.id);
    const oldIdx = ids.indexOf(active.id);
    const newIdx = ids.indexOf(over.id);
    const newIds = arrayMove(ids, oldIdx, newIdx);

    // optimistic update
    setContent((prev) => ({
      ...prev,
      sections: newIds.map((id, i) => ({ ...prev.sections.find((s) => s.id === id), order: i })),
    }));
    try {
      await api.reorderSections(newIds);
      flash('success', 'Ordre mis à jour.');
    } catch (err) {
      flash('error', humanizeError(err, 'Erreur lors du réordonnancement.'));
      await reload();
    }
  };

  const toggleVisible = async (section) => {
    try {
      await api.updateSection(section.id, { visible: !section.visible });
      await reload();
    } catch (err) {
      flash('error', humanizeError(err));
    }
  };

  const addSection = async (type) => {
    try {
      const res = await api.createSection(type);
      await reload();
      switchTo({ kind: 'section', id: res.section.id });
      setAddModalOpen(false);
      flash('success', `Section « ${SECTION_LABELS[type]} » ajoutée.`);
    } catch (err) {
      flash('error', humanizeError(err));
    }
  };

  const deleteSection = async (section) => {
    if (!window.confirm(`Supprimer la section « ${SECTION_LABELS[section.type]} » ? Une révision sera conservée.`)) return;
    try {
      await api.deleteSection(section.id);
      const c = await reload();
      if (selection?.kind === 'section' && selection.id === section.id) {
        if (c.sections[0]) switchTo({ kind: 'section', id: c.sections[0].id });
        else { setSelection(null); setDraft(null); }
      }
      flash('success', 'Section supprimée.');
    } catch (err) {
      flash('error', humanizeError(err));
    }
  };

  const sidebarSettings = useMemo(
    () =>
      Object.keys(SETTINGS_LABELS).map((key) => ({
        key,
        label: SETTINGS_LABELS[key],
      })),
    []
  );

  if (loading && !content) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center text-mute">
        Chargement du contenu…
      </div>
    );
  }

  const headerActions = (
    <>
      {dirty && <span className="text-xs text-ochre">● Modifications non enregistrées</span>}
      <button
        type="button"
        onClick={save}
        disabled={!dirty || saving}
        className="inline-flex items-center gap-2 rounded-full bg-ochre text-white px-5 py-2 text-sm font-medium hover:bg-ochre/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Save size={14} />
        {saving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </>
  );

  return (
    <AdminShell title="Édition du contenu" actions={headerActions}>
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 grid grid-cols-12 gap-8">
        <aside className="col-span-12 md:col-span-3 lg:col-span-3">
          <SidebarGroup title="Réglages">
            {sidebarSettings.map((s) => (
              <SidebarItem
                key={s.key}
                active={selection?.kind === 'settings' && selection.id === s.key}
                onClick={() => maybeSwitch(dirty, () => switchTo({ kind: 'settings', id: s.key }))}
                label={s.label}
              />
            ))}
          </SidebarGroup>

          <div className="mb-3 flex items-center justify-between px-2">
            <h3 className="text-xs uppercase tracking-widest text-ochre font-medium">Sections</h3>
            <button
              type="button"
              onClick={() => maybeSwitch(dirty, () => setAddModalOpen(true))}
              className="inline-flex items-center gap-1 text-xs text-forest hover:text-ochre"
            >
              <Plus size={12} /> Ajouter
            </button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={content.sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-0.5">
                {content.sections.map((s) => (
                  <SortableSectionItem
                    key={s.id}
                    section={s}
                    active={selection?.kind === 'section' && selection.id === s.id}
                    onSelect={() => maybeSwitch(dirty, () => switchTo({ kind: 'section', id: s.id }))}
                    onToggleVisible={() => toggleVisible(s)}
                    onDelete={() => deleteSection(s)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </aside>

        <main className="col-span-12 md:col-span-9 lg:col-span-9 bg-white border border-cream-dark rounded-3xl p-6 md:p-8">
          {selection && draft ? (
            <EditorPane
              selection={selection}
              draft={draft}
              content={content}
              onChange={(next) => {
                setDraft(next);
                setDirty(true);
              }}
            />
          ) : (
            <div className="text-mute">Sélectionnez un élément à éditer.</div>
          )}
        </main>
      </div>

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

      {addModalOpen && (
        <AddSectionModal onClose={() => setAddModalOpen(false)} onPick={addSection} />
      )}
    </AdminShell>
  );
}

function maybeSwitch(dirty, fn) {
  if (!dirty || window.confirm('Modifications non enregistrées. Les abandonner ?')) fn();
}

function SidebarGroup({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="text-xs uppercase tracking-widest text-ochre font-medium mb-2 px-2">{title}</h3>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function SidebarItem({ active, onClick, label }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-colors ${
          active ? 'bg-forest text-cream' : 'text-ink hover:bg-cream-dark/50'
        }`}
      >
        {label}
      </button>
    </li>
  );
}

function SortableSectionItem({ section, active, onSelect, onToggleVisible, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const label = SECTION_LABELS[section.type] ?? section.type;
  const muted = !section.visible;

  return (
    <li ref={setNodeRef} style={style}>
      <div
        className={`group flex items-center gap-1 rounded-xl pr-1 ${
          active ? 'bg-forest text-cream' : muted ? 'text-mute/70 hover:bg-cream-dark/50' : 'text-ink hover:bg-cream-dark/50'
        }`}
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Glisser pour réordonner"
          className={`cursor-grab active:cursor-grabbing px-1.5 py-2 ${active ? 'text-cream/60 hover:text-cream' : 'text-mute/60 hover:text-mute'}`}
        >
          <GripVertical size={14} />
        </button>
        <button
          type="button"
          onClick={onSelect}
          className="flex-1 text-left text-sm py-2 truncate"
        >
          {label}
        </button>
        <button
          type="button"
          onClick={onToggleVisible}
          aria-label={section.visible ? 'Masquer' : 'Afficher'}
          className={`opacity-60 hover:opacity-100 p-1.5 ${active ? 'hover:text-ochre' : 'hover:text-ochre'}`}
          title={section.visible ? 'Section visible (cliquer pour masquer)' : 'Section masquée (cliquer pour afficher)'}
        >
          {section.visible ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Supprimer"
          className="opacity-0 group-hover:opacity-60 hover:opacity-100 hover:text-ochre p-1.5 transition-opacity"
          title="Supprimer la section"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </li>
  );
}

function AddSectionModal({ onClose, onPick }) {
  return (
    <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-cream rounded-3xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between px-6 py-4 border-b border-cream-dark">
          <h2 className="font-display text-2xl text-forest">Ajouter une section</h2>
          <button onClick={onClose} aria-label="Fermer" className="text-mute hover:text-ochre p-1">
            <X size={18} />
          </button>
        </header>
        <div className="p-6">
          <p className="text-sm text-mute mb-5">
            Choisissez un type. La nouvelle section sera ajoutée à la fin de la liste avec du contenu placeholder, que vous pourrez éditer ensuite.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ADDABLE_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onPick(type)}
                className="text-left bg-white border border-cream-dark rounded-2xl p-4 hover:border-ochre/40 hover:-translate-y-0.5 transition-all"
              >
                <span className="block font-display text-lg text-forest">{SECTION_LABELS[type]}</span>
                <span className="block text-xs text-mute mt-1 capitalize">{type}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditorPane({ selection, draft, content, onChange }) {
  if (selection.kind === 'settings') {
    const Editor = SETTINGS_EDITORS[selection.id];
    const title = SETTINGS_LABELS[selection.id];
    if (!Editor) return <div className="text-mute">Aucun éditeur pour cette clé.</div>;
    return (
      <>
        <h2 className="font-display text-2xl text-forest mb-1">{title}</h2>
        <p className="text-sm text-mute mb-6">Réglage global · clé <code className="bg-cream/60 px-1 rounded">{selection.id}</code></p>
        <Editor value={draft} onChange={onChange} />
      </>
    );
  }

  const section = content.sections.find((s) => s.id === selection.id);
  if (!section) return <div className="text-mute">Section introuvable.</div>;
  const Editor = SECTION_EDITORS[section.type];
  const title = SECTION_LABELS[section.type] ?? section.type;
  if (!Editor) return <div className="text-mute">Aucun éditeur pour le type « {section.type} ».</div>;
  return (
    <>
      <h2 className="font-display text-2xl text-forest mb-1">{title}</h2>
      <p className="text-sm text-mute mb-6">Section · type <code className="bg-cream/60 px-1 rounded">{section.type}</code></p>
      <Editor data={draft} onChange={onChange} />
    </>
  );
}
