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
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Mobile hamburger (web small screens only) */}
      <div className="md:hidden border-b bg-white p-3">
        <button
          className="rounded border px-3 py-1 text-sm"
          onClick={() => setOpen((v) => !v)}
          type="button"
          aria-label="Toggle menu"
        >
          {open ? '✕ Close' : '☰ Menu'}
        </button>
      </div>

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside
          className={`${
            open ? 'block' : 'hidden'
          } w-64 shrink-0 border-r bg-white p-4 md:block`}
        >
          <h1 className="mb-1 text-xl font-semibold text-slate-800">FacilityDesk</h1>
          <p className="mb-4 text-xs text-slate-500">{title}</p>

          <nav className="space-y-1">
            {links.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <NavIcon to={link.to} label={link.label} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6 border-t pt-4 text-xs text-slate-500">
            <p className="font-medium text-slate-700">{session?.name}</p>
            <button
              type="button"
              className="mt-2 flex items-center gap-1 rounded bg-slate-900 px-3 py-1 text-white"
              onClick={logout}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>
        </aside>

        {/* Page content */}
        <main className="min-w-0 flex-1 p-4 md:p-6">
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
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-800">
      {/* Top header bar */}
      <header className="flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
        <div>
          <p className="text-base font-semibold text-slate-800 leading-tight">FacilityDesk</p>
          <p className="text-xs text-slate-500">{title}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600">{session?.name}</span>
          <button
            type="button"
            className="flex items-center gap-1 rounded bg-slate-900 px-3 py-1.5 text-xs text-white"
            onClick={logout}
            aria-label="Logout"
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </header>

      {/* Scrollable page content — padded so it never hides behind the bottom nav */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <Outlet />
      </main>

      {/* Fixed bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex border-t bg-white"
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
                  ? 'text-slate-900'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              {/* Active indicator dot */}
              {active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-slate-900" />
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
