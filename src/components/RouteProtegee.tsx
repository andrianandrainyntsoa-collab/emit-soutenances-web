import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Chargement } from './ui';

/** Garde d'accès : rôle(s) autorisé(s). */
export default function RouteProtegee({
  roles,
  children,
}: {
  roles?: string[];
  children: JSX.Element;
}) {
  const { user, role, chargement } = useAuth();

  if (chargement) return <Chargement />;
  if (!user) return <Navigate to="/connexion" replace />;
  if (roles && (!role || !roles.includes(role))) return <Navigate to="/" replace />;

  return children;
}
