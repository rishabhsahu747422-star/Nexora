import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import GlobalHeader from '../components/layout/GlobalHeader';
import MobileNav from '../components/layout/MobileNav';
import UserSettingsModal from '../components/modals/UserSettingsModal';

export default function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen flex flex-col bg-[#07080C] text-slate-100 overflow-hidden">
      <GlobalHeader />

      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {/* Render the full user settings dialog inline / modal */}
        <UserSettingsModal isOpen={true} onClose={() => navigate('/app')} />
      </div>

      <MobileNav />
    </div>
  );
}
