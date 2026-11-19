import { useEffect, useState } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { Notifications as Api } from '../api/endpoints';
import type { Notification } from '../types';
import {
  Bouton,
  Carte,
  Chargement,
  Etiquette,
  formatDateHeure,
  messageApiErreur,
} from '../components/ui';

/**
 * Page Notifications.
 *
 * Nouveautés : chaque notification dispose d'un bouton « Supprimer »,
 * et la barre d'actions propose « Supprimer les lues » et
 * « Tout supprimer » (avec confirmation). La suppression est
 * définitive et ne concerne QUE les notifications de l'utilisateur
 * connecté (contrôle côté serveur).
 */
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [charge, setCharge] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [suppressionEnCours, setSuppressionEnCours] = useState<number | null>(null);

  // Libellés des types de notification — indique clairement ce qui
  // s'affiche dans cette partie : tout ce qui concerne l'utilisateur
  // connecté selon son rôle (étudiant, enseignant/jury, admin...).
  const libelleType: Record<string, { texte: string; couleur: 'bleu' | 'vert' | 'ambre' | 'rouge' | 'violet' | 'gris' }> = {
    compte: { texte: 'Compte', couleur: 'gris' },
    planification: { texte: 'Planification', couleur: 'bleu' },
    convocation: { texte: 'Convocation', couleur: 'violet' },
    evaluation: { texte: 'Évaluation', couleur: 'ambre' },
    deliberation: { texte: 'Délibération', couleur: 'ambre' },
    resultat: { texte: 'Résultat', couleur: 'vert' },
    proces_verbal: { texte: 'Procès-verbal', couleur: 'bleu' },
    autorisation: { texte: 'Autorisation', couleur: 'vert' },
  };

  const charger = () =>
    Api.liste()
      .then((r) => setNotifications(r.data.notifications))
      .catch((e) => setErreur(messageApiErreur(e)))
      .finally(() => setCharge(false));

  useEffect(() => {
    charger();
  }, []);

  const marquerLue = async (id: number) => {
    await Api.marquerLue(id);
    charger();
  };

  const toutMarquer = async () => {
    await Api.marquerToutes();
    charger();
  };

  const supprimerUne = async (n: Notification) => {
    setErreur(null);
    setSucces(null);
    setSuppressionEnCours(n.id);
    try {
      const r = await Api.supprimer(n.id);
      setSucces(r.data?.message ?? 'Notification supprimée.');
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    } finally {
      setSuppressionEnCours(null);
    }
  };

  const supprimerGroupe = async (luesSeulement: boolean) => {
    const cible = luesSeulement ? 'les notifications déjà lues' : 'TOUTES les notifications';
    if (!window.confirm(`Confirmer la suppression de ${cible} ?\n\nCette action est définitive.`)) {
      return;
    }
    setErreur(null);
    setSucces(null);
    try {
      const r = await Api.supprimerToutes(luesSeulement);
      setSucces(r.data?.message ?? 'Suppression effectuée.');
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  if (charge) return <Chargement />;

  const nbLues = notifications.filter((n) => n.lue_le).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">Notifications</h1>
        <div className="flex flex-wrap gap-2">
          <Bouton variante="secondaire" onClick={toutMarquer}>
            <CheckCheck size={16} /> Tout marquer comme lu
          </Bouton>
          <Bouton
            variante="secondaire"
            desactive={nbLues === 0}
            onClick={() => supprimerGroupe(true)}
            titre={nbLues === 0 ? 'Aucune notification lue à supprimer' : 'Supprimer uniquement les notifications déjà lues'}
          >
            <Trash2 size={16} /> Supprimer les lues
          </Bouton>
          <Bouton
            variante="danger"
            desactive={notifications.length === 0}
            onClick={() => supprimerGroupe(false)}
            titre={notifications.length === 0 ? 'Aucune notification' : 'Supprimer toutes les notifications'}
          >
            <Trash2 size={16} /> Tout supprimer
          </Bouton>
        </div>
      </div>

      {erreur && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {erreur}
        </div>
      )}
      {succes && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm">
          {succes}
        </div>
      )}

      {notifications.length === 0 ? (
        <Carte>
          <div className="text-center py-10 text-slate-400">
            <Bell size={36} className="mx-auto mb-3 opacity-40" />
            Aucune notification pour le moment.
            <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
              Vous y retrouverez les informations qui vous concernent : planification et
              confirmation de votre soutenance, convocations, validation des notes, résultat
              final, disponibilité de votre procès-verbal, autorisation à soutenir, création
              de votre compte… selon votre rôle.
            </p>
          </div>
        </Carte>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.lue_le && marquerLue(n.id)}
              className={`rounded-xl border p-4 cursor-pointer transition ${
                n.lue_le
                  ? 'bg-white border-slate-200'
                  : 'bg-blue-50/60 border-blue-200 hover:bg-blue-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${n.lue_le ? 'text-slate-300' : 'text-blue-600'}`}>
                  <Bell size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-medium ${n.lue_le ? 'text-slate-600' : 'text-slate-800'}`}>
                      {n.titre}
                    </span>
                    {n.type && libelleType[n.type] && (
                      <Etiquette couleur={libelleType[n.type].couleur}>{libelleType[n.type].texte}</Etiquette>
                    )}
                    {!n.lue_le && <Etiquette couleur="bleu">Nouveau</Etiquette>}
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                  <div className="text-xs text-slate-400 mt-1.5">
                    {formatDateHeure(n.created_at)}
                  </div>
                </div>

                {/* Bouton de suppression individuelle */}
                <button
                  onClick={(e) => {
                    // Ne déclenche PAS le « marquer comme lu » de la carte.
                    e.stopPropagation();
                    supprimerUne(n);
                  }}
                  disabled={suppressionEnCours === n.id}
                  title="Supprimer cette notification"
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50 shrink-0"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
