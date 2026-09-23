import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Pin, Trash2, ExternalLink } from 'lucide-react';
import Modal from '../common/Modal';
import Avatar from '../common/Avatar';
import { togglePinMessage, setHighlightedMessageId } from '../../redux/slices/messageSlice';
import { addToast } from '../../redux/slices/uiSlice';

export default function PinnedMessagesModal({ isOpen, onClose, contextId, onJumpToMessage }) {
  const dispatch = useDispatch();
  const messages = useSelector((state) => state.messages.messagesByContext[contextId] || []);
  const pinnedMessages = messages.filter((m) => m.isPinned);

  const handleUnpin = (msgId) => {
    dispatch(togglePinMessage({ contextId, messageId: msgId }));
    dispatch(addToast({ type: 'info', message: 'Transmission unpinned.' }));
  };

  const handleJump = (msgId) => {
    onClose();
    dispatch(setHighlightedMessageId(msgId));
    if (onJumpToMessage) onJumpToMessage(msgId);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pinned Transmissions"
      subtitle={`${pinnedMessages.length} message${pinnedMessages.length === 1 ? '' : 's'} pinned in this stream`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-3">
        {pinnedMessages.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs font-mono">
            No transmissions pinned in this channel yet.
          </div>
        ) : (
          pinnedMessages.map((msg) => (
            <div
              key={msg.id}
              className="bg-[#0C0F15] border border-white/10 rounded-xl p-3.5 flex flex-col gap-2 relative group hover:border-indigo-500/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar src={msg.authorAvatar} name={msg.authorName} size="xs" />
                  <span className="text-xs font-semibold text-slate-200">
                    {msg.authorName}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleJump(msg.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-white/5 transition-colors text-xs flex items-center gap-1"
                    title="Jump to message"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Jump</span>
                  </button>
                  <button
                    onClick={() => handleUnpin(msg.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-white/5 transition-colors"
                    title="Unpin"
                  >
                    <Pin className="w-3.5 h-3.5 rotate-45" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed break-words">
                {msg.content}
              </p>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
