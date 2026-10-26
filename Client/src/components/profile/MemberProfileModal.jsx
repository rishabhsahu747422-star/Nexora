import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, UserPlus, Shield, Calendar, Server, Copy, Check } from 'lucide-react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { openOrCreateDm } from '../../redux/slices/dmSlice';
import { sendFriendRequest } from '../../redux/slices/friendSlice';
import { closeModal, addToast } from '../../redux/slices/uiSlice';

export default function MemberProfileModal({ isOpen, onClose, user }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const servers = useSelector((state) => state.server.servers || []);
  const currentUser = useSelector((state) => state.auth.user);

  if (!user) return null;

  const isMe = (user.id || user._id) === (currentUser?._id || currentUser?.id);

  const handleSendMessage = async () => {
    dispatch(closeModal());
    try {
      const conv = await dispatch(openOrCreateDm(user));
      if (conv?._id || conv?.id) {
        navigate(`/app/messages/${conv._id || conv.id}`);
      } else {
        navigate('/app/messages');
      }
    } catch {
      navigate('/app/messages');
    }
  };

  const handleAddFriend = async () => {
    try {
      await dispatch(sendFriendRequest(user)).unwrap();
      dispatch(
        addToast({
          type: 'success',
          message: `Connection request dispatched to @${user.username}.`,
        })
      );
    } catch (err) {
      dispatch(
        addToast({
          type: 'error',
          message: typeof err === 'string' ? err : 'Failed to send connection request.',
        })
      );
    }
  };

  const handleCopyUsername = () => {
    navigator.clipboard.writeText(`@${user.username}`);
    dispatch(
      addToast({
        type: 'info',
        message: `Copied @${user.username} to clipboard.`,
      })
    );
  };

  const mutualServerObjects = servers.filter((s) =>
    user.mutualServers?.includes(s.id)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      className="p-0 overflow-hidden"
      showClose
    >
      {/* Banner */}
      <div className="h-28 w-full bg-gradient-to-r from-[var(--surface-secondary)] via-[var(--surface-elevated)] to-[var(--surface-primary)] border-b border-[var(--border-subtle)] relative">
        {user.banner && (
          <img
            src={user.banner}
            alt="Banner"
            className="w-full h-full object-cover opacity-60"
          />
        )}
      </div>

      <div className="px-6 pb-6 pt-0 relative">
        {/* Floating Avatar */}
        <div className="-mt-12 flex justify-between items-end mb-4">
          <Avatar
            src={user.avatar}
            name={user.name}
            size="xl"
            status={user.status}
            className="ring-4 ring-[var(--surface-elevated)]"
          />

          {!isMe && (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                icon={MessageSquare}
                onClick={handleSendMessage}
              >
                Direct Transmission
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={UserPlus}
                onClick={handleAddFriend}
              />
            </div>
          )}
        </div>

        {/* User Identity */}
        <div>
          <h3 className="font-display font-bold text-xl text-white">{user.name}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="font-mono text-xs text-[var(--accent)]">@{user.username}</span>
            <button
              onClick={handleCopyUsername}
              className="text-slate-500 hover:text-slate-300 transition-colors"
              title="Copy handle"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
          {user.customStatus && (
            <div className="mt-2.5 inline-block text-xs bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg text-slate-300">
              {user.customStatus}
            </div>
          )}
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <h4 className="text-[11px] font-mono uppercase text-slate-400 mb-1">
              About
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">{user.bio}</p>
          </div>
        )}

        {/* Roles */}
        {user.roles?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/5">
            <h4 className="text-[11px] font-mono uppercase text-slate-400 mb-2">
              Assigned Roles
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {user.roles.map((role, idx) => (
                <Badge key={idx} variant="cyan" size="xs">
                  <Shield className="w-3 h-3" />
                  <span>{role}</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{user.joinedDate || 'Joined Nexora'}</span>
          </div>

          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-slate-500" />
            <span>{mutualServerObjects.length} Mutual Communities</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
