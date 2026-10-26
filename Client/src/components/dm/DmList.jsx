import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { MessageSquare, Plus, Search, X, Loader2 } from "lucide-react";
import Avatar from "../common/Avatar";
import Badge from "../common/Badge";
import {
  selectDm,
  fetchConversations,
  startConversation,
} from "../../redux/slices/dmSlice";
import { searchUsers } from "../../services/auth.service";
import VoiceChannelOverlay from "../voice/VoiceChannelOverlay";

export default function DmList({ onSelectConversation, selectedDmId }) {
  const dispatch = useDispatch();

  const dms = useSelector((state) => state.dms.conversations || []);
  const loading = useSelector((state) => state.dms.loading);
  const currentUser = useSelector((state) => state.auth.user);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    dispatch(fetchConversations());
  }, [dispatch]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let isCurrent = true;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      try {
        const users = await searchUsers(q);
        if (isCurrent) {
          const userList = Array.isArray(users) ? users : [];
          const myId = (currentUser?._id || currentUser?.id)?.toString();
          setSearchResults(
            userList.filter(
              (u) => (u._id || u.id)?.toString() !== myId,
            ),
          );
        }
      } catch (err) {
        if (isCurrent) {
          setSearchResults([]);
        }
      } finally {
        if (isCurrent) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [searchQuery, currentUser]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleStartWithUser = async (user) => {
    try {
      const conv = await dispatch(startConversation(user._id || user.id)).unwrap();
      setShowSearch(false);
      setSearchQuery("");
      setSearchResults([]);
      const convId = conv._id || conv.id;
      if (onSelectConversation) onSelectConversation(convId);
    } catch (err) {
      console.error("Failed to start DM:", err);
    }
  };

  const handleSelect = (convId) => {
    dispatch(selectDm(convId));
    if (onSelectConversation) onSelectConversation(convId);
  };

  const getOtherParticipant = (conv) => {
    if (!conv?.participants || !Array.isArray(conv.participants)) return {};
    const myId = (currentUser?._id || currentUser?.id)?.toString();
    return (
      conv.participants.find((p) => (p._id || p.id || p).toString() !== myId) ||
      conv.participants[0] ||
      {}
    );
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="w-72 bg-[var(--surface-primary)] border-r border-[var(--border-subtle)] flex flex-col h-full select-none flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-subtle)] bg-[var(--surface-primary)] flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-sm text-slate-100">
            Direct Transmissions
          </h3>
          <p className="text-[11px] text-slate-400">Encrypted 1-on-1 channels</p>
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={`p-1.5 rounded-lg border transition-colors ${
            showSearch
              ? "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]"
              : "text-slate-400 hover:text-white hover:bg-white/5 border-white/5"
          }`}
          title="New Transmission"
        >
          {showSearch ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {/* User Search Bar */}
      {showSearch && (
        <div className="p-2 border-b border-[var(--border-subtle)] bg-[var(--surface-secondary)] space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Find user to message..."
              className="w-full bg-[var(--surface-primary)] border border-[var(--border-subtle)] rounded-xl text-xs text-white pl-8 pr-3 py-1.5 focus:outline-none focus:border-[var(--accent-border)]"
              autoFocus
            />
          </div>

          {isSearching && (
            <div className="flex items-center justify-center p-2 text-xs text-slate-400 gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Scanning frequency...</span>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {searchResults.map((user) => (
                <div
                  key={user._id}
                  onClick={() => handleStartWithUser(user)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/5 cursor-pointer text-xs"
                >
                  <Avatar
                    src={user.profile_pic}
                    name={user.fullname || user.username}
                    size="xs"
                  />
                  <div className="min-w-0">
                    <p className="text-slate-200 font-semibold truncate">
                      {user.fullname}
                    </p>
                    <p className="text-[10px] font-mono text-cyan-400 truncate">
                      @{user.username}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
            <div className="text-[11px] text-slate-500 text-center py-2">
              No operative found
            </div>
          )}
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {loading && dms.length === 0 && (
          <div className="flex items-center justify-center p-8 text-xs font-mono text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Loading transmissions...
          </div>
        )}

        {!loading && dms.length === 0 && (
          <div className="p-6 text-center text-slate-500 space-y-3">
            <MessageSquare className="w-8 h-8 mx-auto opacity-30 text-cyan-400" />
            <p className="text-xs">No direct transmissions yet.</p>
            <p className="text-[11px] text-slate-600">
              Click the <span className="text-cyan-400 font-bold">+</span> button above to initiate contact.
            </p>
          </div>
        )}

        {dms.map((conv) => {
          const convId = conv._id || conv.id;
          const isSelected = convId === selectedDmId;
          const otherUser = getOtherParticipant(conv);
          const name = otherUser.fullname || otherUser.username || "Transmission Thread";
          const timestamp = formatTimestamp(conv.lastMessage?.createdAt || conv.updatedAt);
          const lastMsg = conv.lastMessage?.content || "Conversation created";

          return (
            <div
              key={convId}
              onClick={() => handleSelect(convId)}
              className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                isSelected
                  ? "bg-[var(--accent-soft)] text-white font-medium border border-[var(--accent-border)] shadow-sm"
                  : "hover:bg-white/5 text-slate-300"
              }`}
            >
              <Avatar
                src={otherUser.profile_pic}
                name={name}
                size="md"
                status="online"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-100 truncate">
                    {name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {timestamp}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[11px] text-slate-400 truncate pr-2">
                    {lastMsg}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Connected Voice Channel Status Bar */}
      <VoiceChannelOverlay />
    </div>
  );
}
