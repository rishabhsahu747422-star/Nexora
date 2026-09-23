import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Clock,
  UserPlus,
  MessageSquare,
  X,
  Check,
  Search,
  MoreVertical,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import Button from '../common/Button';
import Input from '../common/Input';
import {
  setActiveTab,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
} from '../../redux/slices/friendSlice';
import { openOrCreateDm } from '../../redux/slices/dmSlice';
import { addToast, openModal } from '../../redux/slices/uiSlice';
import { MOCK_USERS } from '../../data/mockUsers';

export default function FriendsHub() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const friends = useSelector((state) => state.friends.friends);
  const requests = useSelector((state) => state.friends.requests);
  const activeTab = useSelector((state) => state.friends.activeTab);
  const currentUser = useSelector((state) => state.auth.currentUser);

  const [addUsername, setAddUsername] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  // Filter friends list
  const onlineFriends = friends.filter((f) => f.status === 'online' || f.status === 'idle');
  const displayedFriends = (activeTab === 'online' ? onlineFriends : friends).filter(
    (f) =>
      f.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      f.username.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleStartDm = (friend) => {
    dispatch(
      openOrCreateDm({
        id: friend.userId,
        name: friend.name,
        username: friend.username,
        avatar: friend.avatar,
        status: friend.status,
      })
    );
    navigate('/app/messages');
  };

  const handleSendRequest = (e) => {
    e.preventDefault();
    const cleanUsername = addUsername.trim().toLowerCase().replace(/^@/, '');
    if (!cleanUsername) return;

    if (cleanUsername === currentUser?.username.toLowerCase()) {
      dispatch(
        addToast({
          type: 'error',
          message: 'You cannot connect with your own handle.',
        })
      );
      return;
    }

    // Check if user exists in mock database
    const targetUser = MOCK_USERS.find(
      (u) => u.username.toLowerCase() === cleanUsername
    );

    if (!targetUser) {
      dispatch(
        addToast({
          type: 'error',
          message: `User @${cleanUsername} not found on the Nexora network. Try: elena_ai, marcus_v, kaithorne`,
        })
      );
      return;
    }

    dispatch(sendFriendRequest(targetUser));
    dispatch(
      addToast({
        type: 'success',
        message: `Connection request sent to @${targetUser.username}.`,
      })
    );
    setAddUsername('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#07080C] select-none overflow-hidden">
      {/* Top Tabs Bar */}
      <div className="h-14 bg-[#10141C] border-b border-white/10 px-4 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
          <div className="flex items-center gap-2 text-slate-300 font-semibold text-sm mr-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Connections</span>
          </div>

          {[
            { id: 'online', label: 'Online', count: onlineFriends.length },
            { id: 'all', label: 'All Connections', count: friends.length },
            { id: 'pending', label: 'Pending', count: requests.length },
            { id: 'add', label: 'Add Connection', count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => dispatch(setActiveTab(tab.id))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
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
        {activeTab === 'add' ? (
          /* Add Friend View */
          <div className="max-w-xl mx-auto space-y-6 pt-4">
            <div className="text-left">
              <h3 className="font-display font-bold text-lg text-white">
                Add Connection
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                You can add connections using their unique Nexora handle (e.g.{' '}
                <span className="text-cyan-400 font-mono">elena_ai</span>,{' '}
                <span className="text-cyan-400 font-mono">marcus_v</span>,{' '}
                <span className="text-cyan-400 font-mono">sora_t</span>).
              </p>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <div className="relative flex items-center">
                <Input
                  placeholder="Enter handle e.g. elena_ai..."
                  value={addUsername}
                  onChange={(e) => setAddUsername(e.target.value)}
                  className="pr-32"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="absolute right-2"
                  disabled={!addUsername.trim()}
                >
                  Send Request
                </Button>
              </div>
            </form>

            {/* Suggested Connections */}
            <div className="pt-6 border-t border-white/5">
              <h4 className="text-xs font-mono uppercase text-slate-400 mb-3">
                Suggested Network Pioneers
              </h4>
              <div className="space-y-2">
                {MOCK_USERS.slice(1, 5).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#10141C] border border-white/5"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={user.avatar}
                        name={user.name}
                        size="md"
                        status={user.status}
                      />
                      <div>
                        <p className="text-xs font-semibold text-slate-200">
                          {user.name}
                        </p>
                        <p className="text-[10px] font-mono text-cyan-400">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={UserPlus}
                      onClick={() => {
                        dispatch(sendFriendRequest(user));
                        dispatch(
                          addToast({
                            type: 'success',
                            message: `Request dispatched to @${user.username}`,
                          })
                        );
                      }}
                    >
                      Connect
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'pending' ? (
          /* Pending Requests View */
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="text-xs font-mono uppercase text-slate-400 mb-2">
              Pending Connection Requests — {requests.length}
            </h3>

            {requests.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs font-mono">
                No pending requests. All clear!
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#10141C] border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={req.avatar} name={req.name} size="md" />
                    <div>
                      <p className="text-xs font-semibold text-slate-100">
                        {req.name}
                      </p>
                      <p className="text-[11px] font-mono text-cyan-400">
                        @{req.username} • {req.type === 'incoming' ? 'Incoming' : 'Outgoing'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {req.type === 'incoming' ? (
                      <>
                        <button
                          onClick={() => {
                            dispatch(acceptFriendRequest(req.id));
                            dispatch(
                              addToast({
                                type: 'success',
                                message: `Connected with ${req.name}!`,
                              })
                            );
                          }}
                          className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                          title="Accept"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            dispatch(rejectFriendRequest(req.id));
                            dispatch(
                              addToast({
                                type: 'info',
                                message: 'Request dismissed.',
                              })
                            );
                          }}
                          className="p-2 rounded-xl bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
                          title="Ignore"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400 italic">
                        Sent {req.time}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
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
                className="w-full bg-[#10141C] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div className="text-[11px] font-mono uppercase text-slate-400 pt-2">
              {activeTab === 'online' ? 'Active Online' : 'All Connections'} —{' '}
              {displayedFriends.length}
            </div>

            <div className="space-y-1.5">
              {displayedFriends.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs font-mono">
                  No connections found matching your query.
                </div>
              ) : (
                displayedFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-[#10141C] hover:bg-[#151A23] border border-white/5 transition-all group"
                  >
                    <div
                      onClick={() =>
                        dispatch(
                          openModal({
                            type: 'PROFILE',
                            props: {
                              user: {
                                id: friend.userId,
                                name: friend.name,
                                username: friend.username,
                                avatar: friend.avatar,
                                status: friend.status,
                                customStatus: friend.customStatus,
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
                        <p className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors truncate">
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
                        className="p-2 rounded-xl bg-white/5 hover:bg-cyan-500/15 text-slate-300 hover:text-cyan-300 transition-colors"
                        title="Direct Message"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`Disconnect with ${friend.name}?`)) {
                            dispatch(removeFriend(friend.id));
                            dispatch(
                              addToast({
                                type: 'info',
                                message: `Removed ${friend.name} from connections.`,
                              })
                            );
                          }
                        }}
                        className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 transition-colors"
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
