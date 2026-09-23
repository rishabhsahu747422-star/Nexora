import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Search,
  Bell,
  MessageSquare,
  Compass,
  Grid,
  Settings,
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  Plus,
  Check,
  ChevronDown,
  Menu,
  Users,
  LogOut,
  User as UserIcon,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import NexoraLogo from '../../assets/logo/NexoraLogo';
import NexoraSymbol from '../../assets/logo/NexoraSymbol';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import Dropdown from '../common/Dropdown';
import Tooltip from '../common/Tooltip';
import { selectServer } from '../../redux/slices/serverSlice';
import { selectChannel } from '../../redux/slices/channelSlice';
import { selectDm } from '../../redux/slices/dmSlice';
import {
  openGlobalSearch,
  openModal,
  toggleMobileDrawer,
  toggleMobileMembers,
  addToast,
} from '../../redux/slices/uiSlice';
import {
  leaveVoiceChannel,
  toggleMute,
} from '../../redux/slices/voiceSlice';
import { logout, setUserStatus } from '../../redux/slices/authSlice';

export default function GlobalHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const currentUser = useSelector((state) => state.auth.currentUser);
  const servers = useSelector((state) => state.servers.servers);
  const activeServerId = useSelector((state) => state.servers.activeServerId);
  const channels = useSelector((state) => state.channels.channels);
  const notifications = useSelector((state) => state.notifications.notifications);
  const voice = useSelector((state) => state.voice);
  const dms = useSelector((state) => state.dms.conversations);

  const activeServer = servers.find((s) => s.id === activeServerId) || servers[0];
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;
  const unreadDmsCount = dms.reduce((acc, d) => acc + (d.unreadCount || 0), 0);

  // Active top navigation tab
  const getActiveTab = () => {
    if (location.pathname.startsWith('/app/messages')) return 'dms';
    if (location.pathname.startsWith('/app/server')) return 'communities';
    if (location.pathname.startsWith('/app/settings')) return 'settings';
    if (location.pathname.startsWith('/app/profile')) return 'profile';
    return 'hub';
  };

  const activeTab = getActiveTab();

  const handleServerSwitch = (server) => {
    dispatch(selectServer(server.id));
    const defaultChan =
      channels.find((c) => c.serverId === server.id) || { id: server.defaultChannelId };
    if (defaultChan) {
      dispatch(selectChannel(defaultChan.id));
      navigate(`/app/server/${server.id}/channel/${defaultChan.id}`);
    } else {
      navigate(`/app/server/${server.id}`);
    }
  };

  return (
    <header className="h-14 bg-[#0C0F15] border-b border-white/10 px-3 sm:px-4 flex items-center justify-between z-30 select-none flex-shrink-0">
      {/* Left: Mobile Drawer Trigger + Brand + Community Switcher */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Mobile menu button */}
        <button
          onClick={() => dispatch(toggleMobileDrawer())}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 active:scale-95"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Nexora Brand Logo */}
        <div
          onClick={() => navigate('/app')}
          className="cursor-pointer hidden sm:flex items-center"
        >
          <NexoraLogo size="sm" />
        </div>
        <div
          onClick={() => navigate('/app')}
          className="cursor-pointer sm:hidden flex items-center"
        >
          <NexoraSymbol size={28} />
        </div>

        <div className="h-5 w-px bg-white/10 mx-1 hidden sm:block" />

        {/* Community Switcher Dropdown */}
        <Dropdown
          align="left"
          trigger={({ isOpen }) => (
            <div className="flex items-center gap-2 bg-[#151A23] hover:bg-[#1C2331] border border-white/10 px-2.5 py-1.5 rounded-xl transition-all">
              <img
                src={activeServer?.icon}
                alt={activeServer?.name}
                className="w-5 h-5 rounded-lg object-cover"
              />
              <span className="text-xs font-semibold text-slate-200 max-w-[120px] sm:max-w-[150px] truncate">
                {activeServer?.name}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          )}
        >
          <div className="p-2 w-64 space-y-1">
            <div className="px-2 py-1.5 text-[11px] font-mono uppercase text-slate-400 tracking-wider">
              Communities & Workspaces
            </div>

            {servers.map((srv) => {
              const isSelected = srv.id === activeServerId;
              return (
                <div
                  key={srv.id}
                  onClick={() => handleServerSwitch(srv)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                      : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={srv.icon}
                      alt={srv.name}
                      className="w-6 h-6 rounded-md object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 text-left">
                      <p className="text-xs truncate">{srv.name}</p>
                      <p className="text-[10px] text-slate-400">{srv.memberCount} members</p>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />}
                </div>
              );
            })}

            <div className="border-t border-white/5 pt-1 mt-1">
              <button
                onClick={() => dispatch(openModal({ type: 'CREATE_SERVER' }))}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium text-cyan-400 hover:bg-cyan-500/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Community</span>
              </button>
            </div>
          </div>
        </Dropdown>
      </div>

      {/* Center: High-Level Navigation Tabs (Desktop/Tablet) */}
      <nav className="hidden lg:flex items-center gap-1 bg-[#10141C] p-1 rounded-xl border border-white/5">
        <button
          onClick={() => navigate('/app')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'hub'
              ? 'bg-[#151A23] text-cyan-300 shadow-sm border border-white/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Workspace Hub</span>
        </button>

        <button
          onClick={() => {
            const defChan = channels.find((c) => c.serverId === activeServer.id);
            if (defChan) {
              navigate(`/app/server/${activeServer.id}/channel/${defChan.id}`);
            } else {
              navigate(`/app/server/${activeServer.id}`);
            }
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'communities'
              ? 'bg-[#151A23] text-cyan-300 shadow-sm border border-white/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Channels</span>
        </button>

        <button
          onClick={() => navigate('/app/messages')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
            activeTab === 'dms'
              ? 'bg-[#151A23] text-cyan-300 shadow-sm border border-white/10'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Transmissions</span>
          {unreadDmsCount > 0 && (
            <Badge variant="unread" size="xs">
              {unreadDmsCount}
            </Badge>
          )}
        </button>
      </nav>

      {/* Right: Search, Voice Pill, Notifications, Profile Capsule */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Universal Command Search Trigger */}
        <button
          onClick={() => dispatch(openGlobalSearch())}
          className="flex items-center gap-2 bg-[#151A23] hover:bg-[#1E2535] border border-white/10 text-slate-400 hover:text-slate-200 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs transition-all"
        >
          <Search className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline text-slate-300 font-normal">Search Nexora...</span>
          <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-slate-400 border border-white/5">
            ⌘K
          </kbd>
        </button>

        {/* Live Voice Status Capsule (Visible when in a voice channel) */}
        {voice.isConnected && (
          <div className="flex items-center gap-1.5 bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-xl animate-fadeIn">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono text-emerald-300 max-w-[90px] sm:max-w-[120px] truncate hidden sm:inline">
              {voice.channelName}
            </span>
            <button
              onClick={() => dispatch(toggleMute())}
              className={`p-1 rounded-md transition-colors ${
                voice.isMuted ? 'text-rose-400 hover:bg-rose-500/20' : 'text-slate-300 hover:text-white'
              }`}
              title={voice.isMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              {voice.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => {
                dispatch(leaveVoiceChannel());
                dispatch(addToast({ type: 'info', message: 'Disconnected from voice stage.' }));
              }}
              className="p-1 text-rose-400 hover:bg-rose-500/20 rounded-md transition-colors"
              title="Disconnect Voice"
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Notifications Popover */}
        <Dropdown
          align="right"
          trigger={
            <div className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
              <Bell className="w-4 h-4" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-[#0C0F15]" />
              )}
            </div>
          }
        >
          <div className="w-80 p-2">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
              <span className="text-xs font-semibold text-slate-200">Notifications</span>
              {unreadNotifsCount > 0 && (
                <span className="text-[10px] font-mono text-cyan-400 font-medium">
                  {unreadNotifsCount} new
                </span>
              )}
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-white/5 py-1">
              {notifications.slice(0, 5).map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    if (notif.link) navigate(notif.link);
                  }}
                  className={`p-2.5 rounded-lg cursor-pointer transition-colors text-left ${
                    !notif.read ? 'bg-cyan-500/5 hover:bg-cyan-500/10' : 'hover:bg-white/5'
                  }`}
                >
                  <p className="text-xs font-medium text-slate-200">{notif.title}</p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{notif.message}</p>
                  <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                    {notif.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Dropdown>

        {/* Mobile Toggle for Members Drawer */}
        <button
          onClick={() => dispatch(toggleMobileMembers())}
          className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
          title="Community Roster"
        >
          <Users className="w-4 h-4" />
        </button>

        {/* User Profile Capsule Dropdown */}
        <Dropdown
          align="right"
          trigger={
            <div className="flex items-center gap-2 bg-[#151A23] hover:bg-[#1E2535] border border-white/10 p-1 pr-2.5 rounded-2xl transition-all">
              <Avatar
                src={currentUser?.avatar}
                name={currentUser?.name}
                size="sm"
                status={currentUser?.status || 'online'}
              />
              <span className="text-xs font-medium text-slate-200 hidden sm:inline max-w-[90px] truncate">
                {currentUser?.name?.split(' ')[0]}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:inline" />
            </div>
          }
        >
          <div className="w-56 p-2 text-left">
            <div className="px-3 py-2 border-b border-white/5 mb-1">
              <p className="text-xs font-semibold text-slate-100">{currentUser?.name}</p>
              <p className="text-[11px] font-mono text-cyan-400">@{currentUser?.username}</p>
              <p className="text-[10px] text-slate-400 italic mt-0.5 truncate">
                {currentUser?.customStatus}
              </p>
            </div>

            {/* Status Selector */}
            <div className="px-2 py-1 text-[10px] uppercase font-mono text-slate-500">
              Set Status
            </div>
            <div className="grid grid-cols-2 gap-1 mb-2 px-1">
              {[
                { label: 'Online', val: 'online', color: 'bg-emerald-400' },
                { label: 'Idle', val: 'idle', color: 'bg-amber-400' },
                { label: 'DND', val: 'dnd', color: 'bg-rose-500' },
                { label: 'Offline', val: 'offline', color: 'bg-slate-500' },
              ].map((s) => (
                <button
                  key={s.val}
                  onClick={() => dispatch(setUserStatus(s.val))}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors ${
                    currentUser?.status === s.val
                      ? 'bg-white/10 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${s.color}`} />
                  <span>{s.label}</span>
                </button>
              ))}
            </div>

            <div className="border-t border-white/5 pt-1 space-y-0.5">
              <button
                onClick={() => navigate('/app/profile')}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>My Profile</span>
              </button>
              <button
                onClick={() => dispatch(openModal({ type: 'USER_SETTINGS' }))}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>User Preferences</span>
              </button>
              <button
                onClick={() => {
                  dispatch(logout());
                  dispatch(addToast({ type: 'info', message: 'Signed out of Nexora.' }));
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </Dropdown>
      </div>
    </header>
  );
}
