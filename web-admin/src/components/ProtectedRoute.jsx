import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ role, children }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/" replace />;
  if (session.role !== role) return <Navigate to="/" replace />;
  return children;
}

