import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  ScreenShare,
  Volume2,
  Users,
  Radio,
  Sparkles,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import {
  toggleMute,
  toggleDeafen,
  toggleScreenShare,
  leaveVoiceChannel,
  setUserSpeaking,
} from '../../redux/slices/voiceSlice';
import { addToast } from '../../redux/slices/uiSlice';
import { MOCK_USERS } from '../../data/mockUsers';

export default function VoiceStage({ channel }) {
  const dispatch = useDispatch();
  const voice = useSelector((state) => state.voice);
  const currentUser = useSelector((state) => state.auth.currentUser);

  // Simulated speaking loop for participant realism
  const [simulatedSpeaker, setSimulatedSpeaker] = useState('usr_elena');

  useEffect(() => {
    const interval = setInterval(() => {
      const candidates = ['usr_elena', 'usr_liam', 'usr_kai', 'usr_marcus', null];
      const randomSpeaker = candidates[Math.floor(Math.random() * candidates.length)];
      setSimulatedSpeaker(randomSpeaker);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  const participantIds = voice.isConnected
    ? voice.activeParticipants
    : channel?.activeParticipants || [];

  const participants = MOCK_USERS.filter((u) => participantIds.includes(u.id));

  // If user isn't connected to this channel yet
  if (!voice.isConnected || voice.channelId !== channel.id) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#07080C] select-none">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4">
          <Volume2 className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="font-display font-bold text-xl text-white">
          {channel.name}
        </h3>
        <p className="text-slate-400 text-sm max-w-sm mt-1 mb-6">
          Nexus Audio Stage is live with {participants.length} connected participants.
        </p>
        <Button
          variant="primary"
          size="lg"
          className="shadow-glow-cyan"
          icon={Radio}
          onClick={() => {
            dispatch({
              type: 'voice/joinVoiceChannel',
              payload: {
                serverId: channel.serverId,
                channelId: channel.id,
                channelName: channel.name,
                existingParticipants: channel.activeParticipants || [],
              },
            });
            dispatch(
              addToast({
                type: 'success',
                message: `Connected to audio stage: ${channel.name}`,
              })
            );
          }}
        >
          Connect to Audio Stage
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#07080C] select-none overflow-hidden relative">
      {/* Stage Header Info */}
      <div className="px-6 py-4 border-b border-white/5 bg-[#0C0F15] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <h3 className="font-display font-semibold text-sm text-slate-100 flex items-center gap-2">
              <span>{channel.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                LIVE AUDIO
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Low-latency spatial audio engine (Opus 48kHz)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Users className="w-4 h-4 text-cyan-400" />
          <span>{participants.length} Active in Stage</span>
        </div>
      </div>

      {/* Participants Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {participants.map((user) => {
            const isMe = user.id === currentUser?.id;
            const isSpeaking =
              (isMe && !voice.isMuted && voice.isSpeaking) ||
              (!isMe && simulatedSpeaker === user.id);

            return (
              <motion.div
                key={user.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`relative bg-[#10141C] border ${
                  isSpeaking
                    ? 'border-emerald-500/80 shadow-lg shadow-emerald-500/20'
                    : 'border-white/10'
                } rounded-2xl p-6 flex flex-col items-center justify-center transition-all duration-300 min-h-[180px]`}
              >
                {/* Speaking Wave Glow Ring */}
                <div
                  className={`relative p-1 rounded-3xl transition-all duration-200 ${
                    isSpeaking ? 'speaking-active' : ''
                  }`}
                >
                  <Avatar
                    src={user.avatar}
                    name={user.name}
                    size="xl"
                    status={user.status}
                  />
                </div>

                <div className="mt-3 text-center">
                  <span className="font-display font-semibold text-sm text-slate-100 flex items-center justify-center gap-1.5">
                    {user.name}
                    {isMe && <span className="text-[10px] text-cyan-400 font-mono">(You)</span>}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    @{user.username}
                  </span>
                </div>

                {/* State Pill on bottom */}
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  {isMe && voice.isMuted && (
                    <div className="p-1 rounded-md bg-rose-500/20 text-rose-400" title="Muted">
                      <MicOff className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {isMe && voice.isDeafened && (
                    <div className="p-1 rounded-md bg-amber-500/20 text-amber-400" title="Deafened">
                      <Headphones className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {isSpeaking && (
                    <div className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold animate-pulse">
                      SPEAKING
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Voice Controls Dock Bar */}
      <div className="p-4 bg-[#0C0F15] border-t border-white/10 flex items-center justify-center gap-3">
        {/* Toggle Mute */}
        <button
          onClick={() => dispatch(toggleMute())}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            voice.isMuted
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-[#151A23] text-slate-200 border border-white/10 hover:bg-[#1E2535]'
          }`}
        >
          {voice.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
          <span>{voice.isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        {/* Toggle Deafen */}
        <button
          onClick={() => dispatch(toggleDeafen())}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            voice.isDeafened
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-[#151A23] text-slate-200 border border-white/10 hover:bg-[#1E2535]'
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>{voice.isDeafened ? 'Undeafen' : 'Deafen'}</span>
        </button>

        {/* Mock Screen Share */}
        <button
          onClick={() => {
            dispatch(toggleScreenShare());
            dispatch(
              addToast({
                type: 'info',
                message: voice.isScreenSharing
                  ? 'Screen broadcast terminated.'
                  : 'Screen broadcast simulated to participants.',
              })
            );
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            voice.isScreenSharing
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-[#151A23] text-slate-200 border border-white/10 hover:bg-[#1E2535]'
          }`}
        >
          <ScreenShare className="w-4 h-4" />
          <span className="hidden sm:inline">
            {voice.isScreenSharing ? 'Sharing Screen' : 'Share Screen'}
          </span>
        </button>

        {/* Disconnect Voice */}
        <button
          onClick={() => {
            dispatch(leaveVoiceChannel());
            dispatch(
              addToast({
                type: 'info',
                message: 'Disconnected from audio stage.',
              })
            );
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors"
        >
          <PhoneOff className="w-4 h-4" />
          <span>Disconnect</span>
        </button>
      </div>
    </div>
  );
}
