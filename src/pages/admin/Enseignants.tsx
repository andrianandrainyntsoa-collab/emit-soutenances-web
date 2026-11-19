import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Enseignants } from '../../api/endpoints';
import type { Enseignant } from '../../types';
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
 * Page Enseignants (BF03/BF04) — consultation uniquement :
 *   - recherche ;
 *   - consultation des informations utiles ;
 *   - suppression selon les règles métier (refusée si l'enseignant
 *     participe au processus).
 *
 * Les enseignants s'inscrivent eux-mêmes et gèrent leurs informations
 * depuis « Mon Profil » (nom, mot de passe, spécialité, téléphone) :
 * aucune création ni édition administrative ici.
 */
export default function EnseignantsPage() {
  const [items, setItems] = useState<Enseignant[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [recherche, setRecherche] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  const charger = (p = page) => {
    Enseignants.liste({ page: p, per_page: 15, recherche: recherche || undefined })
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
  }, []);

  const supprimer = async (e: Enseignant) => {
    if (!window.confirm(`Supprimer le compte de l'enseignant « ${e.user?.name} » ?`)) return;
    setErreur(null);
    setSucces(null);
    try {
      await Enseignants.supprimer(e.id);
      setSucces('Compte enseignant supprimé.');
      charger();
    } catch (err) {
      setErreur(messageApiErreur(err));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">Enseignants</h1>
        <input
          className={champCss + ' w-56'}
          placeholder="Rechercher (nom, e-mail, spécialité)…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && charger(1)}
        />
      </div>

      <MessageErreur erreur={erreur} />
      {succes && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm">
          {succes}
        </div>
      )}

      <p className="text-sm text-slate-500">
        Les enseignants s'inscrivent eux-mêmes depuis le formulaire d'inscription. Leurs
        informations personnelles (nom, mot de passe, spécialité, téléphone) sont gérées par
        chaque enseignant depuis sa page « Mon Profil ».
      </p>

      <Carte>
        <Tableau
          entetes={['Nom', 'E-mail', 'Spécialité', 'Téléphone', 'Statut du compte', 'Actions']}
          vide={items.length === 0}
        >
          {items.map((e) => (
            <tr key={e.id} className="hover:bg-slate-50">
              <td className="px-4 py-2.5">
                <div className="font-medium">{e.user?.name}</div>
              </td>
              <td className="px-4 py-2.5 text-slate-500">{e.user?.email}</td>
              <td className="px-4 py-2.5 text-slate-600">{e.specialite ?? '—'}</td>
              <td className="px-4 py-2.5 text-slate-600">{e.telephone ?? '—'}</td>
              <td className="px-4 py-2.5">
                {e.user?.est_autorise ? (
                  <Etiquette couleur="vert">Autorisé</Etiquette>
                ) : (
                  <Etiquette couleur="ambre">En attente</Etiquette>
                )}
              </td>
              <td className="px-4 py-2.5">
                <Bouton variante="danger" petit onClick={() => supprimer(e)} titre="Supprimer le compte">
                  <Trash2 size={14} />
                </Bouton>
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
