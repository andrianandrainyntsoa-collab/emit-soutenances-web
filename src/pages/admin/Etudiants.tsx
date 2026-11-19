import { useEffect, useState } from 'react';
import { ShieldCheck, Trash2, XCircle } from 'lucide-react';
import { Etudiants, Formations, ParcoursApi, Promotions, Users } from '../../api/endpoints';
import type { Etudiant, Formation, Parcours, Promotion } from '../../types';
import {
  Bouton,
  Carte,
  Etiquette,
  MessageErreur,
  Tableau,
  champCss,
  messageApiErreur,
} from '../../components/ui';

/**
 * Liste des étudiants (BF03 / RG01) — colonnes : N°, Matricule, Nom,
 * Promotion, Parcours, Mention, Autorisation, Action.
 *
 * Règles : pas de création ni d'édition administrative (les étudiants
 * s'inscrivent eux-mêmes et gèrent leur profil). Actions : consulter,
 * autoriser le compte, autoriser à soutenir (RG01), supprimer.
 */
export default function EtudiantsPage() {
  const [items, setItems] = useState<Etudiant[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [parcours, setParcours] = useState<Parcours[]>([]);
  const [filtrePromo, setFiltrePromo] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [recherche, setRecherche] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  const charger = (p = page) => {
    Etudiants.liste({
      page: p,
      per_page: 15,
      recherche: recherche || undefined,
      promotion_id: filtrePromo || undefined,
    })
      .then((r) => {
        setItems(r.data.data);
        setPage(r.data.current_page);
        setLastPage(r.data.last_page);
      })
      .catch((e) => setErreur(messageApiErreur(e)));
  };

  useEffect(() => {
    Promotions.liste().then((r) => setPromotions(Array.isArray(r.data) ? r.data : (r.data.data ?? []))).catch(() => {});
    Formations.liste().then((r) => setFormations(Array.isArray(r.data) ? r.data : (r.data.data ?? []))).catch(() => {});
    ParcoursApi.liste().then((r) => setParcours(Array.isArray(r.data) ? r.data : (r.data.data ?? []))).catch(() => {});
    charger(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const basculerAutorisationSoutenance = async (e: Etudiant) => {
    setErreur(null);
    setSucces(null);
    try {
      const r = await Etudiants.autoriser(e.id, !e.autorise_soutenance);
      setSucces(r.data.message ?? 'Autorisation mise à jour.');
      charger();
    } catch (err) {
      setErreur(messageApiErreur(err));
    }
  };

  const supprimer = async (e: Etudiant) => {
    if (!window.confirm(`Supprimer le compte de l'étudiant « ${e.user?.name} » ?`)) return;
    setErreur(null);
    try {
      await Etudiants.supprimer(e.id);
      setSucces('Compte étudiant supprimé.');
      charger();
    } catch (err) {
      setErreur(messageApiErreur(err));
    }
  };

  const libellePromo = (e: Etudiant) =>
    e.promotion ? `${e.promotion.nom} (${e.promotion.annee_universitaire})` : '—';

  const libelleParcours = (e: Etudiant) =>
    e.promotion?.parcours ? `${e.promotion.parcours.nom} (${e.promotion.parcours.code})` : '—';

  const libelleMention = (e: Etudiant) =>
    e.promotion?.formation?.nom ?? e.promotion?.parcours?.formation?.nom ?? '—';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">Étudiants</h1>
        <div className="flex flex-wrap gap-2">
          <select className={champCss + ' w-56'} value={filtrePromo} onChange={(e) => { setFiltrePromo(e.target.value); setTimeout(() => charger(1), 0); }}>
            <option value="">Toutes les promotions</option>
            {promotions.map((p) => (
              <option key={p.id} value={p.id}>{p.nom} — {p.annee_universitaire}</option>
            ))}
          </select>
          <input
            className={champCss + ' w-52'}
            placeholder="Rechercher…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && charger(1)}
          />
        </div>
      </div>

      <MessageErreur erreur={erreur} />
      {succes && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm">
          {succes}
        </div>
      )}

      <Carte>
        <Tableau
          entetes={['N°', 'Matricule', 'Nom', 'Promotion', 'Parcours', 'Mention', 'Autorisation', 'Action']}
          vide={items.length === 0}
        >
          {items.map((e, index) => (
            <tr key={e.id} className="hover:bg-slate-50">
              <td className="px-4 py-2.5 text-slate-500">{(page - 1) * 15 + index + 1}</td>
              <td className="px-4 py-2.5 font-mono text-xs">{e.numero_etudiant}</td>
              <td className="px-4 py-2.5">
                <div className="font-medium">{e.user?.name}</div>
                <div className="text-xs text-slate-400">{e.user?.email}</div>
              </td>
              <td className="px-4 py-2.5 text-slate-600">{libellePromo(e)}</td>
              <td className="px-4 py-2.5 text-slate-600">{libelleParcours(e)}</td>
              <td className="px-4 py-2.5 text-slate-600">{libelleMention(e)}</td>
              <td className="px-4 py-2.5">
                <div className="flex flex-col gap-1 items-start">
                  {e.user?.est_autorise ? (
                    <Etiquette couleur="vert">Compte autorisé</Etiquette>
                  ) : (
                    <Etiquette couleur="ambre">Compte en attente</Etiquette>
                  )}
                  {e.autorise_soutenance ? (
                    <Etiquette couleur="vert">Autorisé à soutenir</Etiquette>
                  ) : (
                    <Etiquette couleur="gris">Non autorisé à soutenir</Etiquette>
                  )}
                </div>
              </td>
              <td className="px-4 py-2.5">
                <div className="flex flex-wrap gap-1.5">
                  {e.user?.est_autorise === false && (
                    <Bouton
                      variante="succes"
                      petit
                      onClick={async () => {
                        try {
                          const r = await Users.autoriser(e.user_id, true);
                          setSucces(r.data.message ?? 'Compte autorisé : l\'étudiant peut se connecter (web et mobile).');
                          charger();
                        } catch (err) {
                          setErreur(messageApiErreur(err));
                        }
                      }}
                    >
                      <ShieldCheck size={14} /> Autoriser le compte
                    </Bouton>
                  )}
                  <Bouton
                    variante={e.autorise_soutenance ? 'secondaire' : 'succes'}
                    petit
                    onClick={() => basculerAutorisationSoutenance(e)}
                    titre={e.autorise_soutenance ? "Retirer l'autorisation de soutenir (RG01)" : 'Autoriser à soutenir (RG01)'}
                  >
                    {e.autorise_soutenance ? <XCircle size={14} /> : <ShieldCheck size={14} />}
                    {e.autorise_soutenance ? 'Retirer soutenance' : 'Autoriser soutenance'}
                  </Bouton>
                  <Bouton variante="danger" petit onClick={() => supprimer(e)} titre="Supprimer le compte">
                    <Trash2 size={14} />
                  </Bouton>
                </div>
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
    </div>
  );
}
