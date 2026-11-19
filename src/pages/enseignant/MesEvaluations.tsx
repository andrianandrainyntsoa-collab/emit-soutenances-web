import { useEffect, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { Evaluations } from '../../api/endpoints';
import type { Evaluation } from '../../types';
import {
  Bouton,
  Carte,
  Etiquette,
  EtiquetteStatut,
  MessageErreur,
  Tableau,
  formatDateHeure,
  messageApiErreur,
} from '../../components/ui';

export default function MesEvaluations() {
  const [items, setItems] = useState<Evaluation[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  const charger = () =>
    Evaluations.mesEvaluations().then((r) => setItems(r.data)).catch((e) => setErreur(messageApiErreur(e)));

  useEffect(() => { charger(); }, []);

  const valider = async (e: Evaluation) => {
    setErreur(null);
    setSucces(null);
    try {
      const r = await Evaluations.valider(e.id);
      setSucces(r.data.message ?? 'Évaluation validée.');
      charger();
    } catch (err) {
      setErreur(messageApiErreur(err));
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Mes évaluations</h1>
        <p className="text-sm text-slate-500">
          Validez votre note après saisie : dès que les trois membres du jury ont validé leur note,
          la moyenne des trois notes devient automatiquement la note finale dans les résultats.
        </p>
      </div>

      <MessageErreur erreur={erreur} />
      {succes && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm">
          {succes}
        </div>
      )}

      <Carte>
        <Tableau
          entetes={['Étudiant', 'Mémoire', 'Statut soutenance', 'Note', 'Validée', 'Action']}
          vide={items.length === 0}
        >
          {items.map((e) => (
            <tr key={e.id} className="hover:bg-slate-50">
              <td className="px-4 py-2.5 font-medium">{e.soutenance?.etudiant?.user?.name}</td>
              <td className="px-4 py-2.5 max-w-56"><div className="truncate text-sm">{e.soutenance?.titre_memoire}</div></td>
              <td className="px-4 py-2.5">{e.soutenance && <EtiquetteStatut statut={e.soutenance.statut} />}</td>
              <td className="px-4 py-2.5 font-semibold">{e.note}/20</td>
              <td className="px-4 py-2.5">
                {e.validee ? (
                  <Etiquette couleur="vert">Validée le {formatDateHeure(e.validee_le)}</Etiquette>
                ) : (
                  <Etiquette couleur="ambre">En attente</Etiquette>
                )}
              </td>
              <td className="px-4 py-2.5">
                {!e.validee && (
                  <Bouton variante="succes" petit onClick={() => valider(e)}>
                    <ClipboardCheck size={14} /> Valider
                  </Bouton>
                )}
              </td>
            </tr>
          ))}
        </Tableau>
      </Carte>
    </div>
  );
}
