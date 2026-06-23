import React from 'react';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-hero-gradient text-white flex flex-col">
      <header className="py-6 px-6 md:px-8">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold">FV</div>
            <span className="font-semibold text-lg tracking-tight">FacilityVoice</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link to="/get-started" className="rounded-md bg-white/10 px-4 py-2 hover:bg-white/20 transition">Get Started</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center">
        <div className="container mx-auto py-16 px-6 md:px-8">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto py-10">
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 animate-slide-up">Facility issue management, reimagined.</h1>
            <p className="mb-8 text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl animate-slide-up">A secure, governed platform to report, track and resolve facility issues — designed for governments and large organisations. Clean UX, strict access control, and clear escalation paths.</p>
            <div className="flex gap-4 justify-center animate-slide-up">
              <Link to="/get-started" className="inline-block rounded-lg bg-white text-primary-700 px-6 py-3 font-semibold hover:shadow-lg transition">Get Started</Link>
              <a href="#features" className="inline-block rounded-lg bg-white/10 px-6 py-3 hover:bg-white/20 transition">Why FacilityVoice</a>
            </div>
          </div>

          <section id="features" className="mt-24">
            <h2 className="text-3xl font-extrabold text-center mb-12">Core Platform Capabilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="rounded-2xl bg-white/5 p-6 border border-white/5 hover:border-white/10 hover:bg-white/8 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold mb-4">01</div>
                <h4 className="font-bold text-white mb-2">Secure</h4>
                <p className="text-sm text-white/70">Role-based access and audit logs</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-6 border border-white/5 hover:border-white/10 hover:bg-white/8 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold mb-4">02</div>
                <h4 className="font-bold text-white mb-2">Scalable</h4>
                <p className="text-sm text-white/70">Built for multiple departments and facilities</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-6 border border-white/5 hover:border-white/10 hover:bg-white/8 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold mb-4">03</div>
                <h4 className="font-bold text-white mb-2">Actionable</h4>
                <p className="text-sm text-white/70">Clear workflows and escalations</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-6 border border-white/5 hover:border-white/10 hover:bg-white/8 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold mb-4">04</div>
                <h4 className="font-bold text-white mb-2">Structured Reporting</h4>
                <p className="text-sm text-white/70">Forms with required metadata to streamline triage and resolution.</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-6 border border-white/5 hover:border-white/10 hover:bg-white/8 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold mb-4">05</div>
                <h4 className="font-bold text-white mb-2">Escalation Rules</h4>
                <p className="text-sm text-white/70">Define thresholds and automatic escalations for critical issues.</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-6 border border-white/5 hover:border-white/10 hover:bg-white/8 transition-all duration-300">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold mb-4">06</div>
                <h4 className="font-bold text-white mb-2">Audit Trails</h4>
                <p className="text-sm text-white/70">Full history for compliance and transparency.</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="py-8 px-6 md:px-8 border-t border-white/5">
        <div className="container mx-auto text-center text-white/40 text-sm">© {new Date().getFullYear()} FacilityVoice. All rights reserved.</div>
      </footer>
    </div>
  );
}
