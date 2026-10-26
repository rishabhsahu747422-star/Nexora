import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Radio, 
  MessageSquare, 
  Volume2, 
  ShieldCheck, 
  Sparkles, 
  Users, 
  ArrowRight, 
  Compass, 
  Cpu, 
  Layers
} from 'lucide-react';
import NexoraLogo from '../assets/logo/NexoraLogo';
import NexoraSymbol from '../assets/logo/NexoraSymbol';
import Button from '../components/common/Button';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-slate-100 flex flex-col selection:bg-[var(--accent-soft)] selection:text-[var(--text-primary)] overflow-x-hidden">
      {/* Dynamic Ambient Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] bg-[var(--accent-glow)] opacity-10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] bg-white/[0.02] rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(var(--border-subtle)_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <NexoraLogo size="md" showTagline onClick={() => navigate('/')} />

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-[var(--accent)] transition-colors">Features</a>
          <a href="#architecture" className="hover:text-[var(--accent)] transition-colors">Architecture</a>
          <a href="#communities" className="hover:text-[var(--accent)] transition-colors">Communities</a>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-16 pb-24 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent)] text-xs font-mono mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>NEXUS PROTOCOL 2.0 • ULTRA-LOW LATENCY STREAMING</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display font-extrabold text-4xl sm:text-6xl md:text-7xl tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400"
        >
          Where communities connect, collaborate and create.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed font-sans"
        >
          Nexora is an architectural evolution for modern digital collectives. Experience frictionless real-time transmissions, spatial audio nodes, rich community decks, and zero noise.
        </motion.p>

        {/* Hero CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
        >
          <Button
            size="lg"
            variant="primary"
            className="w-full sm:w-auto shadow-glow-cyan"
            onClick={() => navigate('/app')}
            icon={ArrowRight}
            iconPosition="right"
          >
            Launch Nexora App
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => navigate('/login')}
          >
            Explore Live Demo
          </Button>
        </motion.div>

        {/* Live Interactive Product Preview Frame */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 w-full max-w-5xl rounded-2xl p-1 bg-gradient-to-b from-white/15 via-white/5 to-transparent shadow-2xl shadow-[var(--accent-glow)]/10"
        >
          <div className="bg-[var(--surface-secondary)] rounded-[15px] border border-[var(--border-subtle)] overflow-hidden flex flex-col text-left">
            {/* Window bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-[var(--surface-primary)] border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/70" />
                <div className="w-3 h-3 rounded-full bg-amber-500/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-white/5 px-3 py-1 rounded-md">
                <NexoraSymbol size={14} />
                <span>nexora://synthetix/transmissions-general</span>
              </div>
              <div className="w-16" />
            </div>

            {/* Mock Workspace Content preview */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[var(--surface-elevated)] p-4 rounded-xl border border-[var(--border-subtle)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center font-bold">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Transmissions Feed</h4>
                    <p className="text-[11px] text-slate-400">Threaded & fast</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Real-time markdown transmissions with instant reactions, replies, syntax-highlighted snippets and file previews.
                </p>
              </div>

              <div className="bg-[var(--surface-elevated)] p-4 rounded-xl border border-[var(--border-subtle)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Nexus Audio Stages</h4>
                    <p className="text-[11px] text-slate-400">Ultra-low latency</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Crystal clear spatial voice channels with dynamic speaker visualizers and active channel bridge persistence.
                </p>
              </div>

              <div className="bg-[var(--surface-elevated)] p-4 rounded-xl border border-[var(--border-subtle)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Cryptographic Hubs</h4>
                    <p className="text-[11px] text-slate-400">Autonomous governance</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Multi-tier role privileges, invite tokens with expiration rules, and dedicated moderation audit logs.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature Highlights Grid */}
        <section id="features" className="w-full mt-32 text-left">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">
              Built for High-Velocity Collectives
            </h2>
            <p className="text-slate-400 mt-3 text-sm sm:text-base max-w-xl mx-auto">
              Engineered with an original spatial hierarchy to eliminate cognitive fatigue and keep discussions in focus.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-[var(--surface-primary)] border border-[var(--border-subtle)] hover:border-[var(--accent-border)] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent)] flex items-center justify-center mb-5">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-white mb-2">Original Navigation Deck</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Step away from generic Discord clones. Nexora uses a high-altitude Command Header with quick community hubs and contextual streams.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--surface-primary)] border border-[var(--border-subtle)] hover:border-[var(--accent-border)] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-400 flex items-center justify-center mb-5">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-white mb-2">Interactive State Fabric</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Reactions that update in real-time, inline message editing, pinned transmission drawers, and local attachment object buffers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[var(--surface-primary)] border border-[var(--border-subtle)] hover:border-[var(--accent-border)] transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-5">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-white mb-2">Universal Command Search</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Instant keyboard-driven indexing with <span className="font-mono text-[var(--accent)]">Ctrl + K</span> across messages, channels, servers, and members.
              </p>
            </div>
          </div>
        </section>

        {/* Ready to connect CTA */}
        <div className="mt-28 w-full p-10 rounded-3xl bg-gradient-to-r from-[var(--surface-secondary)] via-[var(--surface-primary)] to-[var(--surface-secondary)] border border-[var(--border-subtle)] flex flex-col md:flex-row items-center justify-between gap-6 text-left">
          <div>
            <h3 className="font-display font-bold text-2xl sm:text-3xl text-white">
              Ready to experience Nexora?
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Join thousands of engineers, researchers, and creators today.
            </p>
          </div>
          <Button
            size="lg"
            variant="primary"
            onClick={() => navigate('/register')}
            className="flex-shrink-0"
            icon={ArrowRight}
            iconPosition="right"
          >
            Create Your Account
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-white/5 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <NexoraLogo size="sm" />
          <p>© 2026 Nexora Protocol. All rights reserved. Designed for decentralized communication.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms</span>
            <span className="hover:text-slate-400 cursor-pointer">Status</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
