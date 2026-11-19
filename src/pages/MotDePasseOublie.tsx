import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import client from '../api/client';
import { Bouton, Champ, MessageErreur, champCss, messageApiErreur } from '../components/ui';

/**
 * Réinitialisation du mot de passe en deux étapes :
 *   1. Saisie de l'e-mail → envoi d'un code à 6 chiffres par e-mail.
 *   2. Saisie du code + du nouveau mot de passe.
 */
export default function MotDePasseOublie() {
  const [etape, setEtape] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const demanderCode = async (e: FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const r = await client.post('/mot-de-passe/oublie', { email });
      setSucces(r.data?.message ?? 'Code envoyé par e-mail.');
      if (r.data?.code_developpement) {
        setSucces(
          `${r.data.message} (Mode développement — SMTP non configuré : code de test : ${r.data.code_developpement})`
        );
      }
      setEtape(2);
    } catch (err) {
      setErreur(messageApiErreur(err));
    } finally {
      setEnCours(false);
    }
  };

  const reinitialiser = async (e: FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const r = await client.post('/mot-de-passe/reinitialiser', {
        email,
        code,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSucces(r.data?.message ?? 'Mot de passe réinitialisé.');
      setErreur(null);
    } catch (err) {
      setErreur(messageApiErreur(err));
    } finally {
      setEnCours(false);
    }
  };

  const reinitialise = etape === 2 && succes && !erreur && password.length >= 8;

  return (
    <div className="min-h-screen flex items-center justify-center bg-primaire-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/logo-emit.png"
            alt="Logo EMIT"
            className="inline-block h-20 w-20 rounded-2xl bg-white object-contain p-1.5 shadow-lg mb-4"
          />
          <h1 className="text-2xl font-bold text-white">Mot de passe oublié</h1>
          <p className="text-slate-300 text-sm mt-1">
            Un code de réinitialisation vous sera envoyé par e-mail.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-7 space-y-4">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <KeyRound size={18} className="text-primaire-600" />
            Étape {etape} sur 2 : {etape === 1 ? 'votre adresse e-mail' : 'code + nouveau mot de passe'}
          </div>

          <MessageErreur erreur={erreur} />
          {succes && (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 text-sm">
              {succes}
            </div>
          )}

          {etape === 1 && (
            <form onSubmit={demanderCode} className="space-y-4">
              <Champ label="Adresse e-mail du compte" requis>
                <input
                  type="email"
                  className={champCss}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Champ>
              <Bouton type="submit" desactive={enCours} className="w-full">
                {enCours ? 'Envoi du code…' : 'Recevoir le code'}
              </Bouton>
            </form>
          )}

          {etape === 2 && (
            <form onSubmit={reinitialiser} className="space-y-4">
              <Champ label="Code reçu par e-mail (6 chiffres)" requis>
                <input
                  className={champCss}
                  required
                  maxLength={10}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="ex : 482913"
                />
              </Champ>
              <Champ label="Nouveau mot de passe (8 caractères minimum)" requis>
                <input
                  type="password"
                  className={champCss}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </Champ>
              <Champ label="Confirmer le nouveau mot de passe" requis>
                <input
                  type="password"
                  className={champCss}
                  required
                  minLength={8}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  autoComplete="new-password"
                />
              </Champ>
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
                Notez bien votre nouveau mot de passe et mémorisez-le pour ne pas le perdre.
              </div>
              <Bouton type="submit" desactive={enCours} className="w-full">
                {enCours ? 'Réinitialisation…' : 'Réinitialiser le mot de passe'}
              </Bouton>
            </form>
          )}

          <div className="flex items-center justify-between text-sm pt-1 border-t border-slate-100">
            <Link to="/connexion" className="text-slate-500 hover:text-primaire-700 hover:underline">
              ← Retour à la connexion
            </Link>
            {reinitialise && (
              <Link to="/connexion" className="text-primaire-600 font-medium hover:underline">
                Se connecter →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
