import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  CalendarClock,
  ClipboardList,
  FileText,
  Gavel,
  GraduationCap,
  ScrollText,
  Users,
} from 'lucide-react';
import { Dashboard } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import {
  Carte,
  Chargement,
  Etiquette,
  EtiquetteStatut,
  formatDate,
  formatHeure,
} from '../components/ui';

export default function TableauDeBord() {
  const { role } = useAuth();
  const [donnees, setDonnees] = useState<any>(null);
  const [charge, setCharge] = useState(true);

  useEffect(() => {
    Dashboard.voir()
      .then((r) => setDonnees(r.data.statistiques))
      .catch(() => {})
      .finally(() => setCharge(false));
  }, []);

  if (charge) return <Chargement />;
  if (!donnees) return <Carte>Impossible de charger le tableau de bord.</Carte>;

  // ---------------------------------------------------------------- Admin / Responsable
  if (role === 'administrateur' || role === 'responsable') {
    const stats = donnees.soutenances_par_statut ?? {};
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-slate-800">Tableau de bord</h1>

        <div className="dashboard-grid dashboard-stat-grid">
          <Carte>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center"><GraduationCap size={20} /></div>
              <div>
                <div className="text-2xl font-bold">{donnees.etudiants?.autorises ?? 0}</div>
                <div className="text-xs text-slate-500">Étudiants autorisés</div>
              </div>
            </div>
          </Carte>
          <Carte>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center"><Users size={20} /></div>
              <div>
                <div className="text-2xl font-bold">{donnees.enseignants ?? 0}</div>
                <div className="text-xs text-slate-500">Enseignants</div>
              </div>
            </div>
          </Carte>
          <Carte>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center"><CalendarClock size={20} /></div>
              <div>
                <div className="text-2xl font-bold">{donnees.sessions?.actives ?? 0}</div>
                <div className="text-xs text-slate-500">Sessions actives</div>
              </div>
            </div>
          </Carte>
          <Carte>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center"><FileText size={20} /></div>
              <div>
                <div className="text-2xl font-bold">{donnees.proces_verbaux ?? 0}</div>
                <div className="text-xs text-slate-500">Procès-verbaux</div>
              </div>
            </div>
          </Carte>
        </div>

        <div className="dashboard-grid">
          <Carte titre="Soutenances par statut">
            <div className="space-y-2.5">
              {Object.entries(stats).map(([statut, total]: [string, any]) => (
                <div key={statut} className="flex items-center justify-between">
                  <EtiquetteStatut statut={statut} />
                  <span className="font-semibold">{total}</span>
                </div>
              ))}
            </div>
          </Carte>

          <Carte titre="Évaluations & délibérations">
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between"><span>Évaluations en attente de validation</span><b>{donnees.evaluations?.en_attente_validation ?? 0}</b></div>
              <div className="flex justify-between"><span>Évaluations validées</span><b>{donnees.evaluations?.validees ?? 0}</b></div>
              <div className="flex justify-between"><span>Délibérations enregistrées</span><b>{donnees.deliberations ?? 0}</b></div>
              <div className="flex justify-between"><span>Résultats en attente de validation</span><b>{donnees.resultats?.en_attente_validation ?? 0}</b></div>
              <div className="flex justify-between"><span>Résultats validés (définitifs)</span><b>{donnees.resultats?.valides ?? 0}</b></div>
            </div>
          </Carte>
        </div>

        {donnees.prochaines_soutenances?.length > 0 && (
          <Carte titre="Prochaines soutenances">
            <div className="space-y-3">
              {donnees.prochaines_soutenances.map((s: any) => (
                <div key={s.id} className="flex flex-wrap items-center gap-3 text-sm border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <Building2 size={16} className="text-slate-400" />
                  <b>{s.etudiant?.user?.name}</b>
                  <span className="text-slate-500 truncate max-w-xs">{s.titre_memoire}</span>
                  <EtiquetteStatut statut={s.statut} />
                  <span className="ml-auto text-slate-500">
                    {formatDate(s.creneau?.date_soutenance)} à {formatHeure(s.creneau?.heure_debut)} — Salle {s.salle?.code ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          </Carte>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------- Enseignant
  if (role === 'enseignant') {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-bold text-slate-800">Mon espace jury</h1>
        <div className="dashboard-grid dashboard-stat-grid">
          <Carte>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center"><Gavel size={20} /></div>
              <div>
                <div className="text-2xl font-bold">{donnees.soutenances_jury ?? 0}</div>
                <div className="text-xs text-slate-500">Soutenances (mes jurys)</div>
              </div>
            </div>
          </Carte>
          <Carte>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center"><ClipboardList size={20} /></div>
              <div>
                <div className="text-2xl font-bold">{donnees.evaluations_en_attente ?? 0}</div>
                <div className="text-xs text-slate-500">Évaluations à valider</div>
              </div>
            </div>
          </Carte>
          <Carte>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center"><ScrollText size={20} /></div>
              <div>
                <div className="text-2xl font-bold">{donnees.deliberations_a_conduire ?? 0}</div>
                <div className="text-xs text-slate-500">Délibérations à conduire</div>
              </div>
            </div>
          </Carte>
          <Carte>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center"><Gavel size={20} /></div>
              <div>
                <div className="text-2xl font-bold">{donnees.soutenances_president ?? 0}</div>
                <div className="text-xs text-slate-500">Soutenances présidées</div>
              </div>
            </div>
          </Carte>
        </div>

        {donnees.prochaines_soutenances?.length > 0 && (
          <Carte titre="Mes prochaines soutenances">
            <div className="space-y-3">
              {donnees.prochaines_soutenances.map((s: any) => (
                <div key={s.id} className="flex flex-wrap items-center gap-3 text-sm border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                  <b>{s.etudiant?.user?.name}</b>
                  <span className="text-slate-500 truncate max-w-xs">{s.titre_memoire}</span>
                  <EtiquetteStatut statut={s.statut} />
                  <span className="ml-auto text-slate-500">
                    {formatDate(s.date_soutenance ?? s.creneau?.date_soutenance)} de{' '}
                    {formatHeure(s.heure_debut ?? s.creneau?.heure_debut)} à{' '}
                    {formatHeure(s.heure_fin ?? s.creneau?.heure_fin)} — Salle {s.salle?.code ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          </Carte>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------- Étudiant
  const sout = donnees.soutenance;
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Mon espace étudiant</h1>

      {!donnees.autorise_soutenance ? (
        <Carte>
          <div className="text-slate-600">
            Vous n'êtes pas encore autorisé(e) à soutenir. Contactez la scolarité.
          </div>
        </Carte>
      ) : !sout ? (
        <Carte>
          <div className="text-slate-600">
            Vous êtes autorisé(e) à soutenir. Votre soutenance sera planifiée prochainement par
            l'administration.
          </div>
        </Carte>
      ) : (
        <>
          <Carte titre="Ma soutenance">
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Mémoire :</span> <b>{sout.titre_memoire}</b></div>
              <div className="flex items-center gap-2"><span className="text-slate-500">Statut :</span> <EtiquetteStatut statut={sout.statut} /></div>
              <div><span className="text-slate-500">Session :</span> {sout.session?.nom ?? '—'}</div>
              <div><span className="text-slate-500">Date :</span> {formatDate(sout.creneau?.date_soutenance)} à {formatHeure(sout.creneau?.heure_debut)}</div>
              <div><span className="text-slate-500">Salle :</span> {sout.salle ? `${sout.salle.code} — ${sout.salle.nom}` : '—'}</div>
              <div><span className="text-slate-500">Convocations :</span> {donnees.convocations_disponibles ?? 0}</div>
            </div>
            {sout.jury?.membresJury?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Membres du jury</div>
                <ul className="space-y-1 text-sm">
                  {sout.jury.membresJury.map((m: any) => (
                    <li key={m.id}>
                      {m.enseignant?.user?.name} — <span className="capitalize">{m.fonction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Carte>

          <div className="grid sm:grid-cols-2 gap-4">
            <Link to="/mon-espace" className="block">
              <Carte className="hover:border-primaire-500 transition cursor-pointer h-full">
                <ClipboardList size={22} className="text-primaire-700 mb-2" />
                <div className="font-semibold">Ma convocation</div>
                <div className="text-sm text-slate-500">Consulter et télécharger ma convocation</div>
              </Carte>
            </Link>
            <Link to="/mon-espace" className="block">
              <Carte className="hover:border-primaire-500 transition cursor-pointer h-full">
                <FileText size={22} className="text-primaire-700 mb-2" />
                <div className="font-semibold">Mon résultat & mon PV</div>
                <div className="text-sm text-slate-500">Consulter le résultat final et mon procès-verbal</div>
              </Carte>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
