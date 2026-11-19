import { useEffect, useState } from 'react';
import { Plus, ShieldCheck, Trash2, XCircle } from 'lucide-react';
import { Users } from '../../api/endpoints';
import type { Role, User } from '../../types';
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
} from '../../components/ui';

const VIDE = { name: '', email: '', password: '' };

type Onglet = 'enseignants' | 'etudiants' | 'administrateurs';

const ONGLETS: { cle: Onglet; libelle: string; role: string }[] = [
  { cle: 'enseignants', libelle: 'Enseignants', role: 'enseignant' },
  { cle: 'etudiants', libelle: 'Étudiants', role: 'etudiant' },
  { cle: 'administrateurs', libelle: 'Administrateurs', role: 'administrateur' },
];

/**
 * Gestion des utilisateurs (BF02) — trois listes distinctes :
 * enseignants, étudiants et administrateurs.
 *
 * Règles appliquées :
 *   - la création d'utilisateur par l'administrateur ne produit que
 *     des comptes ADMINISTRATEURS (les étudiants et enseignants
 *     s'inscrivent eux-mêmes) ;
 *   - pour les enseignants / étudiants : consulter, AUTORISER le
 *     compte, supprimer — sans modifier leurs informations
 *     personnelles (gérées par l'utilisateur dans « Mon Profil ») ;
 *   - l'autorisation de compte s'applique immédiatement sur le web
 *     ET sur le mobile (un seul et même compte).
 */
export default function Utilisateurs() {
  const [onglet, setOnglet] = useState<Onglet>('enseignants');
  const [items, setItems] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [recherche, setRecherche] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);

  // Création d'un administrateur uniquement.
  const [modaleCreation, setModaleCreation] = useState(false);
  const [form, setForm] = useState({ ...VIDE });

  const roleCourant = ONGLETS.find((o) => o.cle === onglet)!.role;
  const estListeAdministrateurs = onglet === 'administrateurs';

  const charger = (p = page) => {
    Users.liste({
      page: p,
      per_page: 15,
      role: roleCourant,
      recherche: recherche || undefined,
    })
      .then((r) => {
        setItems(r.data.data);
        setPage(r.data.current_page);
        setLastPage(r.data.last_page);
      })
      .catch((e) => setErreur(messageApiErreur(e)));
  };

  useEffect(() => {
    setPage(1);
    charger(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onglet]);

  const basculerAutorisation = async (u: User) => {
    setErreur(null);
    setSucces(null);
    try {
      const r = await Users.autoriser(u.id, !u.est_autorise);
      setSucces(r.data.message ?? 'Compte mis à jour.');
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  const supprimer = async (u: User) => {
    if (!window.confirm(`Supprimer le compte « ${u.name} » ?`)) return;
    setErreur(null);
    try {
      await Users.supprimer(u.id);
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  const creerAdmin = async () => {
    setErreur(null);
    try {
      await Users.creer(form);
      setModaleCreation(false);
      setForm({ ...VIDE });
      setSucces('Compte administrateur créé.');
      charger();
    } catch (e) {
      setErreur(messageApiErreur(e));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-800">Gestion des utilisateurs</h1>
        <div className="flex gap-2">
          <input
            className={champCss + ' w-56'}
            placeholder="Rechercher (nom, e-mail)…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && charger(1)}
          />
          {estListeAdministrateurs && (
            <Bouton onClick={() => setModaleCreation(true)}>
              <Plus size={16} /> Nouvel administrateur
            </Bouton>
          )}
        </div>
      </div>

      <MessageErreur erreur={erreur} />
      {succes && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm">
          {succes}
        </div>
      )}

      {!estListeAdministrateurs && (
        <p className="text-sm text-slate-500">
          Les comptes étudiants et enseignants sont créés par leurs titulaires depuis le
          formulaire d'inscription (web ou mobile). Avant autorisation, ils ne peuvent pas
          accéder à leur espace. Les informations personnelles sont modifiées par chaque
          utilisateur depuis sa page « Mon Profil ».
        </p>
      )}

      <div className="flex gap-1 bg-slate-200 rounded-lg p-1 w-fit">
        {ONGLETS.map((o) => (
          <button
            key={o.cle}
            onClick={() => setOnglet(o.cle)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
              onglet === o.cle ? 'bg-white shadow text-primaire-800' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {o.libelle}
          </button>
        ))}
      </div>

      <Carte>
        {estListeAdministrateurs ? (
          <Tableau
            entetes={['Nom', 'E-mail', 'Statut', 'Actions']}
            vide={items.length === 0}
          >
            {items.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-medium">{u.name}</td>
                <td className="px-4 py-2.5 text-slate-500">{u.email}</td>
                <td className="px-4 py-2.5">
                  <Etiquette couleur="vert">Actif</Etiquette>
                </td>
                <td className="px-4 py-2.5">
                  <Bouton variante="danger" petit onClick={() => supprimer(u)}>
                    <Trash2 size={14} />
                  </Bouton>
                </td>
              </tr>
            ))}
          </Tableau>
        ) : (
          <Tableau
            entetes={
              onglet === 'enseignants'
                ? ['Nom', 'E-mail', 'Spécialité', 'Statut du compte', 'Actions']
                : ['Nom', 'E-mail', 'Promotion', 'Statut du compte', 'Actions']
            }
            vide={items.length === 0}
          >
            {items.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 align-top">
                <td className="px-4 py-2.5 font-medium">{u.name}</td>
                <td className="px-4 py-2.5 text-slate-500">{u.email}</td>
                {onglet === 'enseignants' ? (
                  <td className="px-4 py-2.5 text-slate-600">{u.enseignant?.specialite ?? '—'}</td>
                ) : (
                  <td className="px-4 py-2.5 text-slate-600">
                    {u.etudiant
                      ? `${u.etudiant.promotion?.nom ?? '—'} ${u.etudiant.promotion?.annee_universitaire ? `(${u.etudiant.promotion.annee_universitaire})` : ''}`
                      : '—'}
                  </td>
                )}
                <td className="px-4 py-2.5">
                  {u.est_autorise ? (
                    <Etiquette couleur="vert">Autorisé</Etiquette>
                  ) : (
                    <Etiquette couleur="ambre">En attente</Etiquette>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1.5">
                    <Bouton
                      variante={u.est_autorise ? 'secondaire' : 'succes'}
                      petit
                      onClick={() => basculerAutorisation(u)}
                      titre={u.est_autorise ? 'Révoquer l\'autorisation du compte' : 'Autoriser le compte (web + mobile)'}
                    >
                      {u.est_autorise ? <XCircle size={14} /> : <ShieldCheck size={14} />}
                      {u.est_autorise ? 'Révoquer' : 'Autoriser'}
                    </Bouton>
                    <Bouton variante="danger" petit onClick={() => supprimer(u)}>
                      <Trash2 size={14} />
                    </Bouton>
                  </div>
                </td>
              </tr>
            ))}
          </Tableau>
        )}

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

      <Modale ouvert={modaleCreation} onFermer={() => setModaleCreation(false)} titre="Nouvel administrateur">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void creerAdmin();
          }}
        >
          <MessageErreur erreur={erreur} />
          <p className="text-xs text-slate-500">
            Seuls des comptes ADMINISTRATEURS peuvent être créés ici. Les étudiants et les
            enseignants créent leur compte depuis la page d'inscription.
          </p>
          <Champ label="Nom complet" requis>
            <input
              className={champCss}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={255}
              required
            />
          </Champ>
          <Champ label="E-mail" requis>
            <input
              type="email"
              className={champCss}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              maxLength={255}
              autoComplete="email"
              required
            />
          </Champ>
          <Champ label="Mot de passe" requis>
            <input
              type="password"
              className={champCss}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={8}
              autoComplete="new-password"
              required
            />
          </Champ>
          <div className="flex justify-end gap-2 pt-2">
            <Bouton variante="secondaire" onClick={() => setModaleCreation(false)}>Annuler</Bouton>
            <Bouton type="submit">Créer</Bouton>
          </div>
        </form>
      </Modale>
    </div>
  );
}
