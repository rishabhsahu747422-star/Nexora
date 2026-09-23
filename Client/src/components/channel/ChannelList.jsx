import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Hash,
  Volume2,
  Megaphone,
  Plus,
  Settings,
  UserPlus,
  ChevronDown,
  Bell,
  LogOut,
  Sparkles,
  Lock,
} from 'lucide-react';
import Dropdown from '../common/Dropdown';
import Badge from '../common/Badge';
import { selectChannel } from '../../redux/slices/channelSlice';
import { openModal, addToast } from '../../redux/slices/uiSlice';
import { leaveServer } from '../../redux/slices/serverSlice';

export default function ChannelList({ onCloseMobile }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const servers = useSelector((state) => state.servers.servers);
  const activeServerId = useSelector((state) => state.servers.activeServerId);
  const channels = useSelector((state) => state.channels.channels);
  const activeChannelId = useSelector((state) => state.channels.activeChannelId);
  const activeServer = servers.find((s) => s.id === activeServerId) || servers[0];

  const serverChannels = channels.filter((c) => c.serverId === activeServerId);

  // Group channels by category
  const categories = ['Transmissions', 'Broadcasting', 'Nexus Audio'];
  const grouped = {
    Transmissions: serverChannels.filter((c) => c.category === 'Transmissions' || c.type === 'text'),
    Broadcasting: serverChannels.filter((c) => c.category === 'Broadcasting' || c.type === 'announcement'),
    'Nexus Audio': serverChannels.filter((c) => c.category === 'Nexus Audio' || c.type === 'voice'),
  };

  const handleSelectChannel = (channel) => {
    dispatch(selectChannel(channel.id));
    navigate(`/app/server/${activeServerId}/channel/${channel.id}`);
    if (onCloseMobile) onCloseMobile();
  };

  const getChannelIcon = (type) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />;
      case 'voice':
        return <Volume2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />;
      default:
        return <Hash className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />;
    }
  };

  return (
    <div className="w-64 bg-[#0C0F15] border-r border-white/10 flex flex-col h-full select-none flex-shrink-0">
      {/* Community Deck Header */}
      <div className="relative border-b border-white/10 bg-[#10141C] p-3 flex flex-col">
        {/* Server Dropdown Actions Menu */}
        <Dropdown
          align="left"
          className="w-full"
          trigger={({ isOpen }) => (
            <div className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-display font-bold text-sm text-slate-100 truncate">
                  {activeServer?.name}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {activeServer?.tag}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          )}
        >
          <div className="w-56 p-1.5 text-left space-y-0.5">
            <button
              onClick={() => dispatch(openModal({ type: 'INVITE', props: { server: activeServer } }))}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-cyan-400 hover:bg-cyan-500/10 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Members</span>
            </button>

            <button
              onClick={() =>
                dispatch(
                  openModal({
                    type: 'CREATE_CHANNEL',
                    props: { serverId: activeServerId },
                  })
                )
              }
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-white/5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Channel</span>
            </button>

            <button
              onClick={() =>
                dispatch(
                  openModal({
                    type: 'SERVER_SETTINGS',
                    props: { server: activeServer },
                  })
                )
              }
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-white/5 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Community Settings</span>
            </button>

            <div className="border-t border-white/5 my-1" />

            <button
              onClick={() => {
                if (window.confirm(`Leave ${activeServer?.name}?`)) {
                  dispatch(leaveServer(activeServerId));
                  dispatch(
                    addToast({
                      type: 'info',
                      message: `You left ${activeServer?.name}.`,
                    })
                  );
                  navigate('/app');
                }
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave Community</span>
            </button>
          </div>
        </Dropdown>

        {/* Server Sub-description */}
        <p className="text-[11px] text-slate-400 px-1.5 mt-1 line-clamp-1">
          {activeServer?.description}
        </p>
      </div>

      {/* Channel Categories & List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
        {categories.map((category) => {
          const list = grouped[category] || [];
          if (list.length === 0) return null;

          return (
            <div key={category} className="space-y-1">
              {/* Category Header */}
              <div className="flex items-center justify-between px-2.5 text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                <span>{category}</span>
                <button
                  onClick={() =>
                    dispatch(
                      openModal({
                        type: 'CREATE_CHANNEL',
                        props: {
                          serverId: activeServerId,
                          defaultType: category === 'Nexus Audio' ? 'voice' : 'text',
                        },
                      })
                    )
                  }
                  className="hover:text-cyan-400 transition-colors p-0.5"
                  title="Create Channel"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Channels in Category */}
              <div className="space-y-0.5">
                {list.map((chan) => {
                  const isSelected = chan.id === activeChannelId;

                  return (
                    <div
                      key={chan.id}
                      onClick={() => handleSelectChannel(chan)}
                      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/10 text-cyan-200 font-medium border border-cyan-500/30'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {getChannelIcon(chan.type)}
                        <span className="text-xs truncate">{chan.name}</span>
                        {chan.isPrivate && <Lock className="w-3 h-3 text-slate-500" />}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {chan.unread && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#0C0F15]" />
                        )}
                        {chan.type === 'voice' && chan.activeParticipants?.length > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
                            {chan.activeParticipants.length}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
