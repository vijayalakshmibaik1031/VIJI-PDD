import { useAuth } from '../../context/AuthContext';

export default function EmployeeAccount() {
  const { session } = useAuth();
  return (
    <div className="rounded-lg border bg-white p-4">
      <h2 className="mb-2 text-lg font-semibold text-slate-800">Account</h2>
      <p className="text-sm text-slate-700">Name: {session.name}</p>
      <p className="text-sm text-slate-700">Employee ID: {session.userId}</p>
      <p className="text-xs text-slate-500">Private complaints are visible only to you, manager, and authority.</p>
    </div>
  );
}

