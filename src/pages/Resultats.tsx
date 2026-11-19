import { useEffect, useState } from 'react';
import { CheckCircle2, Download, Eraser, FileText } from 'lucide-react';
import { Resultats as Api, Pv } from '../api/endpoints';
import { declencherTelechargement, messageErreurBlob } from '../api/client';
import type { Resultat } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Bouton,
  Carte,
  Champ,
  Etiquette,
  MessageErreur,
  Modale,
  Tableau,
  champCss,
  messageApiErreur,
} from '../components/ui';

/**
 * Résultats finals (BF09) :
 *   - liste des résultats avec validation par le président du jury ;
 *   - génération du procès-verbal (page dédiée pour télécharger) ;
 *   - génération du COMPTE RENDU PDF des résultats (nom, titre du
 *     mémoire, note retenue, décision finale — données réelles) ;
 *   - bouton « Nettoyer » : retire les éléments concernés de la liste
 *     de travail (archivage logique — les données officielles et les
 *     archives restent consultables via le filtre « Archives ») ;
 *   - le bouton « Espace délibération » est supprimé.
 */
export default function Resultats() {
  const { role } = useAuth();
  const [items, setItems] = useState<Resultat[]>([]);
  const [archives, setArchives] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  // Génération du PV : modale de choix du type de Master.
  const [pvModal, setPvModal] = useState<Resultat | null>(null);
  const [typeMaster, setTypeMaster] = useState<'recherche' | 'professionnel'>('recherche');
  const [enCours, setEnCours] = useState(false);

  const charger = (vueArchives = archives) =>
    Api.liste({ archives: vueArchives ? 1 : undefined })
      .then((r) => setItems(r.data.data))
      .catch((e) => setErreur(messageApiErreur(e)));

  useEffect(() => {
    charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archives]);

  const valider = async (r: Resultat) => {
    if (!window.confirm('Valider officiellement ce résultat ? Le résultat devient définitif (RG10).')) return;
    setErreur(null);
    try {
      const reponse = await Api.valider(r.id);
      setSucces(reponse.data.message ?? 'Résultat validé.');
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  const genererPv = async () => {
    if (!pvModal) return;
    setErreur(null);
    setEnCours(true);
    try {
      const reponse = await Pv.generer(pvModal.id, typeMaster);
      setSucces(
        `${reponse.data?.message ?? 'Procès-verbal généré.'} — ${reponse.data?.proces_verbal?.numero_pv ?? ''} ` +
        '(téléchargeable dans la page Procès-verbaux).'
      );
      setPvModal(null);
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    } finally {
      setEnCours(false);
    }
  };

  const genererCompteRendu = async () => {
    setErreur(null);
    try {
      const r = await Api.compteRendu();
      declencherTelechargement(r.data as Blob, 'compte-rendu-resultats.pdf');
      setSucces('Compte rendu PDF des résultats généré. Le bouton « Nettoyer » est maintenant disponible.');
    } catch (e) {
      setErreur(await messageErreurBlob(e));
    }
  };

  const nettoyer = async () => {
    if (
      !window.confirm(
        'Nettoyer la liste des résultats ?\n\nLes éléments concernés seront retirés de cette liste de travail ' +
          'SANS suppression des données officielles ni des archives (consultables via le filtre « Archives »).'
      )
    ) {
      return;
    }
    setErreur(null);
    setSucces(null);
    try {
      const r = await Api.nettoyer();
      setSucces(r.data.message ?? 'Liste nettoyée.');
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {archives ? 'Archives des résultats' : 'Résultats finals'}
          </h1>
          <p className="text-sm text-slate-500">
            {archives
              ? 'Résultats archivés (nettoyage de la liste de travail). Consultation en lecture seule.'
              : 'Résultats enregistrés dès que les trois membres du jury ont validé leur note. Le président du jury valide le résultat, puis génère le procès-verbal.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Bouton
            variante="secondaire"
            onClick={() => {
              setArchives(!archives);
            }}
          >
            {archives ? '← Liste de travail' : 'Archives →'}
          </Bouton>
          {!archives && (
            <>
              <Bouton variante="accent" onClick={genererCompteRendu}>
                <Download size={15} /> Compte rendu PDF
              </Bouton>
              {(role === 'administrateur' || role === 'responsable') && (
                <Bouton variante="danger" onClick={nettoyer}>
                  <Eraser size={15} /> Nettoyer
                </Bouton>
              )}
            </>
          )}
        </div>
      </div>

      <MessageErreur erreur={erreur} />
      {succes && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm whitespace-pre-line">
          {succes}
        </div>
      )}

      <Carte>
        <Tableau
          entetes={['Étudiant', 'Mémoire', 'Évaluations', 'Note retenue', 'Décision', 'Statut', 'PV', 'Actions']}
          vide={items.length === 0}
        >
          {items.map((r) => {
            const definitif = r.valide_le != null;
            const pv = r.procesVerbal ?? r.proces_verbal;
            const evaluations = r.soutenance?.evaluations ?? [];
            return (
              <tr key={r.id} className="hover:bg-slate-50 align-top">
                <td className="px-4 py-2.5 font-medium">
                  <div>{r.soutenance?.etudiant?.user?.name}</div>
                  <div className="text-xs text-slate-400">
                    {r.soutenance?.etudiant?.numero_etudiant
                      ? `${r.soutenance.etudiant.numero_etudiant} — `
                      : ''}
                    {r.soutenance?.etudiant?.promotion?.parcours
                      ? `${r.soutenance.etudiant.promotion.parcours.code} (${r.soutenance.etudiant.promotion.parcours.formation?.code ?? ''})`
                      : ''}
                  </div>
                </td>
                <td className="px-4 py-2.5 max-w-48"><div className="truncate text-sm">{r.soutenance?.titre_memoire}</div></td>
                <td className="px-4 py-2.5 text-xs space-y-0.5">
                  {evaluations.map((e) => (
                    <div key={e.id} className="flex gap-1.5 items-center">
                      <span className="text-slate-500">{e.enseignant?.user?.name?.split(' ')[0]}:</span>
                      <b>{e.note}</b>
                      {e.validee ? <Etiquette couleur="vert">V</Etiquette> : <Etiquette couleur="ambre">?</Etiquette>}
                    </div>
                  ))}
                </td>
                <td className="px-4 py-2.5 font-semibold text-primaire-800">{r.moyenne_finale ?? '—'}/20</td>
                <td className="px-4 py-2.5 capitalize">{r.decision}</td>
                <td className="px-4 py-2.5">
                  {definitif ? (
                    <Etiquette couleur="vert">Définitif</Etiquette>
                  ) : (
                    <Etiquette couleur="ambre">À valider</Etiquette>
                  )}
                </td>
                <td className="px-4 py-2.5 text-xs">
                  {pv ? (
                    <Etiquette couleur="bleu">{pv.numero_pv}</Etiquette>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  {!archives && role === 'enseignant' && !definitif && (
                    <Bouton variante="succes" petit onClick={() => valider(r)}>
                      <CheckCircle2 size={14} /> Valider
                    </Bouton>
                  )}
                  {!archives && role === 'enseignant' && definitif && (
                    <Bouton variante="primaire" petit onClick={() => { setPvModal(r); setTypeMaster('recherche'); }}>
                      <FileText size={14} /> Générer le PV
                    </Bouton>
                  )}
                  {archives && (
                    <span className="text-xs text-slate-400">Archivé</span>
                  )}
                </td>
              </tr>
            );
          })}
        </Tableau>
      </Carte>

      <Modale
        ouvert={!!pvModal}
        onFermer={() => setPvModal(null)}
        titre={`Générer le procès-verbal — ${pvModal?.soutenance?.etudiant?.user?.name ?? ''}`}
      >
        {pvModal && (
          <div className="space-y-4">
            <MessageErreur erreur={erreur} />
            <p className="text-sm text-slate-600">
              Résultat : <b>{pvModal.moyenne_finale}/20</b> — décision :{' '}
              <span className="capitalize">{pvModal.decision}</span>, mention :{' '}
              <b>{pvModal.mention ?? '—'}</b>.
            </p>
            <Champ label="Type de Master (RG19)" requis>
              <select
                className={champCss}
                value={typeMaster}
                onChange={(e) => setTypeMaster(e.target.value as 'recherche' | 'professionnel')}
              >
                <option value="recherche">Master Recherche</option>
                <option value="professionnel">Master Professionnel</option>
              </select>
            </Champ>
            <p className="text-xs text-slate-400">
              Le PDF sera nommé avec le numéro du PV, le numéro étudiant et son nom pour être
              facilement retrouvé après téléchargement.
            </p>
            <div className="flex justify-end gap-2">
              <Bouton variante="secondaire" onClick={() => setPvModal(null)}>Annuler</Bouton>
              <Bouton onClick={genererPv} desactive={enCours}>
                {enCours ? 'Génération…' : 'Générer le PV'}
              </Bouton>
            </div>
          </div>
        )}
      </Modale>
    </div>
  );
}
