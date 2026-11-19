import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Auth } from '../api/endpoints';
import type { User } from '../types';

interface AuthContexte {
  user: User | null;
  role: string | null;
  chargement: boolean;
  connexion: (email: string, motDePasse: string, seSouvenir: boolean) => Promise<void>;
  deconnexion: () => Promise<void>;
}

const Contexte = createContext<AuthContexte | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      setChargement(false);
      return;
    }
    Auth.user()
      .then((r) => setUser(r.data))
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      })
      .finally(() => setChargement(false));
  }, []);

  const connexion = useCallback(async (email: string, motDePasse: string, seSouvenir: boolean) => {
    const r = await Auth.login(email, motDePasse);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    const stockage = seSouvenir ? localStorage : sessionStorage;
    stockage.setItem('token', r.data.token);
    stockage.setItem('user', JSON.stringify(r.data.user));
    setUser(r.data.user);
  }, []);

  const deconnexion = useCallback(async () => {
    try {
      await Auth.logout();
    } catch {
      // on ignore : la session locale est supprimée dans tous les cas
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
  }, []);

  const valeur = useMemo(
    () => ({
      user,
      role: user?.role?.name ?? null,
      chargement,
      connexion,
      deconnexion,
    }),
    [user, chargement, connexion, deconnexion]
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useAuth(): AuthContexte {
  const ctx = useContext(Contexte);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
