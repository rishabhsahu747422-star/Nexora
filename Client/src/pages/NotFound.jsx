import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import NexoraLogo from '../assets/logo/NexoraLogo';
import Button from '../components/common/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#07080C] text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none relative overflow-hidden">
      <div className="absolute top-1/3 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <NexoraLogo size="lg" showTagline onClick={() => navigate('/')} className="mb-8" />

      <div className="relative">
        <span className="font-mono text-8xl sm:text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-500 opacity-40">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="font-display font-bold text-2xl sm:text-3xl text-white">
            Transmission Lost
          </p>
        </div>
      </div>

      <p className="text-slate-400 text-sm sm:text-base max-w-md mt-4 mb-8">
        The coordinates you entered do not correspond to any active Nexora node, channel, or workspace.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button variant="primary" icon={Home} onClick={() => navigate('/app')}>
          Return to Workspace
        </Button>
        <Button variant="secondary" icon={Compass} onClick={() => navigate('/')}>
          Visit Home Portal
        </Button>
      </div>
    </div>
  );
}
