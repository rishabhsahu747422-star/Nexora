import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  UserPlus,
  MessageSquare,
  X,
  Check,
  Search,
  Loader2,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Input from '../common/Input';
import {
  setActiveTab,
  fetchConnections,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  removeFriend,
  searchUsersForConnections,
  clearSearchResults,
} from '../../redux/slices/friendSlice';
import { openOrCreateDm } from '../../redux/slices/dmSlice';
import { addToast, openModal } from '../../redux/slices/uiSlice';

export default function FriendsHub() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const friends = useSelector((state) => state.friends.friends);
  const requests = useSelector((state) => state.friends.requests);
  const incomingRequests = useSelector((state) => state.friends.incomingRequests);
  const outgoingRequests = useSelector((state) => state.friends.outgoingRequests);
  const suggestions = useSelector((state) => state.friends.suggestions);
  const counts = useSelector((state) => state.friends.counts);
  const activeTab = useSelector((state) => state.friends.activeTab);
  const loading = useSelector((state) => state.friends.loading);
  const actionLoading = useSelector((state) => state.friends.actionLoading);
  const searchResults = useSelector((state) => state.friends.searchResults);
  const searchLoading = useSelector((state) => state.friends.searchLoading);
  const currentUser = useSelector((state) => state.auth.user);

  const [addUsername, setAddUsername] = useState('');
  const [filterQuery, setFilterQuery] = useState('');
  const searchTimeoutRef = useRef(null);

  // Fetch real connections data on mount
  useEffect(() => {
    dispatch(fetchConnections());
  }, [dispatch]);

  // Debounced search for users in Add Connection tab
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const cleanInput = addUsername.trim();
    if (activeTab === 'add' && cleanInput.length >= 1) {
      searchTimeoutRef.current = setTimeout(() => {
        dispatch(searchUsersForConnections(cleanInput));
      }, 350);
    } else {
      dispatch(clearSearchResults());
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [addUsername, activeTab, dispatch]);

  // Filter friends list
  const onlineFriends = (friends || []).filter(
    (f) => f.status === 'online' || f.status === 'idle'
  );
  const displayedFriends = (activeTab === 'online' ? onlineFriends : friends || []).filter(
    (f) =>
      (f.name || '').toLowerCase().includes(filterQuery.toLowerCase()) ||
      (f.username || '').toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleStartDm = async (friend) => {
    try {
      const targetId = friend.userId || friend.id || friend._id;
      const conv = await dispatch(
        openOrCreateDm({
          id: targetId,
          _id: targetId,
          name: friend.name,
          username: friend.username,
          avatar: friend.avatar,
          status: friend.status,
        })
      ).unwrap();

      if (conv?._id || conv?.id) {
        navigate(`/app/messages/${conv._id || conv.id}`);
      } else {
        navigate('/app/messages');
      }
    } catch {
      navigate('/app/messages');
    }
  };

  const handleSendRequest = async (e) => {
    if (e) e.preventDefault();
    const cleanUsername = addUsername.trim().toLowerCase().replace(/^@/, '');
    if (!cleanUsername) return;

    if (cleanUsername === (currentUser?.username || '').toLowerCase()) {
      dispatch(
        addToast({
          type: 'error',
          message: 'You cannot connect with your own handle.',
        })
      );
      return;
    }

    try {
      const res = await dispatch(sendFriendRequest(cleanUsername)).unwrap();
      dispatch(
        addToast({
          type: 'success',
          message: res?.message || `Connection request sent to @${cleanUsername}.`,
        })
      );
      setAddUsername('');
      dispatch(clearSearchResults());
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          message: typeof err === 'string' ? err : 'Failed to send connection request.',
        })
      );
    }
  };

  const handleAcceptRequest = async (requestId, name) => {
    try {
      await dispatch(acceptFriendRequest(requestId)).unwrap();
      dispatch(
        addToast({
          type: 'success',
          message: `Connected with ${name || 'user'}!`,
        })
      );
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          message: typeof err === 'string' ? err : 'Failed to accept connection request.',
        })
      );
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await dispatch(rejectFriendRequest(requestId)).unwrap();
      dispatch(
        addToast({
          type: 'info',
          message: 'Connection request dismissed.',
        })
      );
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          message: typeof err === 'string' ? err : 'Failed to decline request.',
        })
      );
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await dispatch(cancelFriendRequest(requestId)).unwrap();
      dispatch(
        addToast({
          type: 'info',
          message: 'Connection request cancelled.',
        })
      );
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          message: typeof err === 'string' ? err : 'Failed to cancel request.',
        })
      );
    }
  };

  const handleRemoveFriend = async (friend) => {
    const friendId = friend.userId || friend.id;
    if (window.confirm(`Disconnect with ${friend.name}?`)) {
      try {
        await dispatch(removeFriend(friendId)).unwrap();
        dispatch(
          addToast({
            type: 'info',
            message: `Removed ${friend.name} from connections.`,
          })
        );
      } catch (err) {
        dispatch(
          addToast({
            type: 'error',
            message: typeof err === 'string' ? err : 'Failed to remove connection.',
          })
        );
      }
    }
  };

  const isActionLoading = (id) => !!actionLoading[id];

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--workspace-bg)] select-none overflow-hidden">
      {/* Top Tabs Bar */}
      <div className="h-14 bg-[var(--surface-primary)] border-b border-[var(--border-subtle)] px-4 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm mr-2">
            <Users className="w-4 h-4 text-[var(--accent)]" />
            <span>Connections</span>
          </div>

          {[
            { id: 'online', label: 'Online', count: counts?.online ?? onlineFriends.length },
            { id: 'all', label: 'All Connections', count: counts?.all ?? friends.length },
            { id: 'pending', label: 'Pending', count: counts?.pending ?? requests.length },
            { id: 'add', label: 'Add Connection', count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => dispatch(setActiveTab(tab.id))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-full bg-white/10">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {loading && friends.length === 0 && requests.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs font-mono">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
            <span>Synchronizing network connections...</span>
          </div>
        ) : activeTab === 'add' ? (
          /* Add Friend View */
          <div className="max-w-xl mx-auto space-y-6 pt-4">
            <div className="text-left">
              <h3 className="font-display font-bold text-lg text-white">
                Add Connection
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                You can add connections using their unique Nexora handle or display name.
              </p>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div className="relative flex items-center">
                <Input
                  placeholder="Enter handle e.g. username..."
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value)}
                  className="pr-32"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="absolute right-2"
                  disabled={!addUsername.trim() || isActionLoading('send')}
                  loading={isActionLoading('send')}
                >
                  Send Request
                </Button>
              </div>
            </form>

            {/* Dynamic Search Results */}
            {addUsername.trim().length > 0 && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-mono uppercase text-slate-400">
                    Search Results
                  </h4>
                  {searchLoading && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent)]" />
                  )}
                </div>

                {searchLoading && searchResults.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs font-mono">
                    Searching Nexora network...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 text-xs font-mono">
                    No users found matching "@{addUsername.trim()}".
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map((user) => (
                      <div
                        key={user.id || user.userId}
                        className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-primary)] border border-[var(--border-subtle)]"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            src={user.avatar}
                            name={user.name}
                            size="md"
                            status={user.status}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-200 truncate">
                              {user.name}
                            </p>
                            <p className="text-[10px] font-mono text-[var(--accent)] truncate">
                              @{user.username}
                            </p>
                          </div>
                        </div>

                        <div>
                          {user.relationship === 'connected' ? (
                            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                              <Check className="w-3.5 h-3.5" /> Connected
                            </span>
                          ) : user.relationship === 'pending_outgoing' ? (
                            <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                              <Clock className="w-3.5 h-3.5" /> Request Sent
                            </span>
                          ) : user.relationship === 'pending_incoming' ? (
                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleAcceptRequest(user.requestId, user.name)}
                                loading={isActionLoading(user.requestId)}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleRejectRequest(user.requestId)}
                                loading={isActionLoading(user.requestId)}
                              >
                                Decline
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={UserPlus}
                              onClick={async () => {
                                try {
                                  await dispatch(sendFriendRequest(user)).unwrap();
                                  dispatch(
                                    addToast({
                                      type: 'success',
                                      message: `Request dispatched to @${user.username}`,
                                    })
                                  );
                                } catch (err) {
                                  dispatch(
                                    addToast({
                                      type: 'error',
                                      message: typeof err === 'string' ? err : 'Failed to send request.',
                                    })
                                  );
                                }
                              }}
                              loading={isActionLoading(user.id || user.userId)}
                            >
                              Connect
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Suggested Connections from Real Database */}
            {addUsername.trim().length === 0 && suggestions.length > 0 && (
              <div className="pt-6 border-t border-white/5">
                <h4 className="text-xs font-mono uppercase text-slate-400 mb-3">
                  Suggested Network Pioneers
                </h4>
                <div className="space-y-2">
                  {suggestions.map((user) => (
                    <div
                      key={user.id || user.userId}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-primary)] border border-[var(--border-subtle)]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          src={user.avatar}
                          name={user.name}
                          size="md"
                          status={user.status}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-200 truncate">
                            {user.name}
                          </p>
                          <p className="text-[10px] font-mono text-[var(--accent)] truncate">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={UserPlus}
                        onClick={async () => {
                          try {
                            await dispatch(sendFriendRequest(user)).unwrap();
                            dispatch(
                              addToast({
                                type: 'success',
                                message: `Request dispatched to @${user.username}`,
                              })
                            );
                          } catch (err) {
                            dispatch(
                              addToast({
                                type: 'error',
                                message: typeof err === 'string' ? err : 'Failed to send request.',
                              })
                            );
                          }
                        }}
                        loading={isActionLoading(user.id || user.userId)}
                      >
                        Connect
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'pending' ? (
          /* Pending Requests View */
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h3 className="text-xs font-mono uppercase text-slate-400 mb-2">
                Incoming Requests — {incomingRequests.length}
              </h3>

              {incomingRequests.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs font-mono rounded-xl border border-dashed border-white/5">
                  No incoming requests at the moment.
                </div>
              ) : (
                <div className="space-y-2">
                  {incomingRequests.map((req) => (
                    <div
                      key={req.id || req.requestId}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-primary)] border border-[var(--border-subtle)]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar src={req.avatar} name={req.name} size="md" status={req.status} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-100 truncate">
                            {req.name}
                          </p>
                          <p className="text-[11px] font-mono text-[var(--accent)] truncate">
                            @{req.username} • Received {req.time || 'recently'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAcceptRequest(req.id || req.requestId, req.name)}
                          disabled={isActionLoading(req.id || req.requestId)}
                          className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                          title="Accept"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id || req.requestId)}
                          disabled={isActionLoading(req.id || req.requestId)}
                          className="p-2 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors disabled:opacity-50"
                          title="Ignore"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-mono uppercase text-slate-400 mb-2">
                Outgoing Requests — {outgoingRequests.length}
              </h3>

              {outgoingRequests.length === 0 ? (
                <div className="py-6 text-center text-slate-500 text-xs font-mono rounded-xl border border-dashed border-white/5">
                  No outgoing requests pending.
                </div>
              ) : (
                <div className="space-y-2">
                  {outgoingRequests.map((req) => (
                    <div
                      key={req.id || req.requestId}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--surface-primary)] border border-[var(--border-subtle)]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar src={req.avatar} name={req.name} size="md" status={req.status} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-100 truncate">
                            {req.name}
                          </p>
                          <p className="text-[11px] font-mono text-slate-400 truncate">
                            @{req.username} • Sent {req.time || 'recently'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCancelRequest(req.id || req.requestId)}
                          disabled={isActionLoading(req.id || req.requestId)}
                          className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-mono transition-colors disabled:opacity-50 flex items-center gap-1"
                          title="Cancel Request"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* All or Online Friends View */
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Search filter input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter connections..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[var(--accent-border)]"
              />
            </div>

            <div className="text-[11px] font-mono uppercase text-slate-400 pt-2">
              {activeTab === 'online' ? 'Active Online' : 'All Connections'} —{' '}
              {displayedFriends.length}
            </div>

            <div className="space-y-1.5">
              {displayedFriends.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs font-mono">
                  {friends.length === 0
                    ? 'No connections yet. Add some from the Add Connection tab!'
                    : 'No connections found matching your query.'}
                </div>
              ) : (
                displayedFriends.map((friend) => (
                  <div
                    key={friend.id || friend.userId}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[var(--surface-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] transition-all group"
                  >
                    <div
                      onClick={() =>
                        dispatch(
                          openModal({
                            type: 'PROFILE',
                            props: {
                              user: {
                                id: friend.userId || friend.id,
                                _id: friend.userId || friend.id,
                                name: friend.name,
                                username: friend.username,
                                avatar: friend.avatar,
                                status: friend.status,
                                customStatus: friend.customStatus,
                                bio: friend.bio,
                              },
                            },
                          })
                        )
                      }
                      className="flex items-center gap-3 cursor-pointer min-w-0"
                    >
                      <Avatar
                        src={friend.avatar}
                        name={friend.name}
                        size="md"
                        status={friend.status}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-100 group-hover:text-[var(--accent)] transition-colors truncate">
                          {friend.name}
                        </p>
                        <p className="text-[11px] font-mono text-slate-400 truncate">
                          {friend.customStatus || `@${friend.username}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleStartDm(friend)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-[var(--accent-soft)] text-slate-300 hover:text-[var(--accent)] transition-colors"
                        title="Direct Message"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleRemoveFriend(friend)}
                        disabled={isActionLoading(friend.id || friend.userId)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 transition-colors disabled:opacity-50"
                        title="Remove Connection"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
