import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageSquare, Compass, Server, User, ArrowRight, X } from 'lucide-react';
import { closeGlobalSearch, openModal } from '../../redux/slices/uiSlice';
import { selectServer } from '../../redux/slices/serverSlice';
import { selectChannel } from '../../redux/slices/channelSlice';
import { setHighlightedMessageId } from '../../redux/slices/messageSlice';
import Avatar from '../common/Avatar';

export default function GlobalSearchModal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isOpen = useSelector((state) => state.ui.isGlobalSearchOpen);
  const servers = useSelector((state) => state.servers.servers);
  const channels = useSelector((state) => state.channels.channels);
  const messagesByContext = useSelector((state) => state.messages.messagesByContext);
  const currentUser = useSelector((state) => state.auth.currentUser);

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'messages' | 'channels' | 'servers' | 'users'

  // Global key listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          dispatch(closeGlobalSearch());
        } else {
          // Open search
          dispatch({ type: 'ui/openGlobalSearch' });
        }
      }
      if (e.key === 'Escape' && isOpen) {
        dispatch(closeGlobalSearch());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dispatch]);

  // Aggregate results across all categories
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { messages: [], channels: [], servers: [], users: [] };

    // Search Servers
    const matchedServers = servers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tag.toLowerCase().includes(q)
    );

    // Search Channels
    const matchedChannels = channels.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.topic && c.topic.toLowerCase().includes(q))
    );

    // Search Messages across all channels
    const matchedMessages = [];
    Object.entries(messagesByContext).forEach(([contextId, msgs]) => {
      if (Array.isArray(msgs)) {
        msgs.forEach((m) => {
          if (m.content.toLowerCase().includes(q)) {
            // Find channel details
            const chan = channels.find((c) => c.id === contextId);
            matchedMessages.push({
              ...m,
              channelName: chan ? chan.name : 'transmission',
              serverId: chan ? chan.serverId : null,
            });
          }
        });
      }
    });

    // Mock Users for search
    const matchedUsers = [
      { id: 'usr_elena', name: 'Dr. Elena Rostova', username: 'elena_ai', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', status: 'online' },
      { id: 'usr_marcus', name: 'Marcus Vance', username: 'marcus_v', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', status: 'online' },
      { id: 'usr_sora', name: 'Sora Takahashi', username: 'sora_t', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', status: 'idle' },
      { id: 'usr_kai', name: 'Kai Thorne', username: 'kaithorne', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', status: 'online' },
      { id: 'usr_anya', name: 'Anya Sharma', username: 'anyasharma', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', status: 'dnd' },
    ].filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q)
    );

    return {
      servers: matchedServers,
      channels: matchedChannels,
      messages: matchedMessages,
      users: matchedUsers,
    };
  }, [query, servers, channels, messagesByContext]);

  const totalResults =
    searchResults.servers.length +
    searchResults.channels.length +
    searchResults.messages.length +
    searchResults.users.length;

  const handleSelectMessage = (msg) => {
    dispatch(closeGlobalSearch());
    if (msg.serverId && msg.channelId) {
      dispatch(selectServer(msg.serverId));
      dispatch(selectChannel(msg.channelId));
      dispatch(setHighlightedMessageId(msg.id));
      navigate(`/app/server/${msg.serverId}/channel/${msg.channelId}`);
    }
  };

  const handleSelectChannel = (channel) => {
    dispatch(closeGlobalSearch());
    dispatch(selectServer(channel.serverId));
    dispatch(selectChannel(channel.id));
    navigate(`/app/server/${channel.serverId}/channel/${channel.id}`);
  };

  const handleSelectServer = (server) => {
    dispatch(closeGlobalSearch());
    dispatch(selectServer(server.id));
    const def = channels.find((c) => c.serverId === server.id);
    if (def) {
      dispatch(selectChannel(def.id));
      navigate(`/app/server/${server.id}/channel/${def.id}`);
    } else {
      navigate(`/app/server/${server.id}`);
    }
  };

  const handleSelectUser = (user) => {
    dispatch(closeGlobalSearch());
    dispatch(openModal({ type: 'PROFILE', props: { user } }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 select-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => dispatch(closeGlobalSearch())}
        className="fixed inset-0 bg-black/75 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-2xl bg-[#10141C] border border-white/10 rounded-2xl shadow-2xl shadow-black/90 overflow-hidden flex flex-col"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-[#151A23]">
          <Search className="w-5 h-5 text-cyan-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transmissions, channels, communities, or members..."
            autoFocus
            className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/50 text-slate-400 border border-white/10">
            ESC
          </kbd>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-[#0C0F15] text-xs">
          {[
            { id: 'all', label: 'All Results' },
            { id: 'messages', label: `Transmissions (${searchResults.messages.length})` },
            { id: 'channels', label: `Channels (${searchResults.channels.length})` },
            { id: 'servers', label: `Communities (${searchResults.servers.length})` },
            { id: 'users', label: `Members (${searchResults.users.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                activeCategory === tab.id
                  ? 'bg-cyan-500/15 text-cyan-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results Stream */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {query.trim() === '' ? (
            <div className="py-12 text-center text-slate-500 text-xs font-mono">
              Type to search across the entire Nexora network
            </div>
          ) : totalResults === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No matching records found for "{query}".
            </div>
          ) : (
            <>
              {/* Messages / Transmissions */}
              {(activeCategory === 'all' || activeCategory === 'messages') &&
                searchResults.messages.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-mono uppercase text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                      Transmissions
                    </h4>
                    <div className="space-y-1">
                      {searchResults.messages.slice(0, 5).map((msg) => (
                        <div
                          key={msg.id}
                          onClick={() => handleSelectMessage(msg)}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar src={msg.authorAvatar} name={msg.authorName} size="xs" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-200">
                                  {msg.authorName}
                                </span>
                                <span className="text-[10px] text-cyan-400 font-mono">
                                  #{msg.channelName}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {msg.content}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Channels */}
              {(activeCategory === 'all' || activeCategory === 'channels') &&
                searchResults.channels.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-mono uppercase text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-indigo-400" />
                      Channels
                    </h4>
                    <div className="space-y-1">
                      {searchResults.channels.slice(0, 4).map((chan) => (
                        <div
                          key={chan.id}
                          onClick={() => handleSelectChannel(chan)}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
                        >
                          <div>
                            <span className="text-xs font-semibold text-slate-200">
                              #{chan.name}
                            </span>
                            {chan.topic && (
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {chan.topic}
                              </p>
                            )}
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Communities / Servers */}
              {(activeCategory === 'all' || activeCategory === 'servers') &&
                searchResults.servers.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-mono uppercase text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-violet-400" />
                      Communities
                    </h4>
                    <div className="space-y-1">
                      {searchResults.servers.map((srv) => (
                        <div
                          key={srv.id}
                          onClick={() => handleSelectServer(srv)}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={srv.icon}
                              alt={srv.name}
                              className="w-7 h-7 rounded-lg object-cover"
                            />
                            <div>
                              <p className="text-xs font-semibold text-slate-200">{srv.name}</p>
                              <p className="text-[10px] text-slate-400">{srv.description}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Members */}
              {(activeCategory === 'all' || activeCategory === 'users') &&
                searchResults.users.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-mono uppercase text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      Members
                    </h4>
                    <div className="space-y-1">
                      {searchResults.users.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => handleSelectUser(u)}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar src={u.avatar} name={u.name} size="xs" status={u.status} />
                            <div>
                              <p className="text-xs font-semibold text-slate-200">{u.name}</p>
                              <p className="text-[10px] font-mono text-cyan-400">@{u.username}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
