import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Check,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { champCss, messageApiErreur } from '../components/ui';

export default function Connexion() {
  const { connexion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { message?: string } };
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const [seSouvenir, setSeSouvenir] = useState(false);

  // Message affiché après une inscription (compte en attente d'autorisation).
  useEffect(() => {
    if (location.state?.message) {
      setInfo(location.state.message);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const soumettre = async (e: FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setInfo(null);
    setEnCours(true);
    try {
      await connexion(email, motDePasse, seSouvenir);
      navigate('/');
    } catch (err: any) {
      // Cas « compte en attente d'autorisation » : message explicite.
      const message = err?.response?.data?.message;
      if (err?.response?.status === 403 && message) {
        setErreur(message);
      } else {
        setErreur(messageApiErreur(err));
      }
    } finally {
      setEnCours(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="hidden min-h-screen w-[31%] flex-col justify-between bg-[#102452] px-8 py-8 text-white lg:flex xl:px-9">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-white">
            <img src="/logo-emit.png" alt="Logo EMIT" className="h-full w-full object-contain" />
          </div>
          <p className="max-w-[220px] text-xs font-medium leading-4 text-white">
            École de Management et d'Innovation Technologique
          </p>
        </div>

        <div className="my-12">
          <h1 className="max-w-sm text-3xl font-bold leading-tight text-white xl:text-[32px]">
            Système de Gestion des Soutenances de Master
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-blue-100/75">
            Plateforme unifiée de planification, d'évaluation et de publication des résultats des
            soutenances de mémoire de fin d'études.
          </p>

          <ul className="mt-1 space-y-4">
            <li className="flex items-start gap-3 text-sm leading-5 text-blue-100/80">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2D8BE8] text-white">
                <Check size={16} strokeWidth={2.5} />
              </span>
              <span>Planification et affectation automatisée des jurys</span>
            </li>
            <li className="flex items-start gap-3 text-sm leading-5 text-blue-100/80">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2D8BE8] text-white">
                <Check size={16} strokeWidth={2.5} />
              </span>
              <span>Suivi des évaluations en temps réel</span>
            </li>
            <li className="flex items-start gap-3 text-sm leading-5 text-blue-100/80">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2D8BE8] text-white">
                <Check size={16} strokeWidth={2.5} />
              </span>
              <span>Génération automatique des PV de soutenance</span>
            </li>
            <li className="flex items-start gap-3 text-sm leading-5 text-blue-100/80">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#2D8BE8] text-white">
                <Check size={16} strokeWidth={2.5} />
              </span>
              <span>Application mobile étudiants et jury</span>
            </li>
          </ul>

          <div className="mt-6 rounded-xl border border-white/15 bg-white/5 px-4 py-3">
            <p className="text-xs leading-5 text-blue-100/80">
              Les étudiants et les enseignants évaluateurs peuvent créer un compte.
            </p>
            <Link
              to="/inscription"
              className="mt-1 inline-block text-xs font-semibold text-[#95C5F2] transition hover:text-white hover:underline"
            >
              Accéder à l'inscription
            </Link>
          </div>
        </div>

        <p className="text-xs leading-4 text-blue-100/60">
          © {new Date().getFullYear()} EMIT – École de Management et d'Innovation Technologique
        </p>
      </aside>

      <main className="flex min-h-screen w-full items-center justify-center bg-white px-6 py-10 lg:w-[69%]">
        <div className="w-full max-w-[380px]">
          <header className="mb-8 text-center">
            <img
              src="/logo-emit.png"
              alt="Logo EMIT"
              className="mx-auto mb-8 h-14 w-28 object-contain"
            />
            <h2 className="text-2xl font-bold text-[#102452]">Connexion</h2>
            <p className="mt-1 text-sm leading-6 text-slate-700">
              École de Management et d'Innovation Technologique
              <br />
              Université de Fianarantsoa
            </p>
          </header>

          <form onSubmit={soumettre} className="space-y-5">
            {info && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {info}
              </div>
            )}

            {erreur && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{erreur}</span>
              </div>
            )}

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#102452]">Adresse</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@emit.mg"
                className={`${champCss} h-[54px] rounded-xl border border-[#D8E5FA] bg-[#E8F0FE] px-4 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#75A9EC] focus:ring-[#75A9EC]`}
                autoComplete="username"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[#102452]">Mot de passe</span>
              <span className="relative block">
                <input
                  type={motDePasseVisible ? 'text' : 'password'}
                  required
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                  placeholder="Mot de passe"
                  className={`${champCss} h-[54px] rounded-xl border border-[#D8E5FA] bg-[#E8F0FE] px-4 pr-12 text-sm text-slate-900 placeholder:text-slate-500 focus:border-[#75A9EC] focus:ring-[#75A9EC]`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setMotDePasseVisible((visible) => !visible)}
                  aria-label={motDePasseVisible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 transition hover:text-[#102452] focus:outline-none focus:ring-2 focus:ring-[#75A9EC]"
                >
                  {motDePasseVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>

            <div className="flex items-center justify-between gap-3 pt-0.5 text-sm">
              <label className="flex items-center gap-2 text-slate-500">
                <input
                  type="checkbox"
                  checked={seSouvenir}
                  onChange={(e) => setSeSouvenir(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-[#1F4EAF] focus:ring-[#75A9EC]"
                />
                <span>Se souvenir de moi</span>
              </label>
              <Link
                to="/mot-de-passe-oublie"
                className="text-sm text-[#526F9B] hover:text-[#102452] hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            <button
              type="submit"
              disabled={enCours}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1F4EAF] px-4 text-sm font-semibold text-white transition hover:bg-[#194394] focus:outline-none focus:ring-2 focus:ring-[#75A9EC] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enCours && <Loader2 size={18} className="animate-spin" />}
              {enCours ? 'Connexion…' : 'Se connecter'}
            </button>

            <div className="pt-1 text-center">
              <p className="mb-3 text-sm text-slate-500">Vous n'avez pas de compte ?</p>
              <Link
                to="/inscription"
                className="flex h-12 w-full items-center justify-center rounded-xl border border-[#1F4EAF] bg-white px-4 text-sm font-semibold text-[#1F4EAF] transition hover:bg-[#EEF4FF] focus:outline-none focus:ring-2 focus:ring-[#75A9EC] focus:ring-offset-2"
              >
                S'inscrire
              </Link>
            </div>
          </form>

          <p className="mt-5 text-center text-xs text-[#526F9B]">
            Accès réservé aux utilisateurs habilités — EMIT 2024/2025
          </p>
        </div>
      </main>
    </div>
  );
}
