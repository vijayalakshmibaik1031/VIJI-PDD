import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import GetStarted from './pages/GetStarted';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import EmployeeLayout from './pages/employee/EmployeeLayout';
import EmployeeRaise from './pages/employee/EmployeeRaise';
import EmployeePrivate from './pages/employee/EmployeePrivate';
import EmployeePublic from './pages/employee/EmployeePublic';
import EmployeeAccount from './pages/employee/EmployeeAccount';
import ManagerLayout from './pages/manager/ManagerLayout';
import ManagerPending from './pages/manager/ManagerPending';
import ManagerMerge from './pages/manager/ManagerMerge';
import ManagerInProgress from './pages/manager/ManagerInProgress';
import ManagerCompleted from './pages/manager/ManagerCompleted';
import ManagerAll from './pages/manager/ManagerAll';
import AuthorityLayout from './pages/authority/AuthorityLayout';
import AuthorityOverview from './pages/authority/AuthorityOverview';
import AuthorityAll from './pages/authority/AuthorityAll';
import AuthorityEscalated from './pages/authority/AuthorityEscalated';

function HomeRedirect() {
  const { session } = useAuth();
  if (!session) return <Landing />;
  if (session.role === 'employee') return <Navigate to="/employee/raise" replace />;
  else if (session.role === 'manager') return <Navigate to="/manager/pending" replace />;
  else return <Navigate to="/authority/overview" replace />;
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="/login/:role" element={<Login />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/employee"
          element={
            <ProtectedRoute role="employee">
              <EmployeeLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/employee/raise" replace />} />
          <Route path="raise" element={<EmployeeRaise />} />
          <Route path="private" element={<EmployeePrivate />} />
          <Route path="public" element={<EmployeePublic />} />
          <Route path="account" element={<EmployeeAccount />} />
        </Route>

        <Route
          path="/manager"
          element={
            <ProtectedRoute role="manager">
              <ManagerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/manager/pending" replace />} />
          <Route path="pending" element={<ManagerPending />} />
          <Route path="merge" element={<ManagerMerge />} />
          <Route path="inprogress" element={<ManagerInProgress />} />
          <Route path="completed" element={<ManagerCompleted />} />
          <Route path="all" element={<ManagerAll />} />
        </Route>

        <Route
          path="/authority"
          element={
            <ProtectedRoute role="authority">
              <AuthorityLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/authority/overview" replace />} />
          <Route path="overview" element={<AuthorityOverview />} />
          <Route path="all" element={<AuthorityAll />} />
          <Route path="escalated" element={<AuthorityEscalated />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
