import type { ReactNode } from 'react';
import { X } from 'lucide-react';

// ---------------------------------------------------------------- UI de base

export function Bouton({
  children,
  onClick,
  variante = 'primaire',
  type = 'button',
  desactive,
  className = '',
  petit,
  titre,
}: {
  children: ReactNode;
  onClick?: () => void;
  variante?: 'primaire' | 'secondaire' | 'danger' | 'succes' | 'accent' | 'fantome';
  type?: 'button' | 'submit';
  desactive?: boolean;
  className?: string;
  petit?: boolean;
  titre?: string;
}) {
  const variantes: Record<string, string> = {
    primaire: 'bg-primaire-700 hover:bg-primaire-800 text-white',
    secondaire: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    succes: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    accent: 'bg-accent hover:brightness-95 text-white',
    fantome: 'bg-transparent hover:bg-slate-100 text-slate-600',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={desactive}
      title={titre}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition
        ${petit ? 'px-2.5 py-1.5 text-xs' : 'px-4 py-2 text-sm'}
        ${variantes[variante]} disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function Carte({
  titre,
  actions,
  children,
  className = '',
}: {
  titre?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>
      {(titre || actions) && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <h3 className="font-semibold text-slate-800">{titre}</h3>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Etiquette({ children, couleur = 'slate' }: { children: ReactNode; couleur?: string }) {
  const couleurs: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-700',
    bleu: 'bg-blue-100 text-blue-700',
    vert: 'bg-emerald-100 text-emerald-700',
    rouge: 'bg-red-100 text-red-700',
    ambre: 'bg-amber-100 text-amber-800',
    violet: 'bg-purple-100 text-purple-700',
    gris: 'bg-slate-200 text-slate-600',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${couleurs[couleur] ?? couleurs.slate}`}>
      {children}
    </span>
  );
}

const COULEURS_STATUT: Record<string, string> = {
  a_planifier: 'gris',
  planifiee: 'bleu',
  confirmee: 'violet',
  terminee: 'vert',
  annulee: 'rouge',
  ajournee: 'ambre',
};

export function EtiquetteStatut({ statut }: { statut: string }) {
  const libelles: Record<string, string> = {
    a_planifier: 'À planifier',
    planifiee: 'Planifiée',
    confirmee: 'Confirmée',
    terminee: 'Terminée',
    annulee: 'Annulée',
    ajournee: 'Ajournée',
  };
  return (
    <Etiquette couleur={COULEURS_STATUT[statut] ?? 'slate'}>
      {libelles[statut] ?? statut}
    </Etiquette>
  );
}

export function Champ({
  label,
  children,
  requis,
}: {
  label: string;
  children: ReactNode;
  requis?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700 mb-1">
        {label} {requis && <span className="text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

export const champCss =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primaire-500 focus:border-transparent disabled:bg-slate-100';

export function Modale({
  ouvert,
  onFermer,
  titre,
  children,
  large,
}: {
  ouvert: boolean;
  onFermer: () => void;
  titre: string;
  children: ReactNode;
  large?: boolean;
}) {
  if (!ouvert) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div
        className={`bg-white rounded-xl shadow-xl w-full ${
          large ? 'max-w-3xl' : 'max-w-lg'
        } max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-xl">
          <h3 className="font-semibold text-slate-800">{titre}</h3>
          <button onClick={onFermer} className="p-1 rounded hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Tableau({ entetes, children, vide }: { entetes: string[]; children: ReactNode; vide?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {entetes.map((e) => (
              <th key={e} className="px-4 py-2.5 text-left font-semibold text-slate-600 whitespace-nowrap">
                {e}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {vide ? (
            <tr>
              <td colSpan={entetes.length} className="px-4 py-10 text-center text-slate-400">
                Aucune donnée disponible.
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Chargement({ texte = 'Chargement…' }: { texte?: string }) {
  return (
    <div className="flex items-center justify-center py-16 text-slate-500 gap-3">
      <span className="h-5 w-5 border-2 border-slate-300 border-t-primaire-700 rounded-full animate-spin" />
      {texte}
    </div>
  );
}

export function MessageErreur({ erreur }: { erreur?: string | null }) {
  if (!erreur) return null;
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
      {erreur}
    </div>
  );
}

export function MessageSucces({ texte }: { texte?: string | null }) {
  if (!texte) return null;
  return (
    <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm">
      {texte}
    </div>
  );
}

/** Extrait le message d'erreur d'une réponse API Laravel (422 etc.). */
export function messageApiErreur(e: any): string {
  const r = e?.response?.data;
  if (r?.errors) {
    return Object.values(r.errors).flat().join(' ');
  }
  return r?.message ?? e?.message ?? 'Une erreur est survenue.';
}

export function formatHeure(h?: string | null): string {
  if (!h) return '—';
  return h.substring(0, 5);
}

export function formatDate(d?: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString('fr-FR');
}

export function formatDateHeure(d?: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

/**
 * Nom de fichier lisible d'un PV : numéro du PV + numéro étudiant + nom,
 * identique au nommage côté serveur (facile à retrouver après
 * téléchargement).
 */
export function nomFichierPv(pv: {
  numero_pv: string;
  resultat?: { soutenance?: { etudiant?: { numero_etudiant?: string; user?: { name?: string } } } | null } | null;
}): string {
  const etudiant = pv.resultat?.soutenance?.etudiant;
  const numero = (etudiant?.numero_etudiant ?? 'sans-numero').replace(/[^A-Za-z0-9\-]/g, '');
  const slugNom = (etudiant?.user?.name ?? 'etudiant')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
  return `${pv.numero_pv}_${numero}_${slugNom}.pdf`;
}
