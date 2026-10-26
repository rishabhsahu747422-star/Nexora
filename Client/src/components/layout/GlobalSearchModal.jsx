import React, { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MessageSquare,
  Compass,
  Server,
  User,
  ArrowRight,
  X,
  Loader2,
} from "lucide-react";
import { closeGlobalSearch, openModal } from "../../redux/slices/uiSlice";
import { selectServer } from "../../redux/slices/serverSlice";
import { selectChannel } from "../../redux/slices/channelSlice";
import { setHighlightedMessageId } from "../../redux/slices/messageSlice";
import { searchUsers } from "../../services/auth.service";
import Avatar from "../common/Avatar";
import CommunityAvatar from "../common/CommunityAvatar";

export default function GlobalSearchModal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isOpen = useSelector((state) => state.ui.isGlobalSearchOpen);
  const servers = useSelector((state) => state.server.servers);
  const channels = useSelector((state) => state.channels.channels);
  const messagesByContext = useSelector(
    (state) => state.messages?.messagesByContext,
  );
  const rawMessages = useSelector((state) => state.messages?.messages);
  const currentUser = useSelector((state) => state.auth.user);

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all"); // 'all' | 'messages' | 'channels' | 'servers' | 'users'
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  // Global key listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          dispatch(closeGlobalSearch());
        } else {
          // Open search
          dispatch({ type: "ui/openGlobalSearch" });
        }
      }
      if (e.key === "Escape" && isOpen) {
        dispatch(closeGlobalSearch());
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, dispatch]);

  // Debounced real backend user search with stale request cancellation
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSearchedUsers([]);
      setIsSearchingUsers(false);
      return;
    }

    let isCurrent = true;
    setIsSearchingUsers(true);

    const timer = setTimeout(async () => {
      try {
        const users = await searchUsers(q);
        if (isCurrent) {
          const userList = Array.isArray(users) ? users : [];
          const myId = (currentUser?._id || currentUser?.id)?.toString();
          const filtered = userList.filter(
            (u) => (u._id || u.id)?.toString() !== myId,
          );
          setSearchedUsers(filtered);
        }
      } catch (err) {
        if (isCurrent) {
          setSearchedUsers([]);
        }
      } finally {
        if (isCurrent) {
          setIsSearchingUsers(false);
        }
      }
    }, 300);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [query, currentUser]);

  // Aggregate results across all categories
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { messages: [], channels: [], servers: [], users: [] };

    const safeServers = Array.isArray(servers) ? servers : [];
    const safeChannels = Array.isArray(channels) ? channels : [];

    // Search Servers
    const matchedServers = safeServers.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.tag?.toLowerCase().includes(q),
    );

    // Search Channels
    const matchedChannels = safeChannels.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        (c.topic && c.topic.toLowerCase().includes(q)),
    );

    // Search Messages across all channels
    const matchedMessages = [];
    if (messagesByContext && typeof messagesByContext === "object") {
      Object.entries(messagesByContext ?? {}).forEach(([contextId, msgs]) => {
        if (Array.isArray(msgs)) {
          msgs.forEach((m) => {
            if (m.content?.toLowerCase().includes(q)) {
              const chan = safeChannels.find((c) => (c._id || c.id) === contextId);
              matchedMessages.push({
                ...m,
                channelName: chan ? chan.name : "transmission",
                serverId: chan ? chan.serverId : null,
              });
            }
          });
        }
      });
    }

    if (Array.isArray(rawMessages)) {
      rawMessages.forEach((m) => {
        if (m.content?.toLowerCase().includes(q)) {
          const chanId = m.channel_id?._id || m.channel_id || m.channelId;
          const chan = safeChannels.find((c) => (c._id || c.id) === chanId);
          matchedMessages.push({
            ...m,
            channelName: chan ? chan.name : "transmission",
            serverId: chan ? chan.serverId : null,
          });
        }
      });
    }

    return {
      servers: matchedServers,
      channels: matchedChannels,
      messages: matchedMessages,
      users: searchedUsers,
    };
  }, [query, servers, channels, messagesByContext, rawMessages, searchedUsers]);

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
    const safeChannels = Array.isArray(channels) ? channels : [];
    const def = safeChannels.find((c) => (c.serverId || c.server_id) === server.id);
    if (def) {
      dispatch(selectChannel(def._id || def.id));
      navigate(`/app/server/${server.id}/channel/${def._id || def.id}`);
    } else {
      navigate(`/app/server/${server.id}`);
    }
  };

  const handleSelectUser = (user) => {
    dispatch(closeGlobalSearch());
    dispatch(
      openModal({
        type: "PROFILE",
        props: {
          user: {
            ...user,
            id: user._id || user.id,
            name: user.fullname || user.name || user.username,
            avatar: user.profile_pic || user.avatar,
          },
        },
      }),
    );
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
        className="relative z-10 w-full max-w-2xl bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl shadow-black/90 overflow-hidden flex flex-col"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--surface-primary)]">
          <Search className="w-5 h-5 text-[var(--accent)] flex-shrink-0" />
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
              onClick={() => setQuery("")}
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
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border-subtle)] bg-[var(--surface-secondary)] text-xs">
          {[
            { id: "all", label: "All Results" },
            {
              id: "messages",
              label: `Transmissions (${searchResults.messages.length})`,
            },
            {
              id: "channels",
              label: `Channels (${searchResults.channels.length})`,
            },
            {
              id: "servers",
              label: `Communities (${searchResults.servers.length})`,
            },
            { id: "users", label: `Members (${searchResults.users.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-2.5 py-1 rounded-lg transition-colors font-medium ${
                activeCategory === tab.id
                  ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results Stream */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {query.trim() === "" ? (
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
              {(activeCategory === "all" || activeCategory === "messages") &&
                searchResults.messages.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-mono uppercase text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[var(--accent)]" />
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
                            <Avatar
                              src={msg.authorAvatar}
                              name={msg.authorName}
                              size="xs"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-200">
                                  {msg.authorName}
                                </span>
                                <span className="text-[10px] text-[var(--accent)] font-mono">
                                  #{msg.channelName}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 truncate mt-0.5">
                                {msg.content}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-[var(--accent)] transition-colors flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Channels */}
              {(activeCategory === "all" || activeCategory === "channels") &&
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
              {(activeCategory === "all" || activeCategory === "servers") &&
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
                            <CommunityAvatar
                              src={srv.icon}
                              name={srv.name}
                              size="sm"
                              shape="rounded-lg"
                              className="flex-shrink-0"
                            />
                            <div>
                              <p className="text-xs font-semibold text-slate-200">
                                {srv.name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {srv.description}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-violet-400 transition-colors flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Members */}
              {(activeCategory === "all" || activeCategory === "users") && (
                isSearchingUsers ? (
                  <div className="flex items-center justify-center p-4 text-xs text-slate-400 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
                    <span>Searching network operatives...</span>
                  </div>
                ) : searchResults.users.length > 0 ? (
                  <div>
                    <h4 className="text-[11px] font-mono uppercase text-slate-400 px-2 mb-1.5 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-400" />
                      Members
                    </h4>
                    <div className="space-y-1">
                      {searchResults.users.map((u) => {
                        const userId = u._id || u.id;
                        const displayName = u.fullname || u.name || u.username;
                        const handle = u.username;
                        const avatarUrl = u.profile_pic || u.avatar;
                        return (
                          <div
                            key={userId}
                            onClick={() => handleSelectUser(u)}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={avatarUrl}
                                name={displayName}
                                size="xs"
                                status={u.status || "online"}
                              />
                              <div>
                                <p className="text-xs font-semibold text-slate-200">
                                  {displayName}
                                </p>
                                <p className="text-[10px] font-mono text-[var(--accent)]">
                                  @{handle}
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : activeCategory === "users" && query.trim() !== "" ? (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No members found matching "{query}"
                  </div>
                ) : null
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
