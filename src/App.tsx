import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RouteProtegee from './components/RouteProtegee';
import Connexion from './pages/Connexion';
import Inscription from './pages/Inscription';
import MotDePasseOublie from './pages/MotDePasseOublie';
import TableauDeBord from './pages/TableauDeBord';
import NotificationsPage from './pages/Notifications';
import Profil from './pages/Profil';

import Utilisateurs from './pages/admin/Utilisateurs';
import Etudiants from './pages/admin/Etudiants';
import Enseignants from './pages/admin/Enseignants';
import Referentiels from './pages/admin/Referentiels';
import Sessions from './pages/admin/Sessions';
import Salles from './pages/admin/Salles';
import Jurys from './pages/admin/Jurys';
import Soutenances from './pages/admin/Soutenances';
import Convocations from './pages/admin/Convocations';
import AuditLogs from './pages/admin/AuditLogs';

import MesSoutenances from './pages/enseignant/MesSoutenances';
import MesEvaluations from './pages/enseignant/MesEvaluations';
import Resultats from './pages/Resultats';
import ProcesVerbaux from './pages/ProcesVerbaux';

import MonEspace from './pages/etudiant/MonEspace';

export default function App() {
  return (
    <Routes>
      <Route path="/connexion" element={<Connexion />} />
      <Route path="/inscription" element={<Inscription />} />
      <Route path="/mot-de-passe-oublie" element={<MotDePasseOublie />} />

      <Route
        element={
          <RouteProtegee>
            <Layout />
          </RouteProtegee>
        }
      >
        <Route path="/" element={<TableauDeBord />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profil" element={<Profil />} />

        {/* Administration */}
        <Route path="/utilisateurs" element={<RouteProtegee roles={['administrateur']}><Utilisateurs /></RouteProtegee>} />
        <Route path="/etudiants" element={<RouteProtegee roles={['administrateur']}><Etudiants /></RouteProtegee>} />
        <Route path="/enseignants" element={<RouteProtegee roles={['administrateur']}><Enseignants /></RouteProtegee>} />
        <Route path="/referentiels" element={<RouteProtegee roles={['administrateur']}><Referentiels /></RouteProtegee>} />
        <Route path="/sessions" element={<RouteProtegee roles={['administrateur', 'responsable']}><Sessions /></RouteProtegee>} />
        <Route path="/salles" element={<RouteProtegee roles={['administrateur']}><Salles /></RouteProtegee>} />
        <Route path="/jurys" element={<RouteProtegee roles={['administrateur']}><Jurys /></RouteProtegee>} />
        <Route path="/soutenances" element={<RouteProtegee roles={['administrateur', 'responsable']}><Soutenances /></RouteProtegee>} />
        <Route path="/convocations" element={<RouteProtegee roles={['administrateur', 'responsable']}><Convocations /></RouteProtegee>} />
        <Route path="/audit" element={<RouteProtegee roles={['administrateur']}><AuditLogs /></RouteProtegee>} />

        {/* Espace jury */}
        <Route path="/mes-soutenances" element={<RouteProtegee roles={['enseignant']}><MesSoutenances /></RouteProtegee>} />
        <Route path="/mes-evaluations" element={<RouteProtegee roles={['enseignant']}><MesEvaluations /></RouteProtegee>} />

        {/* Suivi */}
        <Route path="/resultats" element={<RouteProtegee roles={['administrateur', 'responsable', 'enseignant']}><Resultats /></RouteProtegee>} />
        <Route path="/proces-verbaux" element={<RouteProtegee roles={['administrateur', 'responsable', 'enseignant']}><ProcesVerbaux /></RouteProtegee>} />

        {/* Espace étudiant */}
        <Route path="/mon-espace" element={<RouteProtegee roles={['etudiant']}><MonEspace /></RouteProtegee>} />
      </Route>

      <Route path="*" element={<RouteProtegee><TableauDeBord /></RouteProtegee>} />
    </Routes>
  );
}
