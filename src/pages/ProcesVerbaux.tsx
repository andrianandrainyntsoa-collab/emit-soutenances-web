import { useEffect, useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { Pv } from '../api/endpoints';
import { declencherTelechargement, messageErreurBlob } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { ProcesVerbal } from '../types';
import {
  Bouton,
  Carte,
  Etiquette,
  MessageErreur,
  Tableau,
  formatDateHeure,
  messageApiErreur,
  nomFichierPv,
} from '../components/ui';

/**
 * Procès-verbaux (BF10/BF11 / RG11-16) :
 *   - seuls les boutons « Télécharger » et « Supprimer » sont
 *     disponibles (les boutons « Voir » et « Imprimer » sont
 *     supprimés) ;
 *   - le bouton « Supprimer » est DÉSACTIVÉ jusqu'au premier
 *     téléchargement réussi du PV ;
 *   - la suppression est confirmée et vérifiée côté backend ; les
 *     informations officielles de résultat et d'archivage sont
 *     préservées (seul le fichier du PV est supprimé).
 */
export default function ProcesVerbaux() {
  const { role } = useAuth();
  const peutSupprimer = role === 'administrateur' || role === 'responsable';
  const [items, setItems] = useState<ProcesVerbal[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  // PV dont le téléchargement a réussi dans cette session.
  const [telecharges, setTelecharges] = useState<Set<number>>(new Set());
  const [suppressionEnCours, setSuppressionEnCours] = useState<number | null>(null);

  const charger = (p = page) =>
    Pv.liste()
      .then((r) => {
        setItems(r.data.data);
        setPage(r.data.current_page);
        setLastPage(r.data.last_page);
      })
      .catch((e) => setErreur(messageApiErreur(e)));

  useEffect(() => { charger(); }, []);

  const telecharger = async (pv: ProcesVerbal) => {
    setErreur(null);
    setSucces(null);
    try {
      const r = await Pv.telecharger(pv.id);
      // Téléchargement vérifié côté client : le bouton Supprimer est activé.
      setTelecharges((precedents) => new Set(precedents).add(pv.id));
      declencherTelechargement(r.data as Blob, nomFichierPv(pv));
      setSucces('Le téléchargement du PV a démarré. Le bouton « Supprimer » est maintenant disponible.');
    } catch (e) {
      setErreur(await messageErreurBlob(e));
    }
  };

  const supprimer = async (pv: ProcesVerbal) => {
    if (
      !window.confirm(
        `Supprimer le procès-verbal « ${pv.numero_pv} » ?\n\n` +
          'Le fichier PDF et son enregistrement seront supprimés. Les données officielles ' +
          'de résultat et d\'archivage restent conservées.'
      )
    ) {
      return;
    }
    setErreur(null);
    setSucces(null);
    setSuppressionEnCours(pv.id);
    try {
      const r = await Pv.supprimer(pv.id);
      setSucces(r.data.message ?? 'Procès-verbal supprimé.');
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    } finally {
      setSuppressionEnCours(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Procès-verbaux</h1>
        <p className="text-sm text-slate-500">
          Archivage des procès-verbaux définitifs (RG16). Accès selon les droits (RG14). La
          suppression d'un PV n'est possible qu'après son téléchargement, avec confirmation ;
          les données officielles de résultat restent conservées.
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
          entetes={['N° PV', 'Type', 'Étudiant', 'Formation / Parcours', 'Note', 'Généré le', 'Statut', 'Actions']}
          vide={items.length === 0}
        >
          {items.map((pv) => {
            const r = pv.resultat;
            const dejaTelecharge = telecharges.has(pv.id);
            return (
              <tr key={pv.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-mono text-xs font-semibold">{pv.numero_pv}</td>
                <td className="px-4 py-2.5">
                  <Etiquette couleur={pv.type_master === 'recherche' ? 'violet' : 'bleu'}>
                    {pv.type_master === 'recherche' ? 'Master Recherche' : 'Master Professionnel'}
                  </Etiquette>
                </td>
                <td className="px-4 py-2.5">
                  <div className="font-medium">{r?.soutenance?.etudiant?.user?.name}</div>
                  <div className="text-xs text-slate-400 max-w-56 truncate">{r?.soutenance?.titre_memoire}</div>
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-600">
                  <div>{r?.soutenance?.etudiant?.promotion?.formation?.code ?? '—'}</div>
                  <div className="text-slate-400">
                    {r?.soutenance?.etudiant?.promotion?.parcours
                      ? `${r.soutenance.etudiant.promotion.parcours.nom} (${r.soutenance.etudiant.promotion.parcours.code})`
                      : '—'}
                  </div>
                </td>
                <td className="px-4 py-2.5 font-semibold">{r?.moyenne_finale ?? '—'}/20</td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{formatDateHeure(pv.genere_le)}</td>
                <td className="px-4 py-2.5">
                  <Etiquette couleur="vert">{pv.statut === 'genere' ? 'Définitif' : pv.statut}</Etiquette>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1.5">
                    <Bouton variante="primaire" petit onClick={() => telecharger(pv)} titre="Télécharger le PV">
                      <Download size={14} /> Télécharger
                    </Bouton>
                    {peutSupprimer && (
                      <Bouton
                        variante="danger"
                        petit
                        desactive={!dejaTelecharge || suppressionEnCours === pv.id}
                        onClick={() => supprimer(pv)}
                        titre={dejaTelecharge ? 'Supprimer le PV (téléchargé)' : 'Téléchargez d\'abord le PV pour activer la suppression'}
                      >
                        <Trash2 size={14} /> {suppressionEnCours === pv.id ? 'Suppression…' : 'Supprimer'}
                      </Bouton>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
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
    </div>
  );
}
