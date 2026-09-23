import React, { useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Compass,
  MessageSquare,
  Users,
  Radio,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import GlobalHeader from '../components/layout/GlobalHeader';
import MobileNav from '../components/layout/MobileNav';
import ChannelList from '../components/channel/ChannelList';
import MemberList from '../components/members/MemberList';
import ChatContainer from '../components/chat/ChatContainer';
import VoiceStage from '../components/voice/VoiceStage';
import DmList from '../components/dm/DmList';
import DmConversation from '../components/dm/DmConversation';
import FriendsHub from '../components/friends/FriendsHub';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import Badge from '../components/common/Badge';
import { selectServer } from '../redux/slices/serverSlice';
import { selectChannel } from '../redux/slices/channelSlice';
import { selectDm } from '../redux/slices/dmSlice';
import { openModal } from '../redux/slices/uiSlice';

export default function Workspace() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { serverId, channelId, dmId } = useParams();

  const servers = useSelector((state) => state.servers.servers);
  const activeServerId = useSelector((state) => state.servers.activeServerId);
  const channels = useSelector((state) => state.channels.channels);
  const activeChannelId = useSelector((state) => state.channels.activeChannelId);
  const activeDmId = useSelector((state) => state.dms.activeDmId);
  const currentUser = useSelector((state) => state.auth.currentUser);

  // Sync URL params with Redux state
  useEffect(() => {
    if (serverId && serverId !== activeServerId) {
      dispatch(selectServer(serverId));
    }
  }, [serverId, activeServerId, dispatch]);

  useEffect(() => {
    if (channelId && channelId !== activeChannelId) {
      dispatch(selectChannel(channelId));
    }
  }, [channelId, activeChannelId, dispatch]);

  useEffect(() => {
    if (dmId && dmId !== activeDmId) {
      dispatch(selectDm(dmId));
    }
  }, [dmId, activeDmId, dispatch]);

  // Determine current mode based on route
  const isDmMode = location.pathname.startsWith('/app/messages');
  const isServerMode = location.pathname.startsWith('/app/server');
  const isHubMode = location.pathname === '/app' || location.pathname === '/app/';

  // Find active server & channel objects
  const currentServer = servers.find((s) => s.id === (serverId || activeServerId)) || servers[0];
  const currentChannel = channels.find((c) => c.id === (channelId || activeChannelId)) || channels[0];

  return (
    <div className="h-screen w-screen flex flex-col bg-[#07080C] text-slate-100 overflow-hidden select-none">
      {/* Top Global Command Header */}
      <GlobalHeader />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ================= SERVER / COMMUNITY MODE ================= */}
        {isServerMode && (
          <>
            {/* Desktop Channel List Deck */}
            <div className="hidden md:flex">
              <ChannelList />
            </div>

            {/* Main Channel Area (Chat or Voice Stage) */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#07080C] h-full">
              {currentChannel?.type === 'voice' ? (
                <VoiceStage channel={currentChannel} />
              ) : (
                <ChatContainer channel={currentChannel} />
              )}
            </div>

            {/* Desktop Member Roster Panel */}
            <div className="hidden lg:flex">
              <MemberList />
            </div>
          </>
        )}

        {/* ================= DIRECT MESSAGES MODE ================= */}
        {isDmMode && (
          <>
            {/* DMs Conversation List Deck */}
            <div className="hidden sm:flex">
              <DmList
                selectedDmId={dmId || activeDmId}
                onSelectConversation={(id) => navigate(`/app/messages/${id}`)}
              />
            </div>

            {/* DM Chat Conversation Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#07080C] h-full">
              <DmConversation dmId={dmId || activeDmId} />
            </div>
          </>
        )}

        {/* ================= WORKSPACE HUB MODE (/app) ================= */}
        {isHubMode && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Hub Welcome Banner */}
              <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-cyan-950/40 via-[#10141C] to-violet-950/40 border border-white/10 shadow-2xl overflow-hidden">
                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>NEXORA COMMAND DECK</span>
                  </div>
                  <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-white">
                    Welcome back, {currentUser?.name?.split(' ')[0]}
                  </h1>
                  <p className="text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
                    You have active nodes connected across {servers.length} communities. Jump into a transmission stream or check your pending network connections below.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Plus}
                      onClick={() => dispatch(openModal({ type: 'CREATE_SERVER' }))}
                    >
                      Create Community
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={MessageSquare}
                      onClick={() => navigate('/app/messages')}
                    >
                      Open Transmissions
                    </Button>
                  </div>
                </div>

                <div className="absolute right-[-20px] bottom-[-40px] opacity-10 pointer-events-none hidden md:block">
                  <span className="font-mono text-[220px] font-black text-cyan-400">NX</span>
                </div>
              </div>

              {/* Active Communities Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-display font-bold text-lg text-white">
                      Your Communities
                    </h2>
                    <p className="text-xs text-slate-400">
                      Decentralized networks you are actively contributing to
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Plus}
                    onClick={() => dispatch(openModal({ type: 'CREATE_SERVER' }))}
                  >
                    New
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {servers.map((srv) => (
                    <div
                      key={srv.id}
                      onClick={() => {
                        dispatch(selectServer(srv.id));
                        const def = channels.find((c) => c.serverId === srv.id);
                        if (def) {
                          dispatch(selectChannel(def.id));
                          navigate(`/app/server/${srv.id}/channel/${def.id}`);
                        } else {
                          navigate(`/app/server/${srv.id}`);
                        }
                      }}
                      className="group bg-[#10141C] hover:bg-[#151A23] border border-white/10 hover:border-cyan-500/40 rounded-2xl p-5 cursor-pointer transition-all duration-300 shadow-xl flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <img
                            src={srv.icon}
                            alt={srv.name}
                            className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10"
                          />
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                            {srv.tag}
                          </span>
                        </div>
                        <h3 className="font-display font-bold text-base text-white group-hover:text-cyan-300 transition-colors">
                          {srv.name}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {srv.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>{srv.memberCount} Members</span>
                        <div className="flex items-center gap-1 text-cyan-400 group-hover:translate-x-1 transition-transform">
                          <span>Enter</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Embedded Friends & Connections Hub */}
              <div className="bg-[#10141C] border border-white/10 rounded-3xl overflow-hidden shadow-2xl min-h-[460px] flex flex-col">
                <FriendsHub />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom & Drawer Nav */}
      <MobileNav />
    </div>
  );
}
