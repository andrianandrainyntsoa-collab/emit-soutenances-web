import { useEffect, useState } from 'react';
import { Download, Send } from 'lucide-react';
import { Convocations } from '../../api/endpoints';
import type { GroupeConvocations, ReponseEnvoiConvocations } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import {
  Bouton,
  Carte,
  Etiquette,
  MessageErreur,
  Tableau,
  formatDate,
  formatHeure,
  messageApiErreur,
} from '../../components/ui';

/**
 * Page Convocations (BF06) — regroupées PAR SOUTENANCE :
 *   - une ligne = une soutenance (étudiant + membres du jury regroupés) ;
 *   - action « Envoyer » : envoi de TOUTES les convocations de la
 *     soutenance en une seule opération, un courriel individuel par
 *     destinataire à son adresse réelle (SMTP) ;
 *   - après un envoi réussi, la ligne est retirée de la liste en
 *     attente (un historique complet reste disponible via l'API) ;
 *   - le bouton « Voir » individuel est supprimé.
 */
export default function ConvocationsPage() {
  const { role } = useAuth();
  const estAdministrateur = role === 'administrateur';
  const [groupes, setGroupes] = useState<GroupeConvocations[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [envoiEnCours, setEnvoiEnCours] = useState<number | null>(null);

  const charger = () => {
    Convocations.parSoutenance()
      .then((r) => setGroupes(r.data.groupes))
      .catch((e) => setErreur(messageApiErreur(e)));
  };

  useEffect(() => {
    charger();
  }, []);

  const envoyerTout = async (g: GroupeConvocations) => {
    const s = g.soutenance;
    if (
      !window.confirm(
        `Envoyer les convocations de la soutenance de ${s.etudiant?.user?.name} ?\n\n` +
          `${g.total_convocations} convocation(s) seront envoyées individuellement par e-mail\n` +
          `aux destinataires concernés (étudiant + membres du jury).`
      )
    ) {
      return;
    }
    setErreur(null);
    setSucces(null);
    setEnvoiEnCours(s.id);
    try {
      const r = await Convocations.envoyerPourSoutenance(s.id);
      const reponse = r.data as ReponseEnvoiConvocations;

      if (reponse.reussi) {
        setSucces(reponse.message);
        charger(); // la ligne disparaît de la liste en attente
      } else {
        const detail = reponse.echecs
          .map((e) => `• ${e.destinataire} (${e.email ?? 'e-mail manquant'}) : ${e.erreur}`)
          .join('\n');
        setErreur(`${reponse.message}\n${detail}`);
        charger(); // les envois réussis sont mis à jour, la ligne reste
      }
    } catch (e) {
      setErreur(messageApiErreur(e));
    } finally {
      setEnvoiEnCours(null);
    }
  };

  const dateHeure = (g: GroupeConvocations) => {
    const s = g.soutenance;
    const date = s.date_soutenance ?? s.creneau?.date_soutenance;
    const debut = s.heure_debut ?? s.creneau?.heure_debut;
    const fin = s.heure_fin ?? s.creneau?.heure_fin;
    return `${date ? formatDate(date) : '—'} · ${formatHeure(debut)}${fin ? `–${formatHeure(fin)}` : ''}`;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Convocations</h1>
        <p className="text-sm text-slate-500">
          Une ligne par soutenance : l'envoi déclenche une convocation individuelle par e-mail
          (avec PDF joint) pour l'étudiant et chaque membre du jury. Les lignes envoyées
          disparaissent de cette liste en attente.
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
          entetes={['Étudiant', 'Mémoire', 'Date et horaires', 'Salle', 'Destinataires', 'Envoi', 'Actions']}
          vide={groupes.length === 0}
        >
          {groupes.map((g) => {
            const s = g.soutenance;
            return (
              <tr key={s.id} className="hover:bg-slate-50 align-top">
                <td className="px-4 py-2.5">
                  <div className="font-medium">{s.etudiant?.user?.name}</div>
                  <div className="text-xs text-slate-400">{s.etudiant?.numero_etudiant}</div>
                </td>
                <td className="px-4 py-2.5 max-w-56">
                  <div className="truncate text-sm" title={s.titre_memoire}>{s.titre_memoire}</div>
                  <div className="text-xs text-slate-400">{s.session?.nom ?? '—'}</div>
                </td>
                <td className="px-4 py-2.5 text-sm text-slate-600">{dateHeure(g)}</td>
                <td className="px-4 py-2.5 text-sm">{s.salle?.code ?? '—'}</td>
                <td className="px-4 py-2.5 text-sm">
                  <div className="flex flex-col gap-0.5">
                    <b>{s.etudiant?.user?.name} <span className="font-normal text-slate-400">(étudiant)</span></b>
                    {(s.jury?.membresJury ?? []).map((m) => (
                      <span key={m.id}>
                        {m.enseignant?.user?.name}{' '}
                        <span className="text-xs text-slate-400 capitalize">({m.fonction})</span>
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-col gap-1 items-start">
                    <Etiquette couleur={g.convocations_envoyees > 0 ? 'bleu' : 'gris'}>
                      {g.convocations_envoyees}/{g.total_convocations} envoyée(s)
                    </Etiquette>
                    {g.emails_manquants > 0 && (
                      <Etiquette couleur="rouge">{g.emails_manquants} e-mail(s) manquant(s)</Etiquette>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  {estAdministrateur ? (
                    <Bouton
                      variante="primaire"
                      petit
                      desactive={!g.envoyable || envoiEnCours === s.id}
                      onClick={() => envoyerTout(g)}
                    >
                      <Send size={14} />
                      {envoiEnCours === s.id ? 'Envoi…' : 'Envoyer'}
                    </Bouton>
                  ) : (
                    <span className="text-xs text-slate-400">Lecture seule</span>
                  )}
                </td>
              </tr>
            );
          })}
        </Tableau>

        {groupes.length === 0 && !erreur && (
          <p className="text-sm text-slate-500 text-center py-6">
            Aucune convocation en attente d'envoi. Générez les convocations depuis la page
            « Planification » (bouton Convocations d'une soutenance planifiée).
          </p>
        )}
      </Carte>
    </div>
  );
}
