import { useEffect, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { Convocations, Espace, Pv } from '../../api/endpoints';
import { declencherTelechargement, messageErreurBlob } from '../../api/client';
import type { Convocation, ProcesVerbal, Resultat, Soutenance } from '../../types';
import {
  Bouton,
  Carte,
  Etiquette,
  EtiquetteStatut,
  MessageErreur,
  Modale,
  Tableau,
  formatDate,
  formatDateHeure,
  formatHeure,
  messageApiErreur,
  nomFichierPv,
} from '../../components/ui';

export default function MonEspace() {
  const [soutenance, setSoutenance] = useState<Soutenance | null | undefined>(undefined);
  const [resultat, setResultat] = useState<Resultat | null>(null);
  const [pv, setPv] = useState<ProcesVerbal[]>([]);
  const [convocations, setConvocations] = useState<Convocation[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = () => {
    Espace.maSoutenance().then((r) => setSoutenance(r.data.soutenance)).catch(() => setSoutenance(null));
    Espace.monResultat().then((r) => setResultat(r.data.resultat)).catch(() => {});
    Pv.monPv().then((r) => setPv(r.data.proces_verbaux ?? [])).catch(() => {});
    Convocations.mesConvocations().then((r) => setConvocations(r.data)).catch(() => {});
  };

  useEffect(charger, []);

  const telecharger = async (c: Convocation | ProcesVerbal, type: 'conv' | 'pv') => {
    try {
      const r =
        type === 'conv'
          ? await Convocations.telecharger((c as Convocation).id)
          : await Pv.telechargerEtudiant((c as ProcesVerbal).id);
      declencherTelechargement(
        r.data as Blob,
        type === 'conv' ? `convocation-${c.id}.pdf` : nomFichierPv(c as ProcesVerbal)
      );
      setErreur(null);
    } catch (e) {
      setErreur(await messageErreurBlob(e));
    }
  };

  if (soutenance === undefined) return null;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-800">Mon espace étudiant</h1>

      <MessageErreur erreur={erreur} />

      {/* Ma soutenance */}
      <Carte titre="Ma soutenance">
        {!soutenance ? (
          <div className="text-slate-500 text-sm py-4 text-center">
            Aucune soutenance enregistrée pour le moment.
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Mémoire :</span> <b>{soutenance.titre_memoire}</b></div>
              <div className="flex items-center gap-2"><span className="text-slate-500">Statut :</span> <EtiquetteStatut statut={soutenance.statut} /></div>
              <div><span className="text-slate-500">Session :</span> {soutenance.session?.nom ?? '—'}</div>
              <div>
                <span className="text-slate-500">Date & heure :</span>{' '}
                {formatDate(soutenance.date_soutenance ?? soutenance.creneau?.date_soutenance)} à{' '}
                {formatHeure(soutenance.heure_debut ?? soutenance.creneau?.heure_debut)}
                {(soutenance.heure_fin ?? soutenance.creneau?.heure_fin)
                  ? ` – ${formatHeure(soutenance.heure_fin ?? soutenance.creneau?.heure_fin)}`
                  : ''}
              </div>
              <div>
                <span className="text-slate-500">Salle :</span>{' '}
                {soutenance.salle ? `${soutenance.salle.code} — ${soutenance.salle.nom}` : '—'}
              </div>
            </div>

            {(soutenance.jury?.membresJury?.length ?? 0) > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Membres du jury</div>
                <ul className="space-y-1 text-sm">
                  {soutenance.jury?.membresJury?.map((m) => (
                    <li key={m.id}>
                      {m.enseignant?.user?.name} — <span className="capitalize text-slate-500">{m.fonction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </Carte>

      {/* Mes convocations */}
      <Carte titre="Mes convocations">
        {convocations.length === 0 ? (
          <div className="text-slate-500 text-sm py-4 text-center">
            Votre convocation sera disponible dès que votre soutenance sera planifiée et confirmée.
          </div>
        ) : (
          <Tableau entetes={['Soutenance', 'Générée', 'Statut', 'Actions']}>
            {convocations.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2.5">
                  <div className="text-sm">{c.soutenance?.titre_memoire}</div>
                  <div className="text-xs text-slate-400">
                    {formatDate(c.soutenance?.creneau?.date_soutenance)} à {formatHeure(c.soutenance?.creneau?.heure_debut)} — Salle {c.soutenance?.salle?.code ?? '—'}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{formatDateHeure(c.date_generation)}</td>
                <td className="px-4 py-2.5">
                  <Etiquette couleur={c.statut === 'envoyee' ? 'bleu' : c.statut === 'consultee' ? 'violet' : 'ambre'}>
                    {c.statut === 'envoyee' ? 'Envoyée' : c.statut === 'consultee' ? 'Consultée' : 'Générée'}
                  </Etiquette>
                </td>
                <td className="px-4 py-2.5">
                  <Bouton variante="primaire" petit onClick={() => telecharger(c, 'conv')}>
                    <Download size={14} /> Télécharger
                  </Bouton>
                </td>
              </tr>
            ))}
          </Tableau>
        )}
      </Carte>

      {/* Mon résultat */}
      <Carte titre="Mon résultat">
        {!resultat ? (
          <div className="text-slate-500 text-sm py-4 text-center">
            Aucun résultat disponible pour le moment. Il sera publié après la délibération et la
            validation du résultat par le président du jury.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <div className="text-xs text-slate-500">Note finale</div>
                <div className="text-2xl font-bold text-primaire-800">{resultat.moyenne_finale ?? '—'}/20</div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-xs text-slate-500">Mention</div>
                <div className="text-lg font-semibold">{resultat.mention ?? '—'}</div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-xs text-slate-500">Décision</div>
                <div className="text-lg font-semibold capitalize">{resultat.decision}</div>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <div className="text-xs text-slate-500">Statut</div>
                {resultat.valide_le ? (
                  <Etiquette couleur="vert">Validé le {formatDate(resultat.valide_le)}</Etiquette>
                ) : (
                  <Etiquette couleur="ambre">En attente</Etiquette>
                )}
              </div>
            </div>
          </>
        )}
      </Carte>

      {/* Mon PV */}
      <Carte titre="Mon procès-verbal">
        {pv.length === 0 ? (
          <div className="text-slate-500 text-sm py-4 text-center">
            Votre procès-verbal sera disponible une fois le résultat validé et le document généré
            par le président du jury.
          </div>
        ) : (
          <Tableau entetes={['N° PV', 'Type', 'Généré le', 'Actions']}>
            {pv.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-2.5 font-mono text-xs font-semibold">{p.numero_pv}</td>
                <td className="px-4 py-2.5">
                  <Etiquette couleur={p.type_master === 'recherche' ? 'violet' : 'bleu'}>
                    {p.type_master === 'recherche' ? 'Master Recherche' : 'Master Professionnel'}
                  </Etiquette>
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{formatDateHeure(p.genere_le)}</td>
                <td className="px-4 py-2.5">
                  <Bouton variante="primaire" petit onClick={() => telecharger(p, 'pv')}>
                    <FileText size={14} /> Télécharger
                  </Bouton>
                </td>
              </tr>
            ))}
          </Tableau>
        )}
      </Carte>
    </div>
  );
}
