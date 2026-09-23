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
  toggleReaction,
  togglePinMessage,
  setReplyTarget,
  deleteMessage,
  editMessage,
} from '../../redux/slices/messageSlice';
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
  const currentUser = useSelector((state) => state.auth.currentUser);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const isAuthor = message.authorId === currentUser?.id;

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
        messageId: message.id,
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
            dispatch(deleteMessage({ contextId, messageId: message.id }));
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
    dispatch(
      toggleReaction({
        contextId,
        messageId: message.id,
        emoji,
        userId: currentUser?.id,
      })
    );
  };

  // Format time
  const timeFormatted = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      id={`msg-${message.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative rounded-2xl transition-all duration-300 ${
        density === 'compact' ? 'py-1.5 px-3' : 'py-3 px-4'
      } ${
        isHighlighted
          ? 'bg-cyan-500/15 ring-1 ring-cyan-500/40 shadow-glow-sm'
          : 'hover:bg-white/[0.03]'
      } ${message.isPinned ? 'border-l-2 border-indigo-400' : ''}`}
    >
      {/* Action Dock (Floating on hover) */}
      <div className="absolute right-4 -top-3.5 hidden group-hover:flex items-center gap-0.5 bg-[#151A23] border border-white/10 rounded-xl px-1.5 py-1 shadow-xl shadow-black/80 z-20">
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
            dispatch(togglePinMessage({ contextId, messageId: message.id }));
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
        <div className="absolute right-4 top-6 z-30 bg-[#151A23] border border-white/10 rounded-xl p-2 shadow-2xl flex gap-1 animate-fadeIn">
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
          className="flex items-center gap-2 mb-1 text-[11px] text-slate-400 cursor-pointer hover:text-cyan-300 transition-colors pl-8 select-none"
        >
          <CornerDownRight className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
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
          src={message.authorAvatar}
          name={message.authorName}
          size={density === 'compact' ? 'sm' : 'md'}
          className="mt-0.5"
        />

        <div className="flex-1 min-w-0">
          {/* Header: Author + Role Pill + Timestamp + Pinned Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-semibold text-sm text-slate-100 hover:underline cursor-pointer">
              {message.authorName}
            </span>

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
              <span className="text-[10px] font-mono text-indigo-400 flex items-center gap-1 bg-indigo-500/10 px-1.5 py-0.2 rounded">
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
                className="w-full bg-[#0C0F15] border border-cyan-500/50 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none resize-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold rounded-lg transition-colors"
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
              {/* Highlight @mentions in electric cyan */}
              {message.content.split(' ').map((word, i) => {
                if (word.startsWith('@')) {
                  return (
                    <span
                      key={i}
                      className="inline-block px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-300 font-mono text-xs font-medium mr-1"
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
                      className="group/img relative rounded-xl overflow-hidden border border-white/10 max-w-sm max-h-64 cursor-pointer hover:border-cyan-400/50 transition-colors"
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
                    className="flex items-center gap-3 bg-[#0C0F15] border border-white/10 p-3 rounded-xl max-w-xs"
                  >
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center font-bold">
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
                const hasReacted = rxn.users.includes(currentUser?.id);

                return (
                  <button
                    key={idx}
                    onClick={() => handleReactionClick(rxn.emoji)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${
                      hasReacted
                        ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-200'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <span>{rxn.emoji}</span>
                    <span className="font-mono text-[11px]">{rxn.count}</span>
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
