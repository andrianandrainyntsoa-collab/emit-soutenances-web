import axios from 'axios';

export const API_URL =
  (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8000/api';

const client = axios.create({
  baseURL: API_URL,
  headers: { Accept: 'application/json' },
});

// Intercepteur : injecte le token Sanctum.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Intercepteur : déconnexion en cas d'invalidation du token.
client.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      if (!window.location.pathname.includes('/connexion')) {
        window.location.href = '/connexion';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Extrait un message lisible d'une erreur de téléchargement.
 *
 * Les erreurs des requêtes `responseType: 'blob'` renvoient le corps
 * JSON de l'API SOUS FORME DE BLOB : sans conversion, l'utilisateur ne
 * voyait aucun message utile (« Request failed with status code 404 »)
 * et pouvait croire à une route inexistante. On lit le blob, on en
 * extrait le message de l'API, sinon on traduit le statut HTTP.
 */
export async function messageErreurBlob(e: any): Promise<string> {
  const data = e?.response?.data;

  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    let message = '';
    try {
      const json = JSON.parse(await data.text());
      if (json?.message) message = json.message;
      else if (json?.errors) message = Object.values(json.errors).flat().join(' ');
    } catch {
      // corps non JSON (page HTML, vide...) : message générique
    }

    if (!message) {
      const statut = e?.response?.status;
      if (statut === 401) {
        message = 'Votre session a expiré. Reconnectez-vous, puis réessayez le téléchargement.';
      } else if (statut === 403) {
        message = 'Accès interdit à ce document.';
      } else if (statut === 404) {
        message = 'Document introuvable sur le serveur : régénérez-le (convocations ou PV), puis réessayez.';
      } else {
        message = `Le serveur a répondu avec une erreur (HTTP ${statut ?? '?'}).`;
      }
    }

    throw new Error(message);
  }

  const r = e?.response?.data;
  if (r?.errors) throw new Error(Object.values(r.errors).flat().join(' '));
  throw new Error(r?.message ?? e?.message ?? 'Une erreur est survenue.');
}

/**
 * Déclenche le téléchargement navigateur d'un PDF déjà reçu en blob.
 *
 * Deux détails qui faisaient « ne pas répondre » les boutons :
 *   - le lien <a> doit être ajouté au DOM avant le clic (Firefox) ;
 *   - `URL.revokeObjectURL()` appelé immédiatement après `click()`
 *     ANNULE le téléchargement dans plusieurs navigateurs : la
 *     révocation est donc différée.
 */
export function declencherTelechargement(contenu: Blob, nomFichier: string) {
  const url = URL.createObjectURL(
    new Blob([contenu], { type: 'application/pdf' })
  );
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nomFichier;
  lien.style.display = 'none';
  document.body.appendChild(lien);
  lien.click();
  setTimeout(() => {
    lien.remove();
    URL.revokeObjectURL(url);
  }, 3_000);
}

/** Télécharge un fichier PDF via l'API en injectant le token. */
export async function telechargerFichier(chemin: string, nomFichier: string) {
  try {
    const reponse = await client.get(chemin, { responseType: 'blob' });
    declencherTelechargement(reponse.data as Blob, nomFichier);
  } catch (e) {
    await messageErreurBlob(e);
  }
}

/** Ouvre un PDF dans un nouvel onglet (consultation / impression). */
export async function ouvrirPdf(chemin: string) {
  try {
    const reponse = await client.get(chemin, { responseType: 'blob' });
    const url = URL.createObjectURL(
      new Blob([reponse.data as Blob], { type: 'application/pdf' })
    );
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (e) {
    await messageErreurBlob(e);
  }
}

export default client;
