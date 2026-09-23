import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Hash,
  Volume2,
  Megaphone,
  Pin,
  Bell,
  Search,
  Users,
  Radio,
  PhoneCall,
} from 'lucide-react';
import { openModal, toggleMobileMembers } from '../../redux/slices/uiSlice';
import { joinVoiceChannel } from '../../redux/slices/voiceSlice';

export default function ChannelHeader({ channel, onOpenPinned }) {
  const dispatch = useDispatch();
  const voice = useSelector((state) => state.voice);
  const activeServerId = useSelector((state) => state.servers.activeServerId);
  const activeServer = useSelector((state) =>
    state.servers.servers.find((s) => s.id === activeServerId)
  );

  if (!channel) return null;

  const isVoice = channel.type === 'voice';

  return (
    <div className="h-14 bg-[#10141C] border-b border-white/10 px-4 flex items-center justify-between z-10 flex-shrink-0">
      {/* Left: Channel Indicator, Name, Topic */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="p-1.5 rounded-lg bg-white/5 text-cyan-400">
          {channel.type === 'voice' ? (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          ) : channel.type === 'announcement' ? (
            <Megaphone className="w-4 h-4 text-indigo-400" />
          ) : (
            <Hash className="w-4 h-4 text-cyan-400" />
          )}
        </div>

        <div className="flex items-baseline gap-2 min-w-0">
          <h2 className="font-display font-semibold text-sm sm:text-base text-slate-100 truncate">
            {channel.name}
          </h2>

          {channel.topic && (
            <span className="hidden md:inline text-xs text-slate-400 border-l border-white/10 pl-2.5 truncate max-w-md">
              {channel.topic}
            </span>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Join Voice Stage action if voice channel */}
        {isVoice && !voice.isConnected && (
          <button
            onClick={() =>
              dispatch(
                joinVoiceChannel({
                  serverId: activeServerId,
                  channelId: channel.id,
                  channelName: channel.name,
                  existingParticipants: channel.activeParticipants || [],
                })
              )
            }
            className="flex items-center gap-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Join Stage</span>
          </button>
        )}

        {/* Pinned Messages Trigger */}
        <button
          onClick={onOpenPinned}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors relative"
          title="Pinned Transmissions"
        >
          <Pin className="w-4 h-4" />
        </button>

        {/* Toggle Member Roster on desktop */}
        <button
          onClick={() => dispatch(toggleMobileMembers())}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Toggle Member Roster"
        >
          <Users className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
