import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, UserRound } from 'lucide-react';
import client from '../api/client';
import { Bouton, Champ, MessageErreur, champCss, messageApiErreur } from '../components/ui';
import type { Formation, Parcours, Promotion } from '../types';

type Profil = 'etudiant' | 'enseignant';

// Formulaire unique : seuls les champs pertinents de l'onglet actif
// sont envoyés à l'API.
const FORM_VIDE = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  numero_etudiant: '',
  specialite: '',
  telephone: '',
  formation_id: '',
  parcours_id: '',
  promotion_id: '',
};

export default function Inscription() {
  const navigate = useNavigate();
  const [profil, setProfil] = useState<Profil>('etudiant');
  const [formations, setFormations] = useState<Formation[]>([]);
  const [parcours, setParcours] = useState<Parcours[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [form, setForm] = useState({ ...FORM_VIDE });
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    client
      .get('/public/referentiels')
      .then((r) => {
        setFormations(r.data.formations ?? []);
        setParcours(r.data.parcours ?? []);
        setPromotions(r.data.promotions ?? []);
      })
      .catch((e) => setErreur(messageApiErreur(e)));
  }, []);

  const parcoursFiltres = parcours.filter(
    (p) => !form.formation_id || String(p.formation_id) === form.formation_id
  );

  const promotionsFiltrees = promotions.filter(
    (p) => !form.parcours_id || String(p.parcours_id) === form.parcours_id
  );

  const changerProfil = (p: Profil) => {
    setProfil(p);
    setErreur(null);
    setForm({ ...FORM_VIDE });
  };

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      if (profil === 'etudiant') {
        await client.post('/register/etudiant', {
          name: form.name,
          email: form.email,
          password: form.password,
          password_confirmation: form.password_confirmation,
          numero_etudiant: form.numero_etudiant,
          telephone: form.telephone || undefined,
          promotion_id: form.promotion_id,
        });
      } else {
        await client.post('/register/enseignant', {
          name: form.name,
          email: form.email,
          password: form.password,
          password_confirmation: form.password_confirmation,
          specialite: form.specialite || undefined,
          telephone: form.telephone || undefined,
        });
      }
      navigate('/connexion', { state: { message: 'Inscription réussie. Votre compte est en attente d\'autorisation par l\'administration : vous serez averti(e) dès qu\'il sera activé.' } });
    } catch (err) {
      setErreur(messageApiErreur(err));
    } finally {
      setEnCours(false);
    }
  };

  const maj = (champ: string, valeur: string) => setForm((f) => ({ ...f, [champ]: valeur }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-primaire-900 p-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <img
            src="/logo-emit.png"
            alt="Logo EMIT"
            className="inline-block h-20 w-20 rounded-2xl bg-white object-contain p-1.5 shadow-lg mb-3"
          />
          <h1 className="text-2xl font-bold text-white">Créer un compte</h1>
          <p className="text-slate-300 text-sm mt-1">
            Inscription des étudiants et des enseignants — EMIT
          </p>
        </div>

        <form onSubmit={soumettre} className="bg-white rounded-2xl shadow-xl p-7 space-y-4">
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => changerProfil('etudiant')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition ${
                profil === 'etudiant' ? 'bg-primaire-800 text-white' : 'text-slate-600 hover:bg-white'
              }`}
            >
              <GraduationCap size={16} /> Étudiant
            </button>
            <button
              type="button"
              onClick={() => changerProfil('enseignant')}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition ${
                profil === 'enseignant' ? 'bg-primaire-800 text-white' : 'text-slate-600 hover:bg-white'
              }`}
            >
              <UserRound size={16} /> Enseignant
            </button>
          </div>

          <MessageErreur erreur={erreur} />

          <div className="grid sm:grid-cols-2 gap-4">
            <Champ label="Nom complet" requis>
              <input
                className={champCss}
                required
                value={form.name}
                onChange={(e) => maj('name', e.target.value)}
              />
            </Champ>
            <Champ label="E-mail" requis>
              <input
                type="email"
                className={champCss}
                required
                value={form.email}
                onChange={(e) => maj('email', e.target.value)}
              />
            </Champ>
          </div>

          {profil === 'etudiant' && (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <Champ label="Numéro étudiant (ex : 312CM24 ou 312SDIA24)" requis>
                  <input
                    className={champCss}
                    required
                    placeholder="numero-formation-annee"
                    value={form.numero_etudiant}
                    onChange={(e) => maj('numero_etudiant', e.target.value.toUpperCase())}
                  />
                </Champ>
                <Champ label="Téléphone">
                  <input
                    className={champCss}
                    value={form.telephone}
                    onChange={(e) => maj('telephone', e.target.value)}
                  />
                </Champ>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <Champ label="Mention (formation)" requis>
                  <select
                    className={champCss}
                    required
                    value={form.formation_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, formation_id: e.target.value, parcours_id: '', promotion_id: '' }))
                    }
                  >
                    <option value="">— Choisir —</option>
                    {formations.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nom} ({f.code})
                      </option>
                    ))}
                  </select>
                </Champ>
                <Champ label="Parcours" requis>
                  <select
                    className={champCss}
                    required
                    value={form.parcours_id}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, parcours_id: e.target.value, promotion_id: '' }))
                    }
                  >
                    <option value="">— Choisir —</option>
                    {parcoursFiltres.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nom} ({p.code})
                      </option>
                    ))}
                  </select>
                </Champ>
                <Champ label="Promotion" requis>
                  <select
                    className={champCss}
                    required
                    value={form.promotion_id}
                    onChange={(e) => maj('promotion_id', e.target.value)}
                  >
                    <option value="">— Choisir —</option>
                    {promotionsFiltrees.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nom} — {p.annee_universitaire}
                      </option>
                    ))}
                  </select>
                </Champ>
              </div>
            </>
          )}

          {profil === 'enseignant' && (
            <div className="grid sm:grid-cols-2 gap-4">
              <Champ label="Spécialité">
                <input
                  className={champCss}
                  value={form.specialite}
                  onChange={(e) => maj('specialite', e.target.value)}
                />
              </Champ>
              <Champ label="Téléphone">
                <input
                  className={champCss}
                  value={form.telephone}
                  onChange={(e) => maj('telephone', e.target.value)}
                />
              </Champ>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <Champ label="Mot de passe (8 caractères minimum)" requis>
              <input
                type="password"
                className={champCss}
                required
                minLength={8}
                value={form.password}
                onChange={(e) => maj('password', e.target.value)}
                autoComplete="new-password"
              />
            </Champ>
            <Champ label="Confirmer le mot de passe" requis>
              <input
                type="password"
                className={champCss}
                required
                minLength={8}
                value={form.password_confirmation}
                onChange={(e) => maj('password_confirmation', e.target.value)}
                autoComplete="new-password"
              />
            </Champ>
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
            <b>Important :</b> notez bien et mémorisez votre mot de passe — il vous sera demandé à
            chaque connexion. En cas d'oubli, utilisez le lien « Mot de passe oublié » de la page
            de connexion : un code de réinitialisation vous sera envoyé par e-mail.
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <Link to="/connexion" className="text-sm text-slate-500 hover:text-primaire-700 hover:underline">
              ← Retour à la connexion
            </Link>
            <Bouton type="submit" desactive={enCours}>
              {enCours ? 'Inscription…' : "S'inscrire"}
            </Bouton>
          </div>
        </form>
      </div>
    </div>
  );
}
