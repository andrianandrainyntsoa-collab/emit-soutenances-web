import { useEffect, useState } from 'react';
import { Plus, Trash2, CheckCircle2, FileText, CalendarPlus } from 'lucide-react';
import {
  Convocations,
  Etudiants,
  Jurys,
  Salles,
  Sessions,
  Soutenances,
} from '../../api/endpoints';
import type { Etudiant, Jury, Salle, SessionSoutenance, Soutenance } from '../../types';
import { useAuth } from '../../context/AuthContext';
import {
  Bouton,
  Carte,
  Champ,
  EtiquetteStatut,
  MessageErreur,
  Modale,
  Tableau,
  champCss,
  formatDate,
  formatHeure,
  messageApiErreur,
} from '../../components/ui';

const VIDE = {
  etudiant_id: '',
  session_id: '',
  jury_id: '',
  salle_id: '',
  date_soutenance: '',
  heure_debut: '',
  heure_fin: '',
  titre_memoire: '',
  observations: '',
};

function heureFinApres90Minutes(heureDebut: string): string {
  if (!/^\d{2}:\d{2}$/.test(heureDebut)) return '';

  const [heures, minutes] = heureDebut.split(':').map(Number);
  const total = heures * 60 + minutes + 90;

  if (!Number.isFinite(total) || total >= 24 * 60) return '';

  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function dureeEst90Minutes(heureDebut: string, heureFin: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(heureDebut) || !/^\d{2}:\d{2}$/.test(heureFin)) return false;
  const minutes = (heure: string) => {
    const [heures, minutes] = heure.split(':').map(Number);
    return heures * 60 + minutes;
  };

  return minutes(heureFin) - minutes(heureDebut) === 90;
}

/**
 * Planification des soutenances (BF05).
 *
 * - La date, l'heure de début et l'heure de fin sont sélectionnées
 *   directement dans la modale (la page « Créneaux » est supprimée) ;
 *   la durée est fixée à 90 minutes.
 * - Seules les sessions OUVERTES à la planification sont proposées.
 * - Les étudiants ayant déjà une soutenance planifiée ou active ne
 *   sont pas proposés (filtrage backend).
 * - Après saisie des horaires, seuls les groupes de jury DISPONIBLES
 *   sur cet intervalle sont proposés (filtrage backend) ; les
 *   conflits sont revérifiés au moment de l'enregistrement.
 * - Le jury est affiché par son NOM DE GROUPE (identifiant technique
 *   conservé en arrière-plan).
 */
export default function SoutenancesPage() {
  const { role } = useAuth();
  const estAdministrateur = role === 'administrateur';
  const [items, setItems] = useState<Soutenance[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtreSession, setFiltreSession] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
  const [sessions, setSessions] = useState<SessionSoutenance[]>([]);
  const [sessionsDisponibles, setSessionsDisponibles] = useState<SessionSoutenance[]>([]);
  const [salles, setSalles] = useState<Salle[]>([]);

  const [modale, setModale] = useState<Soutenance | null>(null);
  const [form, setForm] = useState({ ...VIDE });
  const [nouveau, setNouveau] = useState(true);

  // Jurys disponibles recalculés selon l'intervalle choisi.
  const [jurysDisponibles, setJurysDisponibles] = useState<Jury[]>([]);
  const [chargementJurys, setChargementJurys] = useState(false);

  const charger = (p = page) => {
    Soutenances.liste({
      page: p,
      per_page: 15,
      statut: filtreStatut || undefined,
      session_id: filtreSession || undefined,
    })
      .then((r) => {
        setItems(r.data.data);
        setPage(r.data.current_page);
        setLastPage(r.data.last_page);
      })
      .catch((e) => setErreur(messageApiErreur(e)));
  };

  useEffect(() => {
    charger(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtreStatut, filtreSession]);

  useEffect(() => {
    // Étudiants SANS soutenance planifiée/active (filtrage backend).
    Etudiants.liste({ per_page: 200, autorise: true, sans_soutenance_active: 1 })
      .then((r) => setEtudiants(r.data.data))
      .catch(() => {});
    Sessions.liste().then((r) => setSessions(r.data)).catch(() => {});
    // Sessions réellement disponibles pour une nouvelle planification.
    Sessions.liste({ disponibles: 1 }).then((r) => setSessionsDisponibles(r.data)).catch(() => {});
    Salles.liste().then((r) => setSalles(r.data)).catch(() => {});
  }, []);

  // Recharge les jurys disponibles dès que session + horaires sont connus.
  useEffect(() => {
    if (
      !form.session_id
      || !form.date_soutenance
      || !dureeEst90Minutes(form.heure_debut, form.heure_fin)
    ) {
      setJurysDisponibles([]);
      return;
    }
    setChargementJurys(true);
    Jurys.disponibles({
      session_id: form.session_id,
      date: form.date_soutenance,
      heure_debut: form.heure_debut,
      heure_fin: form.heure_fin,
      ignorer_soutenance_id: nouveau ? undefined : (modale?.id as number),
    })
      .then((r) => setJurysDisponibles(r.data))
      .catch(() => setJurysDisponibles([]))
      .finally(() => setChargementJurys(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.session_id, form.date_soutenance, form.heure_debut, form.heure_fin]);

  const ouvrirCreation = () => {
    setForm({ ...VIDE });
    setNouveau(true);
    setModale({} as Soutenance);
  };

  const ouvrirModif = (s: Soutenance) => {
    setForm({
      etudiant_id: String(s.etudiant_id),
      session_id: String(s.session_id),
      jury_id: s.jury_id ? String(s.jury_id) : '',
      salle_id: s.salle_id ? String(s.salle_id) : '',
      date_soutenance: s.date_soutenance ? s.date_soutenance.slice(0, 10) : (s.creneau?.date_soutenance?.slice(0, 10) ?? ''),
      heure_debut: s.heure_debut ? s.heure_debut.slice(0, 5) : (s.creneau?.heure_debut?.slice(0, 5) ?? ''),
      heure_fin: s.heure_fin ? s.heure_fin.slice(0, 5) : (s.creneau?.heure_fin?.slice(0, 5) ?? ''),
      titre_memoire: s.titre_memoire,
      observations: s.observations ?? '',
    });
    setNouveau(false);
    setModale(s);
  };

  const enregistrer = async () => {
    if (!modale) return;
    setErreur(null);
    try {
      const donnees: Record<string, unknown> = {
        etudiant_id: Number(form.etudiant_id),
        session_id: Number(form.session_id),
        jury_id: form.jury_id ? Number(form.jury_id) : null,
        salle_id: form.salle_id ? Number(form.salle_id) : null,
        date_soutenance: form.date_soutenance,
        heure_debut: form.heure_debut,
        heure_fin: form.heure_fin,
        titre_memoire: form.titre_memoire,
        observations: form.observations || null,
      };
      if (nouveau) await Soutenances.creer(donnees);
      else await Soutenances.maj(modale.id, donnees);
      setModale(null);
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  const action = async (s: Soutenance, a: 'confirmer' | 'terminer' | 'ajourner' | 'supprimer') => {
    const confirmations: Record<string, string> = {
      confirmer: `Confirmer la soutenance de ${s.etudiant?.user?.name} ? Une soutenance confirmée ne peut plus être annulée ni ajournée.`,
      terminer: `Marquer comme terminée la soutenance de ${s.etudiant?.user?.name} ?`,
      ajourner: `Ajourner (reporter) la soutenance de ${s.etudiant?.user?.name} ?`,
      supprimer: `Supprimer la soutenance de ${s.etudiant?.user?.name} ? Les données liées non officielles seront retirées.`,
    };
    if (!window.confirm(confirmations[a])) return;
    try {
      if (a === 'confirmer') await Soutenances.confirmer(s.id);
      if (a === 'terminer') await Soutenances.terminer(s.id);
      if (a === 'ajourner') await Soutenances.ajourner(s.id);
      if (a === 'supprimer') await Soutenances.supprimer(s.id);
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  const dateHeureAffichee = (s: Soutenance) => {
    const date = s.date_soutenance ?? s.creneau?.date_soutenance;
    if (!date) return '—';
    const debut = s.heure_debut ?? s.creneau?.heure_debut;
    const fin = s.heure_fin ?? s.creneau?.heure_fin;
    return `${formatDate(date)} · ${formatHeure(debut)}${fin ? `–${formatHeure(fin)}` : ''}`;
  };

  const horairesComplets =
    form.session_id !== ''
    && form.date_soutenance !== ''
    && dureeEst90Minutes(form.heure_debut, form.heure_fin);

  const planningComplet = horairesComplets && form.jury_id !== '' && form.salle_id !== '';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">Planification des soutenances</h1>
        {estAdministrateur && (
          <Bouton onClick={ouvrirCreation}><Plus size={16} /> Nouvelle soutenance</Bouton>
        )}
      </div>

      <MessageErreur erreur={erreur} />

      <div className="flex flex-wrap gap-2">
        <select className={champCss + ' w-48'} value={filtreSession} onChange={(e) => setFiltreSession(e.target.value)}>
          <option value="">Toutes les sessions</option>
          {sessions.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
        </select>
        <select className={champCss + ' w-48'} value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="a_planifier">À planifier</option>
          <option value="planifiee">Planifiée</option>
          <option value="confirmee">Confirmée</option>
          <option value="terminee">Terminée</option>
          <option value="ajournee">Ajournée</option>
        </select>
      </div>

      <Carte>
        <Tableau
          entetes={['Étudiant', 'Mémoire', 'Date et horaires', 'Salle', 'Groupe de jury', 'Statut', 'Actions']}
          vide={items.length === 0}
        >
          {items.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50 align-top">
              <td className="px-4 py-2.5">
                <div className="font-medium">{s.etudiant?.user?.name}</div>
                <div className="text-xs text-slate-400">{s.etudiant?.numero_etudiant}</div>
              </td>
              <td className="px-4 py-2.5 max-w-56">
                <div className="truncate text-sm" title={s.titre_memoire}>{s.titre_memoire}</div>
              </td>
              <td className="px-4 py-2.5 text-sm text-slate-600">{dateHeureAffichee(s)}</td>
              <td className="px-4 py-2.5 text-sm">{s.salle?.code ?? '—'}</td>
              <td className="px-4 py-2.5 text-sm">{s.jury ? (s.jury.nom ?? s.jury.code) : '—'}</td>
              <td className="px-4 py-2.5"><EtiquetteStatut statut={s.statut} /></td>
              <td className="px-4 py-2.5">
                {estAdministrateur && (
                  <div className="flex flex-wrap gap-1.5">
                    {['a_planifier', 'planifiee', 'ajournee'].includes(s.statut) && (
                      <Bouton variante="secondaire" petit onClick={() => ouvrirModif(s)}>Planifier</Bouton>
                    )}
                    {s.statut === 'planifiee' && planningOk(s) && (
                      <Bouton variante="succes" petit onClick={() => action(s, 'confirmer')}>
                        <CheckCircle2 size={14} /> Confirmer
                      </Bouton>
                    )}
                    {['planifiee', 'confirmee'].includes(s.statut) && (
                      <>
                        <Bouton variante="accent" petit onClick={() => genererConvocations(s)}>
                          <FileText size={14} /> Convocations
                        </Bouton>
                        <Bouton variante="secondaire" petit onClick={() => action(s, 'terminer')}>Terminer</Bouton>
                      </>
                    )}
                    {['a_planifier', 'planifiee', 'ajournee'].includes(s.statut) && !s.resultat && (
                      <Bouton variante="secondaire" petit onClick={() => action(s, 'ajourner')}>Ajourner</Bouton>
                    )}
                    {s.statut !== 'confirmee' && (
                      <Bouton variante="danger" petit onClick={() => action(s, 'supprimer')} titre={s.statut === 'terminee' ? 'Supprimer la soutenance terminée' : 'Supprimer la soutenance'}>
                        <Trash2 size={14} />
                      </Bouton>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </Tableau>

        {lastPage > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-slate-500">Page {page} / {lastPage}</span>
            <div className="flex gap-2">
              <Bouton variante="secondaire" petit desactive={page <= 1} onClick={() => charger(page - 1)}>Précédent</Bouton>
              <Bouton variante="secondaire" petit desactive={page >= lastPage} onClick={() => charger(page + 1)}>Suivant</Bouton>
            </div>
          </div>
        )}
      </Carte>

      <Modale
        ouvert={!!modale}
        onFermer={() => setModale(null)}
        titre={nouveau ? 'Nouvelle soutenance' : 'Planifier la soutenance'}
        large
      >
        <div className="space-y-4">
          <MessageErreur erreur={erreur} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Champ label="Étudiant (autorisé, sans soutenance active)" requis>
              <select className={champCss} value={form.etudiant_id} onChange={(e) => setForm({ ...form, etudiant_id: e.target.value })}>
                <option value="">— Choisir —</option>
                {etudiants.map((e) => (
                  <option key={e.id} value={e.id}>{e.user?.name} ({e.numero_etudiant})</option>
                ))}
              </select>
            </Champ>
            <Champ label="Session (ouverte à la planification)" requis>
              <select className={champCss} value={form.session_id} onChange={(e) => setForm({ ...form, session_id: e.target.value, jury_id: '' })}>
                <option value="">— Choisir —</option>
                {sessionsDisponibles.map((s) => (
                  <option key={s.id} value={s.id}>{s.nom}</option>
                ))}
              </select>
            </Champ>
          </div>
          <Champ label="Titre du mémoire" requis>
            <input className={champCss} value={form.titre_memoire} onChange={(e) => setForm({ ...form, titre_memoire: e.target.value })} />
          </Champ>

          <div className="grid sm:grid-cols-3 gap-4">
            <Champ label="Date" requis>
              <input
                type="date"
                className={champCss}
                value={form.date_soutenance}
                min={sessionsDisponibles.find((s) => String(s.id) === form.session_id)?.date_debut?.slice(0, 10)}
                max={sessionsDisponibles.find((s) => String(s.id) === form.session_id)?.date_fin?.slice(0, 10)}
                onChange={(e) => setForm({ ...form, date_soutenance: e.target.value, jury_id: '' })}
              />
            </Champ>
            <Champ label="Heure de début" requis>
              <input
                type="time"
                className={champCss}
                value={form.heure_debut}
                onChange={(e) => setForm({
                  ...form,
                  heure_debut: e.target.value,
                  heure_fin: heureFinApres90Minutes(e.target.value),
                  jury_id: '',
                })}
              />
            </Champ>
            <Champ label="Heure de fin (90 min après le début)" requis>
              <input
                type="time"
                className={champCss}
                value={form.heure_fin}
                readOnly
              />
            </Champ>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Champ
              label="Groupe de jury (disponibles sur cet intervalle)"
              requis
            >
              <select
                className={champCss}
                value={form.jury_id}
                onChange={(e) => setForm({ ...form, jury_id: e.target.value })}
                disabled={!horairesComplets || chargementJurys}
              >
                <option value="">
                  {!horairesComplets
                    ? '— Choisir d\'abord la session, la date et les horaires —'
                    : chargementJurys
                      ? '— Vérification des disponibilités… —'
                      : '— Choisir —'}
                </option>
                {jurysDisponibles.map((j) => (
                  <option key={j.id} value={j.id}>{j.nom ?? j.code} ({(j.membresJury ?? []).length} membre(s))</option>
                ))}
              </select>
            </Champ>
            <Champ label="Salle" requis>
              <select className={champCss} value={form.salle_id} onChange={(e) => setForm({ ...form, salle_id: e.target.value })}>
                <option value="">— Choisir —</option>
                {salles.filter((s) => s.disponible).map((s) => (
                  <option key={s.id} value={s.id}>{s.code} — {s.nom}</option>
                ))}
              </select>
            </Champ>
          </div>

          {horairesComplets && form.heure_fin && form.heure_debut && form.heure_fin <= form.heure_debut && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              L'heure de fin doit être postérieure à l'heure de début.
            </p>
          )}
          {form.heure_debut && form.heure_fin && !dureeEst90Minutes(form.heure_debut, form.heure_fin) && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              La durée d'une soutenance doit être exactement de 90 minutes. Choisissez une heure de début plus tôt.
            </p>
          )}
          {form.heure_debut && !form.heure_fin && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              La soutenance doit se terminer le même jour. Choisissez une heure de début plus tôt.
            </p>
          )}

          <div className="rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs px-3 py-2 flex gap-2">
            <CalendarPlus size={16} className="shrink-0 mt-0.5" />
            Le système vérifie automatiquement les conflits (salle déjà réservée, groupe de jury
            et membres engagés) au moment de l'enregistrement. Chaque soutenance dure 90 minutes.
          </div>
          <Champ label="Observations">
            <textarea className={champCss} rows={2} value={form.observations} onChange={(e) => setForm({ ...form, observations: e.target.value })} />
          </Champ>
          <div className="flex justify-end gap-2">
            <Bouton variante="secondaire" onClick={() => setModale(null)}>Annuler</Bouton>
            <Bouton onClick={enregistrer} desactive={!planningComplet || (form.heure_fin !== '' && form.heure_fin <= form.heure_debut)}>
              {nouveau ? 'Créer' : 'Enregistrer'}
            </Bouton>
          </div>
        </div>
      </Modale>
    </div>
  );

  function planningOk(s: Soutenance): boolean {
    const date = s.date_soutenance ?? s.creneau?.date_soutenance;
    const debut = s.heure_debut ?? s.creneau?.heure_debut;
    const fin = s.heure_fin ?? s.creneau?.heure_fin;
    return !!(s.jury_id && s.salle_id && date && debut && fin);
  }

  async function genererConvocations(s: Soutenance) {
    try {
      await Convocations.generer(s.id);
      window.alert('Convocations générées. Retrouvez-les dans la page Convocations pour l\'envoi groupé.');
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  }
}
