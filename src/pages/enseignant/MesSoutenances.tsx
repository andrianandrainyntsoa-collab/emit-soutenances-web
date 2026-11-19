import { useEffect, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { Evaluations, Espace } from '../../api/endpoints';
import type { Soutenance } from '../../types';
import {
  Bouton,
  Carte,
  Champ,
  Etiquette,
  EtiquetteStatut,
  MessageErreur,
  Modale,
  Tableau,
  champCss,
  formatDate,
  formatHeure,
  messageApiErreur,
} from '../../components/ui';

/**
 * « Mes Soutenances » de l'espace jury (enseignant) :
 *   - présentation sous forme de TABLEAU clair : étudiant, titre du
 *     mémoire, date, heures, salle, session, groupe de jury, statut ;
 *   - les sections et boutons « Espace délibération » sont supprimés ;
 *   - la gestion des évaluations (saisie / validation) reste
 *     accessible par ligne.
 */
export default function MesSoutenances() {
  const [soutenances, setSoutenances] = useState<Soutenance[]>([]);
  const [moi, setMoi] = useState<{ id: number } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  const [saisie, setSaisie] = useState<{ soutenance: Soutenance; note: string; commentaire: string } | null>(null);

  const charger = () => {
    Espace.monEspaceEnseignant()
      .then((r) => {
        setMoi(r.data.enseignant);
        setSoutenances(r.data.soutenances);
      })
      .catch((e) => setErreur(messageApiErreur(e)));
  };

  useEffect(charger, []);

  const monEvaluation = (s: Soutenance) =>
    s.evaluations?.find((e) => e.enseignant?.id === moi?.id) ?? null;

  const enregistrerEvaluation = async () => {
    if (!saisie) return;
    setErreur(null);
    setSucces(null);
    try {
      await Evaluations.saisir(saisie.soutenance.id, {
        note: Number(saisie.note),
        commentaire: saisie.commentaire || undefined,
      });
      setSaisie(null);
      setSucces('Évaluation enregistrée. Vous pouvez maintenant la valider.');
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  const validerEvaluation = async (s: Soutenance) => {
    const ev = monEvaluation(s);
    if (!ev) return;
    setErreur(null);
    try {
      const r = await Evaluations.valider(ev.id);
      setSucces(r.data.message ?? 'Évaluation validée.');
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  const dateHeure = (s: Soutenance) => {
    const date = s.date_soutenance ?? s.creneau?.date_soutenance;
    const debut = s.heure_debut ?? s.creneau?.heure_debut;
    const fin = s.heure_fin ?? s.creneau?.heure_fin;
    return `${date ? formatDate(date) : '—'} · ${formatHeure(debut)}${fin ? `–${formatHeure(fin)}` : ''}`;
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-slate-800">Mes soutenances (jurys)</h1>

      <MessageErreur erreur={erreur} />
      {succes && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm">
          {succes}
        </div>
      )}

      <Carte>
        <Tableau
          entetes={['Étudiant', 'Titre du mémoire', 'Date', 'Heures', 'Salle', 'Session', 'Groupe de jury', 'Statut', 'Actions']}
          vide={soutenances.length === 0}
        >
          {soutenances.map((s) => {
            const ev = monEvaluation(s);
            return (
              <tr key={s.id} className="hover:bg-slate-50 align-top">
                <td className="px-4 py-2.5">
                  <div className="font-medium">{s.etudiant?.user?.name}</div>
                  <div className="text-xs text-slate-400">{s.etudiant?.numero_etudiant}</div>
                </td>
                <td className="px-4 py-2.5 max-w-52">
                  <div className="truncate text-sm" title={s.titre_memoire}>{s.titre_memoire}</div>
                </td>
                <td className="px-4 py-2.5 text-sm text-slate-600">
                  {formatDate(s.date_soutenance ?? s.creneau?.date_soutenance)}
                </td>
                <td className="px-4 py-2.5 text-sm text-slate-600">
                  {formatHeure(s.heure_debut ?? s.creneau?.heure_debut)}
                  {s.heure_fin || s.creneau?.heure_fin
                    ? ` – ${formatHeure(s.heure_fin ?? s.creneau?.heure_fin)}`
                    : ''}
                </td>
                <td className="px-4 py-2.5 text-sm">{s.salle?.code ?? '—'}</td>
                <td className="px-4 py-2.5 text-sm text-slate-600">{s.session?.nom ?? '—'}</td>
                <td className="px-4 py-2.5 text-sm">{s.jury ? (s.jury.nom ?? s.jury.code) : '—'}</td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-col gap-1 items-start">
                    <EtiquetteStatut statut={s.statut} />
                    {ev && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-500">Ma note : <b>{ev.note}/20</b></span>
                        {ev.validee ? (
                          <Etiquette couleur="vert">Validée</Etiquette>
                        ) : (
                          <Etiquette couleur="ambre">À valider</Etiquette>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  {ev && !ev.validee ? (
                    <Bouton variante="succes" petit onClick={() => validerEvaluation(s)}>
                      <ClipboardCheck size={14} /> Valider
                    </Bouton>
                  ) : (
                    <Bouton
                      variante="secondaire"
                      petit
                      onClick={() => setSaisie({ soutenance: s, note: ev?.note ?? '', commentaire: ev?.commentaire ?? '' })}
                      desactive={s.resultat != null}
                    >
                      {ev ? 'Modifier ma note' : 'Saisir ma note'}
                    </Bouton>
                  )}
                </td>
              </tr>
            );
          })}
        </Tableau>

        {soutenances.length === 0 && (
          <p className="text-slate-500 text-center py-8">
            Vous n'êtes membre d'aucun jury pour le moment.
          </p>
        )}
      </Carte>

      <Modale
        ouvert={!!saisie}
        onFermer={() => setSaisie(null)}
        titre={`Évaluation — ${saisie?.soutenance.etudiant?.user?.name ?? ''}`}
      >
        {saisie && (
          <div className="space-y-4">
            <MessageErreur erreur={erreur} />
            <div className="text-sm text-slate-600">
              Mémoire : <b>{saisie.soutenance.titre_memoire}</b>
            </div>
            <Champ label="Note (0–20)" requis>
              <input
                type="number"
                step="0.25"
                min={0}
                max={20}
                className={champCss}
                value={saisie.note}
                onChange={(e) => setSaisie({ ...saisie, note: e.target.value })}
              />
            </Champ>
            <Champ label="Appréciation / commentaire">
              <textarea
                rows={4}
                className={champCss}
                value={saisie.commentaire}
                onChange={(e) => setSaisie({ ...saisie, commentaire: e.target.value })}
                placeholder="Appréciation sur la prestation de l'étudiant, la maîtrise du sujet…"
              />
            </Champ>
            <p className="text-xs text-slate-400">
              RG04 : chaque membre du jury saisit puis valide sa propre note. La note finale est la
              moyenne des trois notes validées : dès que les trois membres ont validé leur note, le
              résultat est automatiquement enregistré et le PV peut être généré.
            </p>
            <div className="flex justify-end gap-2">
              <Bouton variante="secondaire" onClick={() => setSaisie(null)}>Annuler</Bouton>
              <Bouton onClick={enregistrerEvaluation}>Enregistrer</Bouton>
            </div>
          </div>
        )}
      </Modale>
    </div>
  );
}
