import React, { useRef, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import ChannelHeader from '../channel/ChannelHeader';
import MessageItem from './MessageItem';
import MessageComposer from './MessageComposer';
import PinnedMessagesModal from './PinnedMessagesModal';
import { setHighlightedMessageId } from '../../redux/slices/messageSlice';

export default function ChatContainer({ channel }) {
  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  const contextId = channel?.id;
  const messages = useSelector(
    (state) => state.messages.messagesByContext[contextId] || []
  );
  const density = useSelector((state) => state.ui.messageDensity);
  const highlightedMessageId = useSelector(
    (state) => state.messages.highlightedMessageId
  );

  const [isPinnedOpen, setIsPinnedOpen] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [contextId]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length]);

  // Jump to reply target
  const handleJumpToMessage = (msgId) => {
    dispatch(setHighlightedMessageId(msgId));
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Clear highlight after 3 seconds
  useEffect(() => {
    if (highlightedMessageId) {
      const timer = setTimeout(() => {
        dispatch(setHighlightedMessageId(null));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedMessageId, dispatch]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#07080C] overflow-hidden">
      {/* Channel Header */}
      <ChannelHeader
        channel={channel}
        onOpenPinned={() => setIsPinnedOpen(true)}
      />

      {/* Messages Stream */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-2 py-4 space-y-1 divide-y divide-transparent"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-3">
              #
            </div>
            <h3 className="font-display font-bold text-lg text-slate-200">
              Welcome to #{channel?.name}!
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              This is the start of the transmission stream. Send the first message to ignite the conversation.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              contextId={contextId}
              density={density}
              isHighlighted={highlightedMessageId === message.id}
              onJumpToReply={handleJumpToMessage}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer Deck */}
      <MessageComposer
        contextId={contextId}
        placeholder={`Transmit to #${channel?.name || 'channel'}...`}
      />

      {/* Pinned Messages Modal */}
      <PinnedMessagesModal
        isOpen={isPinnedOpen}
        onClose={() => setIsPinnedOpen(false)}
        contextId={contextId}
        onJumpToMessage={handleJumpToMessage}
      />
    </div>
  );
}
