import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Smile,
  Reply,
  Edit2,
  Trash2,
  Pin,
  Copy,
  FileText,
  ExternalLink,
  Check,
  CornerDownRight,
  MoreVertical,
} from 'lucide-react';
import Avatar from '../common/Avatar';
import Badge from '../common/Badge';
import {
  toggleChannelReactionAsync,
  togglePinMessage,
  setReplyTarget,
  deleteMessage,
  editMessage,
} from '../../redux/slices/messageSlice';
import { toggleDmReactionAsync } from '../../redux/slices/dmSlice';
import { openModal, addToast } from '../../redux/slices/uiSlice';

const POPULAR_EMOJIS = ['🔥', '🚀', '❤️', '👍', '🧠', '✨'];

export default function MessageItem({
  message,
  contextId,
  isHighlighted = false,
  onJumpToReply,
  density = 'comfortable',
}) {
  const dispatch = useDispatch();
  const currentUser = useSelector((state) => state.auth.user);

  const msgId = message._id || message.id;
  const authorId =
    message.author_id?._id ||
    message.author_id?.id ||
    message.author_id ||
    message.sender?._id ||
    message.sender?.id ||
    message.sender ||
    message.authorId ||
    message.senderId;

  const currentUserId = currentUser?._id || currentUser?.id;
  const isAuthor =
    Boolean(currentUserId && authorId && String(currentUserId) === String(authorId));

  const authorName =
    message.author_id?.fullname ||
    message.author_id?.username ||
    message.authorName ||
    message.sender?.fullname ||
    message.sender?.username ||
    (isAuthor ? (currentUser?.fullname || currentUser?.username) : null) ||
    "Operative";
  const authorAvatar =
    message.author_id?.profile_pic ||
    message.authorAvatar ||
    message.sender?.profile_pic ||
    (isAuthor ? currentUser?.profile_pic : "");

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(message.content);
    dispatch(
      addToast({
        type: 'success',
        message: 'Transmission copied to clipboard.',
      })
    );
  };

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    dispatch(
      editMessage({
        contextId,
        messageId: msgId,
        newContent: editText.trim(),
      })
    );
    setIsEditing(false);
  };

  const handleDelete = () => {
    dispatch(
      openModal({
        type: 'DELETE_CONFIRM',
        props: {
          title: 'Delete Transmission',
          message: 'Are you sure you want to permanently purge this transmission?',
          onConfirm: () => {
            dispatch(deleteMessage({ contextId, messageId: msgId }));
            dispatch(
              addToast({
                type: 'info',
                message: 'Transmission purged from stream.',
              })
            );
          },
        },
      })
    );
  };

  const handleReactionClick = (emoji) => {
    const isDm = Boolean(message.conversation_id !== undefined || message.conversation_id);
    if (isDm) {
      dispatch(
        toggleDmReactionAsync({
          conversationId: message.conversation_id || contextId,
          messageId: msgId,
          emoji,
        })
      );
    } else {
      dispatch(
        toggleChannelReactionAsync({
          channelId: message.channel_id || contextId,
          messageId: msgId,
          emoji,
        })
      );
    }
  };

  // Format time
  const timeFormatted = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      id={`msg-${msgId}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative rounded-2xl transition-all duration-300 ${
        density === 'compact' ? 'py-1.5 px-3' : 'py-3 px-4'
      } ${
        isHighlighted
          ? 'bg-[var(--accent-soft)] ring-1 ring-[var(--accent-border)] accent-glow-sm'
          : isAuthor
            ? 'bg-white/[0.025] border border-white/[0.06] hover:bg-white/[0.04]'
            : 'hover:bg-white/[0.03]'
      } ${message.isPinned ? 'border-l-2 border-[var(--accent)]' : ''}`}
    >
      {/* Action Dock (Floating on hover) */}
      <div className="absolute right-4 -top-3.5 hidden group-hover:flex items-center gap-0.5 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-xl px-1.5 py-1 shadow-xl shadow-black/80 z-20">
        {/* Quick Emojis */}
        <div className="flex items-center gap-0.5 border-r border-white/10 pr-1 mr-1">
          {['🔥', '👍', '❤️'].map((em) => (
            <button
              key={em}
              onClick={() => handleReactionClick(em)}
              className="p-1 text-xs hover:bg-white/10 rounded-md transition-transform hover:scale-110 active:scale-95"
            >
              {em}
            </button>
          ))}
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-md"
            title="More Reactions"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Reply Trigger */}
        <button
          onClick={() => dispatch(setReplyTarget(message))}
          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-white/10 rounded-md transition-colors"
          title="Reply"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>

        {/* Pin Trigger */}
        <button
          onClick={() => {
            dispatch(togglePinMessage({ contextId, messageId: msgId }));
            dispatch(
              addToast({
                type: 'info',
                message: message.isPinned
                  ? 'Transmission unpinned.'
                  : 'Transmission pinned to channel header.',
              })
            );
          }}
          className={`p-1.5 rounded-md transition-colors ${
            message.isPinned
              ? 'text-indigo-400 hover:bg-white/10'
              : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
          title={message.isPinned ? 'Unpin' : 'Pin'}
        >
          <Pin className="w-3.5 h-3.5" />
        </button>

        {/* Copy Trigger */}
        <button
          onClick={handleCopyText}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          title="Copy Text"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        {/* Author Actions: Edit and Delete */}
        {isAuthor && (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-white/10 rounded-md transition-colors"
              title="Edit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-md transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="absolute right-4 top-6 z-30 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-xl p-2 shadow-2xl flex gap-1 animate-fadeIn">
          {POPULAR_EMOJIS.map((em) => (
            <button
              key={em}
              onClick={() => {
                handleReactionClick(em);
                setShowEmojiPicker(false);
              }}
              className="p-1.5 text-sm hover:bg-white/10 rounded-lg hover:scale-125 transition-transform"
            >
              {em}
            </button>
          ))}
        </div>
      )}

      {/* Reply Ancestry Reference Header (If this message replied to someone) */}
      {message.replyTo && (
        <div
          onClick={() => onJumpToReply && onJumpToReply(message.replyTo.id)}
          className="flex items-center gap-2 mb-1 text-[11px] text-slate-400 cursor-pointer hover:text-[var(--accent)] transition-colors pl-8 select-none"
        >
          <CornerDownRight className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0" />
          <span className="font-semibold text-slate-300">
            @{message.replyTo.authorName}
          </span>
          <span className="truncate max-w-sm italic opacity-80">
            "{message.replyTo.content}"
          </span>
        </div>
      )}

      {/* Message Row Body */}
      <div className="flex items-start gap-3">
        <Avatar
          src={authorAvatar}
          name={authorName}
          size={density === 'compact' ? 'sm' : 'md'}
          className="mt-0.5"
        />

        <div className="flex-1 min-w-0">
          {/* Header: Author + Role Pill + Timestamp + Pinned Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-semibold text-sm text-slate-100 hover:underline cursor-pointer">
                {authorName}
              </span>
              {isAuthor && (
                <span className="text-[9px] font-mono font-medium px-1.5 py-0.2 rounded-md bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)]">
                  YOU
                </span>
              )}
            </div>

            {message.authorRole && (
              <span
                className="text-[10px] font-mono px-1.5 py-0.2 rounded-md font-medium"
                style={{
                  backgroundColor: `${message.authorRoleColor || '#00F0FF'}15`,
                  color: message.authorRoleColor || '#00F0FF',
                  border: `1px solid ${message.authorRoleColor || '#00F0FF'}30`,
                }}
              >
                {message.authorRole}
              </span>
            )}

            <span className="text-[11px] font-mono text-slate-400">
              {timeFormatted}
            </span>

            {message.isEdited && (
              <span className="text-[10px] text-slate-400 italic">(edited)</span>
            )}

            {message.isPinned && (
              <span className="text-[10px] font-mono text-[var(--accent)] flex items-center gap-1 bg-[var(--accent-soft)] px-1.5 py-0.2 rounded">
                <Pin className="w-2.5 h-2.5" /> PINNED
              </span>
            )}
          </div>

          {/* Content / Inline Edit Form */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                className="w-full bg-[var(--surface-secondary)] border border-[var(--accent-border)] rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none resize-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 btn-accent-primary text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-200 mt-1 leading-relaxed break-words whitespace-pre-wrap">
              {/* Highlight @mentions in electric accent */}
              {message.content.split(' ').map((word, i) => {
                if (word.startsWith('@')) {
                  return (
                    <span
                      key={i}
                      className="inline-block px-1.5 py-0.5 rounded bg-[var(--accent-soft)] text-[var(--accent)] font-mono text-xs font-medium mr-1"
                    >
                      {word}
                    </span>
                  );
                }
                return word + ' ';
              })}
            </p>
          )}

          {/* Attachments Section */}
          {message.attachments?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {message.attachments.map((att, idx) => {
                if (att.type === 'image') {
                  return (
                    <div
                      key={idx}
                      onClick={() =>
                        dispatch(
                          openModal({
                            type: 'IMAGE_PREVIEW',
                            props: { url: att.url, name: att.name },
                          })
                        )
                      }
                      className="group/img relative rounded-xl overflow-hidden border border-white/10 max-w-sm max-h-64 cursor-pointer hover:border-[var(--accent-border)] transition-colors"
                    >
                      <img
                        src={att.url}
                        alt={att.name}
                        className="w-full h-full object-cover transition-transform group-hover/img:scale-102"
                      />
                    </div>
                  );
                }

                // Document / File Card
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 bg-[var(--surface-secondary)] border border-[var(--border-subtle)] p-3 rounded-xl max-w-xs"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[var(--surface-elevated)] text-[var(--text-secondary)] flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-200 truncate">
                        {att.name}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500">
                        {att.size} • {att.ext || 'FILE'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reactions Bar */}
          {message.reactions?.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {message.reactions.map((rxn, idx) => {
                const myId = String(currentUser?._id || currentUser?.id || '');
                const hasReacted = (rxn.users || []).some(
                  (u) => String(u?._id || u?.id || u) === myId
                );
                const rxnCount = rxn.count ?? rxn.users?.length ?? 1;

                return (
                  <button
                    key={idx}
                    onClick={() => handleReactionClick(rxn.emoji)}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${
                      hasReacted
                        ? 'bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent)] font-semibold shadow-sm'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <span>{rxn.emoji}</span>
                    <span className="font-mono text-[11px]">{rxnCount}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
