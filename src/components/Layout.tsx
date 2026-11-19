import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bell,
  BookOpenCheck,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Gavel,
  GraduationCap,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Route as RouteIcon,
  School,
  ScrollText,
  UserCircle,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Notifications } from '../api/endpoints';

interface LienNav {
  vers: string;
  libelle: string;
  icone: any;
  roles: string[];
  groupe: string;
}

const LIENS: LienNav[] = [
  { vers: '/', libelle: 'Tableau de bord', icone: LayoutDashboard, roles: ['administrateur', 'responsable', 'enseignant', 'etudiant'], groupe: 'Général' },
  { vers: '/notifications', libelle: 'Notifications', icone: Bell, roles: ['administrateur', 'responsable', 'enseignant', 'etudiant'], groupe: 'Général' },
  { vers: '/profil', libelle: 'Mon profil', icone: UserCircle, roles: ['administrateur', 'responsable', 'enseignant', 'etudiant'], groupe: 'Général' },

  // Administration
  { vers: '/utilisateurs', libelle: 'Utilisateurs', icone: Users, roles: ['administrateur'], groupe: 'Administration' },
  { vers: '/etudiants', libelle: 'Étudiants', icone: GraduationCap, roles: ['administrateur'], groupe: 'Administration' },
  { vers: '/enseignants', libelle: 'Enseignants', icone: Users, roles: ['administrateur'], groupe: 'Administration' },
  { vers: '/referentiels', libelle: 'Formations & promotions', icone: School, roles: ['administrateur'], groupe: 'Administration' },
  { vers: '/sessions', libelle: 'Sessions', icone: CalendarDays, roles: ['administrateur', 'responsable'], groupe: 'Administration' },
  { vers: '/salles', libelle: 'Salles & disponibilités', icone: Building2, roles: ['administrateur'], groupe: 'Administration' },
  { vers: '/jurys', libelle: 'Jurys', icone: Gavel, roles: ['administrateur'], groupe: 'Administration' },
  { vers: '/soutenances', libelle: 'Planification', icone: RouteIcon, roles: ['administrateur', 'responsable'], groupe: 'Administration' },
  { vers: '/convocations', libelle: 'Convocations', icone: ClipboardList, roles: ['administrateur', 'responsable'], groupe: 'Administration' },
  { vers: '/audit', libelle: 'Journaux d’audit', icone: History, roles: ['administrateur'], groupe: 'Administration' },

  // Jury
  { vers: '/mes-soutenances', libelle: 'Mes soutenances', icone: ClipboardCheck, roles: ['enseignant'], groupe: 'Espace jury' },
  { vers: '/mes-evaluations', libelle: 'Mes évaluations', icone: BookOpenCheck, roles: ['enseignant'], groupe: 'Espace jury' },
  { vers: '/resultats', libelle: 'Résultats & délibérations', icone: ScrollText, roles: ['administrateur', 'responsable', 'enseignant'], groupe: 'Suivi' },
  { vers: '/proces-verbaux', libelle: 'Procès-verbaux', icone: FileText, roles: ['administrateur', 'responsable', 'enseignant'], groupe: 'Suivi' },

  // Étudiant
  { vers: '/mon-espace', libelle: 'Ma soutenance', icone: GraduationCap, roles: ['etudiant'], groupe: 'Espace étudiant' },
];

export default function Layout() {
  const { user, role, deconnexion } = useAuth();
  const navigate = useNavigate();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [nbNonLues, setNbNonLues] = useState(0);

  useEffect(() => {
    let actif = true;
    const charger = () => {
      Notifications.nbNonLues()
        .then((r) => actif && setNbNonLues(r.data.non_lues))
        .catch(() => {});
    };
    charger();
    const t = setInterval(charger, 30_000);
    return () => {
      actif = false;
      clearInterval(t);
    };
  }, []);

  const liens = LIENS.filter((l) => role && l.roles.includes(role));
  const groupes = [...new Set(liens.map((l) => l.groupe))];

  const libelleRole: Record<string, string> = {
    administrateur: 'Administrateur',
    responsable: 'Responsable',
    enseignant: 'Enseignant (jury)',
    etudiant: 'Étudiant',
  };

  return (
    <div className="flex h-dvh min-w-0 overflow-hidden lg:flex">
      {/* Barre latérale */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-primaire-900 text-slate-200 flex flex-col transition-transform lg:static lg:translate-x-0 ${
          menuOuvert ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
          <img
            src="/logo-emit.png"
            alt="Logo EMIT"
            className="h-10 w-10 rounded-lg bg-white object-contain p-0.5 shrink-0"
          />
          <div className="leading-tight min-w-0">
            <div className="font-semibold text-white text-sm">Soutenances Master</div>
            <div className="text-[11px] text-slate-400">EMIT — Université de Fianarantsoa</div>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setMenuOuvert(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {groupes.map((g) => (
            <div key={g}>
              <div className="px-2 pb-1 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                {g}
              </div>
              <div className="space-y-0.5">
                {liens
                  .filter((l) => l.groupe === g)
                  .map((l) => (
                    <NavLink
                      key={l.vers}
                      to={l.vers}
                      end={l.vers === '/'}
                      onClick={() => setMenuOuvert(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${
                          isActive
                            ? 'bg-primaire-700 text-white font-medium'
                            : 'text-slate-300 hover:bg-white/10 hover:text-white'
                        }`
                      }
                    >
                      <l.icone size={17} className="shrink-0" />
                      {l.libelle}
                    </NavLink>
                  ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primaire-700 flex items-center justify-center text-white text-sm font-semibold">
              {user?.name?.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-sm text-white truncate">{user?.name}</div>
              <div className="text-[11px] text-slate-400">{libelleRole[role ?? ''] ?? role}</div>
            </div>
            <button
              onClick={async () => {
                await deconnexion();
                navigate('/connexion');
              }}
              title="Se déconnecter"
              className="p-2 rounded-lg text-slate-300 hover:bg-white/10 hover:text-white"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {menuOuvert && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMenuOuvert(false)} />
      )}

      {/* Contenu */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-3">
            <button className="lg:hidden p-2 -ml-2 rounded hover:bg-slate-100" onClick={() => setMenuOuvert(true)}>
              <Menu size={20} />
            </button>
            <div className="font-semibold text-primaire-800">Gestion de Soutenance Master</div>
            <div className="ml-auto flex items-center gap-2">
              <NavLink
                to="/notifications"
                className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                title="Notifications"
              >
                <Bell size={19} />
                {nbNonLues > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-semibold">
                    {nbNonLues > 99 ? '99+' : nbNonLues}
                  </span>
                )}
              </NavLink>
            </div>
          </div>
        </header>

        <main className="min-h-0 min-w-0 w-full flex-1 overflow-auto overscroll-contain p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
