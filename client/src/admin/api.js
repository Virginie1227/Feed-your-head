// Tiny fetch wrapper for admin API calls. Cookies are sent automatically.
// On 401 outside the login flow, force a redirect to /admin/login so the user
// re-authenticates instead of seeing cryptic errors.

const AUTH_FLOW_PATHS = new Set(['/auth/login', '/auth/me']);

// Server error codes → messages an editor can act on.
const ERROR_MESSAGES = {
  unauthorized: 'Session expirée : reconnectez-vous.',
  invalid_credentials: 'Email ou mot de passe incorrect.',
  too_many_attempts: 'Trop de tentatives. Réessayez dans 15 minutes.',
  invalid_input: 'Certains champs sont invalides.',
  invalid_json: 'Données invalides envoyées au serveur.',
  payload_too_large: 'Contenu trop volumineux pour être enregistré (max 2 Mo).',
  internal_error: 'Erreur du serveur. Réessayez ; si le problème persiste, contactez le support.',
  not_found: 'Élément introuvable (peut-être supprimé entre-temps).',
  unsupported_heic:
    'Format HEIC (photo iPhone) non pris en charge. Exportez la photo en JPEG, ou envoyez-la depuis l’iPhone directement (conversion automatique).',
  unsupported_mime: 'Format non pris en charge. Formats acceptés : JPEG, PNG, WebP, GIF, SVG.',
  file_too_large: 'Image trop lourde (max 10 Mo).',
  invalid_image: 'Ce fichier n’est pas une image valide ou est corrompu.',
  no_file: 'Aucun fichier reçu.',
  upload_in_use: 'Cette image est encore utilisée sur le site.',
  email_taken: 'Cette adresse email est déjà utilisée.',
  cannot_delete_self: 'Vous ne pouvez pas supprimer votre propre compte.',
  last_admin: 'Impossible de supprimer le dernier administrateur.',
  unknown_section_ids: 'La liste des sections a changé. Rechargez la page.',
};

export function humanizeError(err, fallback = 'Une erreur est survenue.') {
  if (!err) return fallback;
  if (err instanceof TypeError) return 'Serveur injoignable. Vérifiez votre connexion.';
  return ERROR_MESSAGES[err.message] ?? fallback;
}

async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    if (
      res.status === 401 &&
      !AUTH_FLOW_PATHS.has(path) &&
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/admin/login')
    ) {
      const next = encodeURIComponent(window.location.pathname);
      window.location.assign(`/admin/login?next=${next}`);
    }
    const err = new Error(body?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export const api = {
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  content: () => request('/content'),
  updateSection: (id, payload) =>
    request(`/sections/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  updateSettings: (key, value) =>
    request(`/settings/${key}`, { method: 'PUT', body: JSON.stringify({ value }) }),
  listUploads: () => request('/uploads'),
  uploadFile: async (file, alt = '') => {
    const fd = new FormData();
    fd.append('file', file);
    if (alt) fd.append('alt', alt);
    const res = await fetch('/api/uploads', {
      method: 'POST',
      credentials: 'same-origin',
      body: fd,
    });
    // The response may not be JSON (proxy error page, 413 from Railway…).
    const isJson = res.headers.get('content-type')?.includes('application/json');
    const body = isJson ? await res.json().catch(() => null) : null;
    if (!res.ok) {
      const err = new Error(body?.error || (res.status === 413 ? 'file_too_large' : `HTTP ${res.status}`));
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return body;
  },
  updateUpload: (id, alt) =>
    request(`/uploads/${id}`, { method: 'PATCH', body: JSON.stringify({ alt }) }),
  deleteUpload: (id, { force = false } = {}) =>
    request(`/uploads/${id}${force ? '?force=1' : ''}`, { method: 'DELETE' }),

  createSection: (type) =>
    request('/sections', { method: 'POST', body: JSON.stringify({ type }) }),
  deleteSection: (id) => request(`/sections/${id}`, { method: 'DELETE' }),
  reorderSections: (orderIds) =>
    request('/sections/reorder', { method: 'POST', body: JSON.stringify({ order: orderIds }) }),

  listUsers: () => request('/users'),
  createUser: ({ email, password, name }) =>
    request('/users', { method: 'POST', body: JSON.stringify({ email, password, name }) }),
  updateUser: (id, patch) =>
    request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  listRevisions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/revisions${qs ? `?${qs}` : ''}`);
  },
  getRevision: (id) => request(`/revisions/${id}`),
  restoreRevision: (id) => request(`/revisions/${id}/restore`, { method: 'POST' }),

  analyticsStats: (range = '30d') => request(`/analytics/stats?range=${encodeURIComponent(range)}`),
};
