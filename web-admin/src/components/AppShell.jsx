import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Capacitor } from '@capacitor/core';

// Lucide icons used for bottom nav tabs
import {
  PlusCircle,
  Lock,
  Globe,
  User,
  Clock,
  GitMerge,
  Loader,
  CheckCircle,
  List,
  LayoutDashboard,
  AlertTriangle,
  LogOut,
} from 'lucide-react';

const isNative = Capacitor.isNativePlatform();

// Map route paths to a lucide icon component.
// Falls back to rendering the text label if the icon is not found.
const ICON_MAP = {
  // Employee
  '/employee/raise':   PlusCircle,
  '/employee/private': Lock,
  '/employee/public':  Globe,
  '/employee/account': User,
  // Manager
  '/manager/pending':    Clock,
  '/manager/merge':      GitMerge,
  '/manager/inprogress': Loader,
  '/manager/completed':  CheckCircle,
  '/manager/all':        List,
  // Authority
  '/authority/overview':  LayoutDashboard,
  '/authority/all':       List,
  '/authority/escalated': AlertTriangle,
};

/** Renders the icon for a nav link, falling back to the text label on error. */
function NavIcon({ to, label }) {
  const Icon = ICON_MAP[to];
  if (!Icon) return <span className="text-[10px] leading-tight">{label}</span>;
  try {
    return <Icon size={22} strokeWidth={1.8} aria-hidden="true" />;
  } catch {
    // Fallback: icon component threw — show label text instead
    return <span className="text-[10px] leading-tight">{label}</span>;
  }
}

// ─── Web sidebar layout ────────────────────────────────────────────────────────
function WebLayout({ title, links, session, logout }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-950 text-white app-dark-theme">
      {/* Mobile hamburger (web small screens only) */}
      <div className="md:hidden border-b border-slate-800 bg-slate-900/60 p-3 flex items-center justify-between">
        <span className="font-bold text-white tracking-tight">FacilityVoice</span>
        <button
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 transition"
          onClick={() => setOpen((v) => !v)}
          type="button"
          aria-label="Toggle menu"
        >
          {open ? '✕ Close' : '☰ Menu'}
        </button>
      </div>

      <div className="flex w-full">
        {/* Sidebar */}
        <aside
          className={`${
            open ? 'block' : 'hidden'
          } w-64 shrink-0 border-r border-slate-800 bg-slate-900/30 backdrop-blur-md p-6 md:block min-h-screen`}
        >
          <h1 className="mb-1 text-2xl font-extrabold text-white tracking-tight">FacilityVoice</h1>
          <p className="mb-6 text-xs text-slate-400 uppercase tracking-wider font-semibold">{title}</p>

          <nav className="space-y-1.5">
            {links.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <NavIcon to={link.to} label={link.label} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 border-t border-slate-800 pt-6 text-xs">
            <p className="font-semibold text-slate-200 text-sm">{session?.name}</p>
            <button
              type="button"
              className="mt-3 flex items-center gap-1.5 rounded-xl bg-rose-600/85 hover:bg-rose-600 px-4 py-2 text-white font-semibold shadow-lg shadow-rose-600/10 transition-all duration-150"
              onClick={logout}
              data-testid="logoutButton"
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </aside>

        {/* Page content */}
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ─── Native (Capacitor) bottom-nav layout ─────────────────────────────────────
function NativeLayout({ title, links, session, logout }) {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white app-dark-theme">
      {/* Top header bar */}
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-3 shadow-sm">
        <div>
          <p className="text-lg font-bold text-white leading-tight">FacilityVoice</p>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{title}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-300 font-semibold">{session?.name}</span>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-xl bg-rose-600/85 hover:bg-rose-600 px-3.5 py-2 text-xs text-white font-semibold transition"
            onClick={logout}
            aria-label="Logout"
            data-testid="logoutButton"
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </header>

      {/* Scrollable page content — padded so it never hides behind the bottom nav */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
        <Outlet />
      </main>

      {/* Fixed bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex border-t border-slate-800 bg-slate-900/90 text-slate-400"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Bottom navigation"
      >
        {links.map((link) => {
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-center transition-colors ${
                active
                  ? 'text-indigo-400 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {/* Active indicator dot */}
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-indigo-400" />
              )}
              <NavIcon to={link.to} label={link.label} />
              {/* Short label — truncate long names */}
              <span
                className="w-full truncate px-0.5 text-center"
                style={{ fontSize: '9px', lineHeight: '1.2' }}
              >
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// ─── AppShell — picks the right layout based on platform ──────────────────────
export default function AppShell({ title, links }) {
  const { logout, session } = useAuth();

  if (isNative) {
    return <NativeLayout title={title} links={links} session={session} logout={logout} />;
  }

  return <WebLayout title={title} links={links} session={session} logout={logout} />;
}
