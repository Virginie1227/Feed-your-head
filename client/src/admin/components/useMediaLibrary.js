import { useCallback, useEffect, useState } from 'react';
import { api, humanizeError } from '../api.js';
import { SECTION_LABELS } from '../editors/SectionEditors.jsx';
import { SETTINGS_LABELS } from '../editors/SettingsEditors.jsx';

// Explicit types (not "image/*"): on iPhone/iPad, Safari then converts HEIC
// photos to JPEG automatically before upload.
export const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml';

// "section:references" → "Références", "settings:brand" → "Marque"
export function placeLabel(place) {
  const [kind, id] = place.split(':');
  return (kind === 'section' ? SECTION_LABELS[id] : SETTINGS_LABELS[id]) ?? id;
}

// Shared state & actions for the Media page and the media picker modal.
export function useMediaLibrary() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listUploads();
      setItems(res.items);
    } catch (err) {
      setError(humanizeError(err, 'Impossible de charger la bibliothèque.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleFiles = async (files) => {
    setError(null);
    setUploading(true);
    const failures = [];
    // Upload one by one; a bad file doesn't stop the others.
    for (const file of files) {
      try {
        await api.uploadFile(file);
      } catch (err) {
        failures.push(`${file.name} : ${humanizeError(err, 'échec de l’envoi.')}`);
      }
    }
    if (failures.length) setError(failures.join('\n'));
    setUploading(false);
    await reload();
  };

  const removeItem = async (item) => {
    const usedIn = item.used_in ?? [];
    const question = usedIn.length
      ? `Cette image est encore affichée sur le site (${usedIn.map(placeLabel).join(', ')}).\n\nLa supprimer quand même ? Elle apparaîtra cassée à ces endroits.`
      : 'Supprimer définitivement cette image ?';
    if (!window.confirm(question)) return;
    setError(null);
    try {
      await api.deleteUpload(item.id, { force: usedIn.length > 0 });
    } catch (err) {
      setError(humanizeError(err, 'Suppression impossible.'));
    }
    await reload();
  };

  const onInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) handleFiles(files);
    e.target.value = '';
  };

  const onDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) handleFiles(files);
  };

  return { items, loading, uploading, error, removeItem, onInputChange, onDrop };
}
