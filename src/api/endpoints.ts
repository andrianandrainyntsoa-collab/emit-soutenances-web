import client from './client';
import type {
  AuditLog,
  Convocation,
  Creneau,
  DashboardData,
  Deliberation,
  DisponibiliteJury,
  DisponibiliteSalle,
  Enseignant,
  Etudiant,
  Evaluation,
  Formation,
  Jury,
  Notification,
  Pagination,
  Parcours,
  Promotion,
  ProcesVerbal,
  Resultat,
  Role,
  Salle,
  SessionSoutenance,
  Soutenance,
  User,
} from '../types';

// ------------------------- Authentification -------------------------
export const Auth = {
  login: (email: string, password: string) =>
    client.post<{ token: string; user: User }>('/login', { email, password }),
  logout: () => client.post('/logout'),
  user: () => client.get<User>('/user'),
};

// ------------------------------ Profil ------------------------------
export const Profil = {
  voir: () => client.get<User>('/profil'),
  maj: (d: {
    name?: string;
    telephone?: string;
    specialite?: string;
    mot_de_passe_actuel?: string;
    password?: string;
    password_confirmation?: string;
  }) => client.put('/profil', d),
};

// ---------------------------- Dashboard -----------------------------
export const Dashboard = {
  voir: () => client.get<DashboardData>('/dashboard'),
};

// --------------------------- Notifications --------------------------
export const Notifications = {
  liste: () =>
    client.get<{ notifications: Notification[]; non_lues: number }>(
      '/notifications'
    ),
  nbNonLues: () =>
    client.get<{ non_lues: number }>('/notifications/non-lues-count'),
  marquerLue: (id: number) => client.post(`/notifications/${id}/lue`),
  marquerToutes: () => client.post('/notifications/tout-marquer-lues'),
  /** Supprime une notification de l'utilisateur connecté. */
  supprimer: (id: number) => client.delete(`/notifications/${id}`),
  /**
   * Supprime toutes les notifications (ou seulement les lues quand
   * `luesSeulement` est vrai).
   */
  supprimerToutes: (luesSeulement = false) =>
    client.delete<{ message: string; supprimees: number }>('/notifications', {
      params: luesSeulement ? { lues_seulement: 1 } : undefined,
    }),
};

// --------------------------- Utilisateurs ---------------------------
export const Users = {
  liste: (params?: Record<string, unknown>) =>
    client.get<Pagination<User>>('/users', { params }),
  roles: () => client.get<Role[]>('/users/roles'),
  voir: (id: number) => client.get<User>(`/users/${id}`),
  creer: (d: Record<string, unknown>) => client.post('/users', d),
  maj: (id: number, d: Record<string, unknown>) => client.put(`/users/${id}`, d),
  supprimer: (id: number) => client.delete(`/users/${id}`),
  autoriser: (id: number, autorise: boolean) =>
    client.post(`/users/${id}/autoriser`, { est_autorise: autorise }),
};

// ----------------------------- Étudiants ----------------------------
export const Etudiants = {
  liste: (params?: Record<string, unknown>) =>
    client.get<Pagination<Etudiant>>('/etudiants', { params }),
  voir: (id: number) => client.get<Etudiant>(`/etudiants/${id}`),
  supprimer: (id: number) => client.delete(`/etudiants/${id}`),
  autoriser: (id: number, autorise: boolean) =>
    client.post(`/etudiants/${id}/autoriser`, { autorise_soutenance: autorise }),
};

// ---------------------------- Enseignants ---------------------------
export const Enseignants = {
  liste: (params?: Record<string, unknown>) =>
    client.get<Pagination<Enseignant>>('/enseignants', { params }),
  voir: (id: number) => client.get<Enseignant>(`/enseignants/${id}`),
  supprimer: (id: number) => client.delete(`/enseignants/${id}`),
};

// ----------------------- Référentiels académiques -------------------
export const Formations = {
  liste: () => client.get<Formation[] | { data: Formation[] }>('/formations'),
  creer: (d: Record<string, unknown>) => client.post('/formations', d),
  maj: (id: number, d: Record<string, unknown>) => client.put(`/formations/${id}`, d),
  supprimer: (id: number) => client.delete(`/formations/${id}`),
};

export const ParcoursApi = {
  liste: () => client.get<Parcours[] | { data: Parcours[] }>('/parcours'),
  creer: (d: Record<string, unknown>) => client.post('/parcours', d),
  maj: (id: number, d: Record<string, unknown>) => client.put(`/parcours/${id}`, d),
  supprimer: (id: number) => client.delete(`/parcours/${id}`),
};

export const Promotions = {
  liste: () => client.get<Promotion[] | { data: Promotion[] }>('/promotions'),
  creer: (d: Record<string, unknown>) => client.post('/promotions', d),
  maj: (id: number, d: Record<string, unknown>) => client.put(`/promotions/${id}`, d),
  supprimer: (id: number) => client.delete(`/promotions/${id}`),
};

// ----------------------------- Sessions -----------------------------
export const Sessions = {
  liste: (params?: Record<string, unknown>) =>
    client.get<SessionSoutenance[]>('/sessions', { params }),
  voir: (id: number) => client.get<SessionSoutenance>(`/sessions/${id}`),
  creer: (d: Record<string, unknown>) => client.post('/sessions', d),
  maj: (id: number, d: Record<string, unknown>) => client.put(`/sessions/${id}`, d),
  supprimer: (id: number) => client.delete(`/sessions/${id}`),
  ouvrir: (id: number) => client.post(`/sessions/${id}/ouvrir`),
  cloturer: (id: number) => client.post(`/sessions/${id}/cloturer`),
};

// ------------------------- Salles & créneaux ------------------------
export const Salles = {
  liste: () => client.get<Salle[]>('/salles'),
  creer: (d: Record<string, unknown>) => client.post('/salles', d),
  maj: (id: number, d: Record<string, unknown>) => client.put(`/salles/${id}`, d),
  supprimer: (id: number) => client.delete(`/salles/${id}`),
};

export const Creneaux = {
  liste: (params?: Record<string, unknown>) =>
    client.get<Creneau[] | { data: Creneau[] }>('/creneaux', { params }),
  creer: (d: Record<string, unknown>) => client.post('/creneaux', d),
  maj: (id: number, d: Record<string, unknown>) => client.put(`/creneaux/${id}`, d),
  supprimer: (id: number) => client.delete(`/creneaux/${id}`),
};

export const DispoSalle = {
  liste: (params?: Record<string, unknown>) =>
    client.get<DisponibiliteSalle[]>('/disponibilites-salle', { params }),
  creer: (d: Record<string, unknown>) => client.post('/disponibilites-salle', d),
  supprimer: (id: number) => client.delete(`/disponibilites-salle/${id}`),
};

export const DispoJury = {
  liste: (params?: Record<string, unknown>) =>
    client.get<DisponibiliteJury[]>('/disponibilites-jury', { params }),
  creer: (d: Record<string, unknown>) => client.post('/disponibilites-jury', d),
  supprimer: (id: number) => client.delete(`/disponibilites-jury/${id}`),
  mes: () => client.get<DisponibiliteJury[]>('/mes-disponibilites'),
  creerPerso: (d: Record<string, unknown>) =>
    client.post('/mes-disponibilites', d),
  supprimerPerso: (id: number) =>
    client.delete(`/disponibilites-jury/${id}`),
};

// ------------------------------- Jurys ------------------------------
export const Jurys = {
  liste: (params?: Record<string, unknown>) =>
    client.get<Jury[]>('/jurys', { params }),
  disponibles: (params: {
    session_id: number | string;
    date: string;
    heure_debut: string;
    heure_fin: string;
    ignorer_soutenance_id?: number;
  }) => client.get<Jury[]>('/jurys/disponibles', { params }),
  voir: (id: number) =>
    client.get<{ jury: Jury; composition_complete: boolean }>(`/jurys/${id}`),
  creer: (d: Record<string, unknown>) => client.post('/jurys', d),
  maj: (id: number, d: Record<string, unknown>) => client.put(`/jurys/${id}`, d),
  supprimer: (id: number) => client.delete(`/jurys/${id}`),
  ajouterMembre: (juryId: number, d: { enseignant_id: number; fonction: string }) =>
    client.post(`/jurys/${juryId}/membres`, d),
  retirerMembre: (juryId: number, membreId: number) =>
    client.delete(`/jurys/${juryId}/membres/${membreId}`),
  mesJurys: () => client.get<Jury[]>('/mes-jurys'),
};

// ---------------------------- Soutenances ---------------------------
export const Soutenances = {
  liste: (params?: Record<string, unknown>) =>
    client.get<Pagination<Soutenance>>('/soutenances', { params }),
  voir: (id: number) => client.get<Soutenance>(`/soutenances/${id}`),
  creer: (d: Record<string, unknown>) => client.post('/soutenances', d),
  maj: (id: number, d: Record<string, unknown>) => client.put(`/soutenances/${id}`, d),
  supprimer: (id: number) => client.delete(`/soutenances/${id}`),
  confirmer: (id: number) => client.post(`/soutenances/${id}/confirmer`),
  terminer: (id: number) => client.post(`/soutenances/${id}/terminer`),
  ajourner: (id: number) => client.post(`/soutenances/${id}/ajourner`),
};

export const Espace = {
  maSoutenance: () =>
    client.get<{ soutenance: Soutenance | null }>('/ma-soutenance'),
  monResultat: () =>
    client.get<{ resultat: Resultat | null }>('/mon-resultat'),
  monEspaceEnseignant: () =>
    client.get<{ enseignant: Enseignant; soutenances: Soutenance[] }>(
      '/mon-espace-enseignant'
    ),
};

// --------------------------- Convocations ---------------------------
export const Convocations = {
  parSoutenance: (inclureEnvoyees = false) =>
    client.get<{ groupes: GroupeConvocations[] }>('/convocations/par-soutenance', {
      params: inclureEnvoyees ? { inclure_envoyees: 1 } : undefined,
    }),
  liste: (params?: Record<string, unknown>) =>
    client.get<Pagination<Convocation>>('/convocations', { params }),
  generer: (soutenanceId: number) =>
    client.post(`/soutenances/${soutenanceId}/convocations/generer`),
  envoyerPourSoutenance: (soutenanceId: number) =>
    client.post<ReponseEnvoiConvocations>(`/soutenances/${soutenanceId}/convocations/envoyer`),
  envoyer: (id: number) => client.post(`/convocations/${id}/envoyer`),
  mesConvocations: () => client.get<Convocation[]>('/mes-convocations'),
  telecharger: (id: number) =>
    client.get(`/convocations/${id}/telecharger`, { responseType: 'blob' }),
};

export interface GroupeConvocations {
  soutenance: Soutenance;
  destinataires: { id: number; name: string; email: string }[];
  total_convocations: number;
  convocations_envoyees: number;
  toutes_envoyees: boolean;
  emails_manquants: number;
  envoyable: boolean;
}

export interface ReponseEnvoiConvocations {
  message: string;
  reussi: boolean;
  total: number;
  envoyees: Convocation[];
  echecs: { destinataire: string; email: string | null; erreur: string }[];
}

// --------------------------- Évaluations ----------------------------
export const Evaluations = {
  mesEvaluations: () => client.get<Evaluation[]>('/evaluations'),
  saisir: (soutenanceId: number, d: { note: number; commentaire?: string }) =>
    client.post(`/soutenances/${soutenanceId}/evaluations`, d),
  valider: (id: number) => client.post(`/evaluations/${id}/valider`),
};

// --------------------------- Délibération ---------------------------
export const Deliberations = {
  consulter: (soutenanceId: number) =>
    client.get<{
      soutenance: Soutenance;
      evaluations: Evaluation[];
      moyenne_des_evaluations: number | null;
      deliberation: Deliberation | null;
      resultat: Resultat | null;
    }>(`/soutenances/${soutenanceId}/deliberation`),
  ouvrir: (soutenanceId: number) =>
    client.post(`/soutenances/${soutenanceId}/deliberation/ouvrir`),
  enregistrer: (
    soutenanceId: number,
    d: {
      note_finale_retenue: number;
      decision: string;
      mention?: string;
      observations?: string;
    }
  ) =>
    client.post(`/soutenances/${soutenanceId}/deliberation/enregistrer`, d),
  liste: (params?: Record<string, unknown>) =>
    client.get<Deliberation[]>('/deliberations', { params }),
};

// ----------------------------- Résultats ----------------------------
export const Resultats = {
  liste: (params?: Record<string, unknown>) =>
    client.get<{ data: Resultat[] }>('/resultats', { params }),
  valider: (id: number) => client.post(`/resultats/${id}/valider`),
  nettoyer: () => client.post('/resultats/nettoyer'),
  compteRendu: () =>
    client.get('/resultats/compte-rendu', { responseType: 'blob' }),
};

// -------------------------- Procès-verbaux --------------------------
export const Pv = {
  liste: () => client.get<Pagination<ProcesVerbal>>('/proces-verbaux'),

  generer: (resultatId: number, typeMaster: string) =>
    client.post(`/resultats/${resultatId}/proces-verbal`, { type_master: typeMaster }),

  afficher: (id: number) =>
    client.get(`/proces-verbaux/${id}/afficher`, { responseType: 'blob' }),

  telecharger: (id: number) =>
    client.get(`/proces-verbaux/${id}/telecharger`, { responseType: 'blob' }),

  telechargerEtudiant: (id: number) =>
    client.get(`/mes-pv/${id}/telecharger`, { responseType: 'blob' }),

  supprimer: (id: number) => client.delete(`/proces-verbaux/${id}`),

  monPv: () =>
    client.get<{ proces_verbaux: ProcesVerbal[] }>('/mon-proces-verbal'),
};

// ------------------------------ Audit -------------------------------
export const Audit = {
  liste: (params?: Record<string, unknown>) =>
    client.get<Pagination<AuditLog>>('/audit-logs', { params }),
  nettoyer: () => client.delete('/audit-logs'),
};

// -------------------- Historique personnel --------------------------
export const Historique = {
  nettoyer: (soutenanceId?: number) =>
    client.post('/mon-historique/nettoyer', soutenanceId ? { soutenance_id: soutenanceId } : {}),
};
