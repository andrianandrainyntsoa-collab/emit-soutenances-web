import { useEffect, useState } from 'react';
import { Profil as ProfilApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import {
  Bouton,
  Carte,
  Champ,
  Etiquette,
  MessageErreur,
  MessageSucces,
  champCss,
  messageApiErreur,
} from '../components/ui';

/**
 * Page « Mon Profil » (web — la même logique existe sur mobile) :
 *   - Enseignant : nom, mot de passe, spécialité, téléphone ;
 *   - Étudiant : mot de passe uniquement (matricule, promotion,
 *     parcours, mention et informations administratives non
 *     modifiables) ;
 *   - Administrateur / responsable : nom et mot de passe ;
 *   - le changement de mot de passe exige le mot de passe actuel et
 *     une confirmation du nouveau.
 */
export default function Profil() {
  const { user } = useAuth();
  const role = user?.role?.name ?? '';
  const estEtudiant = role === 'etudiant';
  const estEnseignant = role === 'enseignant';

  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [specialite, setSpecialite] = useState('');

  const [mdpActuel, setMdpActuel] = useState('');
  const [nouveauMdp, setNouveauMdp] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const [succes, setSucces] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    ProfilApi.voir().then((r) => {
      setNom(r.data.name ?? '');
      setTelephone(r.data.enseignant?.telephone ?? '');
      setSpecialite(r.data.enseignant?.specialite ?? '');
    });
  }, []);

  const soumettre = async () => {
    setErreur(null);
    setSucces(null);
    setEnCours(true);
    try {
      const donnees: Record<string, string> = {};

      if (!estEtudiant && nom.trim()) donnees.name = nom.trim();
      if (estEnseignant) {
        donnees.telephone = telephone;
        donnees.specialite = specialite;
      }

      const veutChangerMdp = mdpActuel !== '' || nouveauMdp !== '' || confirmation !== '';
      if (veutChangerMdp) {
        if (!mdpActuel) throw new Error('Le mot de passe actuel est requis pour changer de mot de passe.');
        if (nouveauMdp.length < 8) throw new Error('Le nouveau mot de passe doit contenir au moins 8 caractères.');
        if (nouveauMdp !== confirmation) throw new Error('La confirmation du nouveau mot de passe ne correspond pas.');
        donnees.mot_de_passe_actuel = mdpActuel;
        donnees.password = nouveauMdp;
        donnees.password_confirmation = confirmation;
      }

      if (Object.keys(donnees).length === 0) {
        throw new Error('Aucune modification à enregistrer.');
      }

      const r = await ProfilApi.maj(donnees);
      setSucces(r.data?.message ?? 'Profil mis à jour.');
      setMdpActuel('');
      setNouveauMdp('');
      setConfirmation('');
    } catch (e: any) {
      setErreur(e?.response?.data?.message || e?.message || messageApiErreur(e));
    } finally {
      setEnCours(false);
    }
  };

  const libelleRole: Record<string, string> = {
    administrateur: 'Administrateur',
    responsable: 'Responsable',
    enseignant: 'Enseignant',
    etudiant: 'Étudiant',
  };

  return (
    <div className="w-full space-y-5">
      <h1 className="text-xl font-bold text-slate-800">Mon profil</h1>

      <Carte>
        <div className="flex items-center gap-4 mb-5">
          <div className="h-14 w-14 rounded-full bg-primaire-700 text-white flex items-center justify-center text-lg font-bold">
            {user?.name?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-800">{user?.name}</div>
            <div className="text-sm text-slate-500">{user?.email}</div>
            <div className="mt-1">
              <Etiquette couleur="bleu">{libelleRole[role] ?? '—'}</Etiquette>
            </div>
          </div>
        </div>

        <MessageErreur erreur={erreur} />
        <MessageSucces texte={succes} />

        <div className="space-y-4 mt-4">
          {estEtudiant ? (
            <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded px-3 py-2">
              En tant qu'étudiant, vous pouvez uniquement modifier votre mot de passe. Votre
              matricule, votre promotion, votre parcours et votre mention sont gérés par
              l'administration.
            </p>
          ) : (
            <Champ label="Nom complet">
              <input className={champCss} value={nom} onChange={(e) => setNom(e.target.value)} />
            </Champ>
          )}

          {estEnseignant && (
            <>
              <Champ label="Spécialité">
                <input className={champCss} value={specialite} onChange={(e) => setSpecialite(e.target.value)} />
              </Champ>
              <Champ label="Numéro de téléphone">
                <input className={champCss} value={telephone} onChange={(e) => setTelephone(e.target.value)} />
              </Champ>
            </>
          )}

          <div className="border-t border-slate-100 pt-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Changer de mot de passe</h2>
            <div className="space-y-3">
              <Champ label="Mot de passe actuel" requis={mdpActuel !== '' || nouveauMdp !== ''}>
                <input
                  type="password"
                  className={champCss}
                  value={mdpActuel}
                  onChange={(e) => setMdpActuel(e.target.value)}
                  autoComplete="current-password"
                />
              </Champ>
              <div className="grid sm:grid-cols-2 gap-3">
                <Champ label="Nouveau mot de passe (min. 8 caractères)">
                  <input
                    type="password"
                    className={champCss}
                    value={nouveauMdp}
                    onChange={(e) => setNouveauMdp(e.target.value)}
                    autoComplete="new-password"
                  />
                </Champ>
                <Champ label="Confirmer le nouveau mot de passe">
                  <input
                    type="password"
                    className={champCss}
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    autoComplete="new-password"
                  />
                </Champ>
              </div>
            </div>
          </div>

          <Bouton onClick={soumettre} desactive={enCours}>
            {enCours ? 'Enregistrement…' : 'Enregistrer'}
          </Bouton>
        </div>
      </Carte>

      {user?.etudiant && (
        <Carte titre="Informations académiques (lecture seule)">
          <div className="text-sm space-y-2">
            <div><span className="text-slate-500">Matricule :</span> <b>{user.etudiant.numero_etudiant}</b></div>
            <div><span className="text-slate-500">Promotion :</span> {user.etudiant.promotion?.nom ?? '—'}</div>
            <div><span className="text-slate-500">Parcours :</span> {user.etudiant.promotion?.parcours?.nom ?? '—'}</div>
            <div><span className="text-slate-500">Mention :</span> {user.etudiant.promotion?.formation?.nom ?? '—'}</div>
            <div>
              <span className="text-slate-500">Autorisé à soutenir :</span>{' '}
              {user.etudiant.autorise_soutenance ? (
                <Etiquette couleur="vert">Oui</Etiquette>
              ) : (
                <Etiquette couleur="rouge">Non</Etiquette>
              )}
            </div>
          </div>
        </Carte>
      )}

      {user?.enseignant && (
        <Carte titre="Informations professionnelles">
          <div className="text-sm space-y-2">
            <div><span className="text-slate-500">Spécialité :</span> {user.enseignant.specialite ?? '—'}</div>
            <div><span className="text-slate-500">Téléphone :</span> {user.enseignant.telephone ?? '—'}</div>
          </div>
        </Carte>
      )}
    </div>
  );
}
