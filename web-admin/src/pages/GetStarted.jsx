import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function GetStarted() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-4xl font-extrabold mb-12 text-center text-white tracking-tight">
          Select Your Access Role
        </h2>

        <div className="grid gap-8 grid-cols-1 md:grid-cols-3">
          {/* Employee Card */}
          <div className="rounded-2xl bg-white/5 p-8 shadow-xl flex flex-col border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300">
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Role</span>
              <h3 className="text-2xl font-bold text-white mt-1">Employee</h3>
            </div>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Sign in to report and track facility issues in your department on any device.
            </p>
            <button
              onClick={() => navigate('/login/employee')}
              className="mt-auto w-full rounded-xl bg-indigo-600 py-3 text-white font-semibold hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 transition duration-200"
            >
              Sign in as Employee
            </button>
          </div>

          {/* Manager Card */}
          <div className="rounded-2xl bg-white/5 p-8 shadow-xl flex flex-col border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300">
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Role</span>
              <h3 className="text-2xl font-bold text-white mt-1">Manager</h3>
            </div>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Review, assign, escalate, and track reports with dashboards and bulk actions.
            </p>
            <button
              onClick={() => navigate('/login/manager')}
              className="mt-auto w-full rounded-xl bg-indigo-600 py-3 text-white font-semibold hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 transition duration-200"
            >
              Sign in as Manager
            </button>
          </div>

          {/* Authority Card */}
          <div className="rounded-2xl bg-white/5 p-8 shadow-xl flex flex-col border border-white/10 hover:border-indigo-500/50 hover:bg-white/10 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300">
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Role</span>
              <h3 className="text-2xl font-bold text-white mt-1">Authority</h3>
            </div>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Oversight tools for critical escalations, compliance monitoring, and analytics.
            </p>
            <button
              onClick={() => navigate('/login/authority')}
              className="mt-auto w-full rounded-xl bg-indigo-600 py-3 text-white font-semibold hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 transition duration-200"
            >
              Sign in as Authority
            </button>
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
          All sign-ins require valid credentials. Employees and managers are registered by their system administrators.
        </div>
      </div>
    </div>
  );
}
