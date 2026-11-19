// Types correspondant à l'API Laravel du backend.

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role_id?: number;
  role?: Role;
  etudiant?: Etudiant | null;
  enseignant?: Enseignant | null;
  est_autorise?: boolean;
  created_at?: string;
}

export interface Formation {
  id: number;
  code: string;
  nom: string;
  description?: string;
  active: boolean;
}

export interface Parcours {
  id: number;
  formation_id: number;
  code: string;
  nom: string;
  description?: string;
  active: boolean;
  formation?: Formation;
}

export interface Promotion {
  id: number;
  formation_id: number;
  parcours_id?: number | null;
  nom: string;
  annee_universitaire: string;
  formation?: Formation;
  parcours?: Parcours | null;
}

export interface Etudiant {
  id: number;
  user_id: number;
  promotion_id: number;
  numero_etudiant: string;
  telephone?: string | null;
  autorise_soutenance: boolean;
  est_autorise?: boolean;
  user?: User;
  promotion?: Promotion;
}

export interface Enseignant {
  id: number;
  user_id: number;
  matricule?: string | null;
  grade?: string | null;
  specialite?: string | null;
  telephone?: string | null;
  est_autorise?: boolean;
  user?: User;
}

export interface SessionSoutenance {
  id: number;
  nom: string;
  date_debut: string;
  date_fin: string;
  annee_universitaire: string;
  statut: 'planification' | 'ouverte' | 'cloturee';
  description?: string | null;
  soutenances_count?: number;
  jurys_count?: number;
}

export interface Salle {
  id: number;
  code: string;
  nom: string;
  capacite: number;
  batiment?: string | null;
  etage?: number | null;
  localisation?: string | null;
  disponible: boolean;
}

export interface Creneau {
  id: number;
  date_soutenance: string;
  heure_debut: string;
  heure_fin: string;
  statut: string;
}

export interface DisponibiliteJury {
  id: number;
  enseignant_id: number;
  date_disponible: string;
  heure_debut: string;
  heure_fin: string;
  enseignant?: Enseignant;
}

export interface DisponibiliteSalle {
  id: number;
  salle_id: number;
  date_disponible: string;
  heure_debut: string;
  heure_fin: string;
  salle?: Salle;
}

export interface Jury {
  id: number;
  session_id: number;
  code: string;
  nom?: string | null;
  session?: SessionSoutenance;
  membres_jury?: MembreJury[];
  membresJury?: MembreJury[];
  soutenances_count?: number;
  ma_fonction?: string;
}

export interface MembreJury {
  id: number;
  jury_id: number;
  enseignant_id: number;
  fonction: 'president' | 'rapporteur' | 'examinateur';
  enseignant?: Enseignant;
}

export type StatutSoutenance =
  | 'a_planifier'
  | 'planifiee'
  | 'confirmee'
  | 'terminee'
  | 'annulee'
  | 'ajournee';

export interface Soutenance {
  id: number;
  etudiant_id: number;
  session_id: number;
  jury_id?: number | null;
  salle_id?: number | null;
  creneau_id?: number | null;
  date_soutenance?: string | null;
  heure_debut?: string | null;
  heure_fin?: string | null;
  titre_memoire: string;
  statut: StatutSoutenance;
  observations?: string | null;
  etudiant?: Etudiant;
  session?: SessionSoutenance;
  jury?: Jury;
  salle?: Salle | null;
  creneau?: Creneau | null;
  evaluations?: Evaluation[];
  resultat?: Resultat | null;
  deliberation?: Deliberation | null;
  convocations?: Convocation[];
}

export interface Convocation {
  id: number;
  soutenance_id: number;
  type_destinataire: 'etudiant' | 'membre_jury';
  destinataire_user_id?: number | null;
  date_generation?: string | null;
  date_envoi?: string | null;
  statut: string;
  soutenance?: Soutenance;
  destinataire?: User | null;
}

export interface Evaluation {
  id: number;
  soutenance_id: number;
  enseignant_id: number;
  note: string;
  commentaire?: string | null;
  validee: boolean;
  validee_le?: string | null;
  enseignant?: Enseignant;
  soutenance?: Soutenance;
}

export interface Deliberation {
  id: number;
  soutenance_id: number;
  president_enseignant_id: number;
  observations?: string | null;
  note_finale_retenue?: string | null;
  mention?: string | null;
  decision: string;
  deliberee_le?: string | null;
  president?: Enseignant;
}

export interface Resultat {
  id: number;
  soutenance_id: number;
  moyenne_finale?: string | null;
  decision: string;
  valide_par?: number | null;
  valide_le?: string | null;
  observations?: string | null;
  archive_le?: string | null;
  mention?: string | null;
  soutenance?: Soutenance;
  proces_verbal?: ProcesVerbal | null;
  procesVerbal?: ProcesVerbal | null;
  validePar?: Enseignant;
}

export interface ProcesVerbal {
  id: number;
  resultat_id: number;
  numero_pv: string;
  type_master: 'professionnel' | 'recherche';
  fichier_path?: string | null;
  genere_le: string;
  statut: string;
  resultat?: Resultat;
  generePar?: Enseignant;
}

export interface Notification {
  id: number;
  user_id: number;
  titre: string;
  message: string;
  type?: string | null;
  lue_le?: string | null;
  created_at?: string;
  donnees?: Record<string, unknown> | null;
}

export interface AuditLog {
  id: number;
  user_id?: number | null;
  action: string;
  entite?: string | null;
  entite_id?: number | null;
  description?: string | null;
  adresse_ip?: string | null;
  created_at: string;
  user?: User | null;
}

export interface DashboardData {
  role: string;
  statistiques: Record<string, any>;
}

export interface Pagination<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from?: number;
  to?: number;
}
