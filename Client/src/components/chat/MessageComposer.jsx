import React, { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Send,
  Paperclip,
  Smile,
  Image,
  X,
  CornerDownRight,
  AtSign,
  Sparkles,
} from 'lucide-react';
import { sendMessage, clearReplyTarget } from '../../redux/slices/messageSlice';
import { addToast } from '../../redux/slices/uiSlice';
import { MOCK_GIFS, MOCK_GIF_CATEGORIES } from '../../data/mockGifs';
import { MOCK_USERS } from '../../data/mockUsers';

const EMOJI_PALETTE = [
  '😀', '😂', '😍', '🔥', '🚀', '✨', '🧠', '👍', '🙌', '🎉',
  '❤️', '💡', '🤖', '⚡', '👀', '😎', '💻', '🎮', '💯', '🛡️'
];

export default function MessageComposer({ contextId, placeholder = 'Transmit to channel...' }) {
  const dispatch = useDispatch();
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const currentUser = useSelector((state) => state.auth.currentUser);
  const replyTarget = useSelector((state) => state.messages.replyTarget);

  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifCategory, setGifCategory] = useState('All');
  const [mentionQuery, setMentionQuery] = useState(null); // string or null

  // Handle textarea expansion
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [text]);

  // Clean up object URLs when unmounting or removing
  useEffect(() => {
    return () => {
      attachments.forEach((att) => {
        if (att.url && att.url.startsWith('blob:')) {
          URL.revokeObjectURL(att.url);
        }
      });
    };
  }, [attachments]);

  // Handle Send
  const handleSend = () => {
    if (!text.trim() && attachments.length === 0) return;

    dispatch(
      sendMessage({
        contextId,
        content: text.trim(),
        author: currentUser,
        replyTo: replyTarget,
        attachments,
      })
    );

    setText('');
    setAttachments([]);
    setShowEmojiPicker(false);
    setShowGifPicker(false);
    setMentionQuery(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Keyboard navigation: Enter sends, Shift+Enter newlines
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Input change for @mention auto-complete detection
  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAt = textBeforeCursor.lastIndexOf('@');

    if (lastAt !== -1 && lastAt >= textBeforeCursor.length - 15) {
      const query = textBeforeCursor.slice(lastAt + 1);
      if (!query.includes(' ')) {
        setMentionQuery(query.toLowerCase());
        return;
      }
    }
    setMentionQuery(null);
  };

  // Insert mention
  const handleSelectMention = (user) => {
    const cursorPos = textareaRef.current?.selectionStart || text.length;
    const textBeforeCursor = text.slice(0, cursorPos);
    const textAfterCursor = text.slice(cursorPos);
    const lastAt = textBeforeCursor.lastIndexOf('@');

    const newText =
      textBeforeCursor.slice(0, lastAt) + `@${user.username} ` + textAfterCursor;
    setText(newText);
    setMentionQuery(null);
    textareaRef.current?.focus();
  };

  // File upload simulation using local FileReader
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const isImg = file.type.startsWith('image/');
      const objectUrl = URL.createObjectURL(file);
      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

      setAttachments((prev) => [
        ...prev,
        {
          id: 'att_' + Date.now() + Math.random(),
          name: file.name,
          type: isImg ? 'image' : 'document',
          url: objectUrl,
          size: sizeStr,
          ext: file.name.split('.').pop()?.toUpperCase() || 'FILE',
        },
      ]);
    });

    e.target.value = '';
  };

  const handleRemoveAttachment = (attId) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === attId);
      if (target?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(target.url);
      }
      return prev.filter((a) => a.id !== attId);
    });
  };

  const handleInsertEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleSelectGif = (gif) => {
    setAttachments((prev) => [
      ...prev,
      {
        id: 'gif_' + Date.now(),
        name: gif.title,
        type: 'image',
        url: gif.url,
        size: '1.2 MB',
      },
    ]);
    setShowGifPicker(false);
  };

  // Filtered members for @mentions
  const matchedUsers = mentionQuery !== null
    ? MOCK_USERS.filter(
        (u) =>
          u.name.toLowerCase().includes(mentionQuery) ||
          u.username.toLowerCase().includes(mentionQuery)
      ).slice(0, 5)
    : [];

  return (
    <div className="relative px-4 pb-4 select-none">
      {/* Reply Reference Preview Banner */}
      {replyTarget && (
        <div className="flex items-center justify-between bg-[#151A23] border border-white/10 border-b-0 rounded-t-xl px-4 py-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300 min-w-0">
            <CornerDownRight className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span className="font-semibold text-cyan-300">
              Replying to @{replyTarget.authorName}:
            </span>
            <span className="truncate italic text-slate-400">
              "{replyTarget.content}"
            </span>
          </div>
          <button
            onClick={() => dispatch(clearReplyTarget())}
            className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Composer Box */}
      <div
        className={`relative bg-[#10141C] border ${
          replyTarget ? 'rounded-b-2xl border-t-0' : 'rounded-2xl'
        } border-white/10 focus-within:border-cyan-500/50 focus-within:ring-2 focus-within:ring-cyan-500/10 transition-all shadow-xl shadow-black/50`}
      >
        {/* Attachment Previews */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2.5 p-3 border-b border-white/5">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="relative group bg-[#0C0F15] border border-white/10 rounded-xl overflow-hidden p-1.5 flex items-center gap-2 max-w-[200px]"
              >
                {att.type === 'image' ? (
                  <img
                    src={att.url}
                    alt={att.name}
                    className="w-10 h-10 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs">
                    {att.ext}
                  </div>
                )}
                <span className="text-xs text-slate-200 truncate flex-1">
                  {att.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(att.id)}
                  className="p-1 rounded-md bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Input Row */}
        <div className="flex items-end px-3 py-2">
          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-white/5 rounded-xl transition-colors mb-0.5"
            title="Attach file"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
          />

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-0 text-slate-100 placeholder:text-slate-500 text-sm px-3 py-2 focus:outline-none resize-none max-h-44"
          />

          {/* Right Tools: GIF, Emoji, Send */}
          <div className="flex items-center gap-1 mb-0.5">
            {/* GIF Picker Trigger */}
            <button
              type="button"
              onClick={() => {
                setShowGifPicker(!showGifPicker);
                setShowEmojiPicker(false);
              }}
              className="px-2 py-1 text-slate-400 hover:text-violet-300 hover:bg-white/5 rounded-lg text-xs font-mono font-bold transition-colors"
              title="GIFs"
            >
              GIF
            </button>

            {/* Emoji Picker Trigger */}
            <button
              type="button"
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowGifPicker(false);
              }}
              className="p-2 text-slate-400 hover:text-amber-300 hover:bg-white/5 rounded-xl transition-colors"
              title="Emoji"
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Send Button */}
            <button
              type="button"
              onClick={handleSend}
              disabled={!text.trim() && attachments.length === 0}
              className="p-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl shadow-md shadow-cyan-500/20 disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-95 ml-1"
              title="Transmit (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Emoji Popover */}
        {showEmojiPicker && (
          <div className="absolute bottom-full right-4 mb-2 bg-[#151A23] border border-white/10 rounded-2xl p-3 shadow-2xl shadow-black/80 z-30 w-64 animate-fadeIn">
            <div className="text-[11px] font-mono text-slate-400 uppercase mb-2">
              Select Emoji
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {EMOJI_PALETTE.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleInsertEmoji(emoji)}
                  className="p-2 text-lg hover:bg-white/10 rounded-xl transition-transform hover:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* GIF Popover */}
        {showGifPicker && (
          <div className="absolute bottom-full right-4 mb-2 bg-[#151A23] border border-white/10 rounded-2xl p-3 shadow-2xl shadow-black/80 z-30 w-80 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase">
                Nexora GIF Vault
              </span>
              <button
                type="button"
                onClick={() => setShowGifPicker(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 overflow-x-auto pb-2 mb-2">
              {MOCK_GIF_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setGifCategory(cat)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors ${
                    gifCategory === cat
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* GIFs Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
              {MOCK_GIFS.filter(
                (g) => gifCategory === 'All' || g.category === gifCategory
              ).map((gif) => (
                <div
                  key={gif.id}
                  onClick={() => handleSelectGif(gif)}
                  className="rounded-xl overflow-hidden border border-white/10 cursor-pointer hover:border-cyan-400/50 transition-colors h-24 bg-black/40"
                >
                  <img
                    src={gif.preview}
                    alt={gif.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* @Mention Autocomplete Dropdown */}
        {mentionQuery !== null && matchedUsers.length > 0 && (
          <div className="absolute bottom-full left-4 mb-2 bg-[#151A23] border border-white/10 rounded-2xl p-2 shadow-2xl shadow-black/80 z-30 w-64 animate-fadeIn">
            <div className="text-[10px] font-mono text-slate-400 uppercase px-2 mb-1">
              Mention Member
            </div>
            <div className="space-y-0.5">
              {matchedUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleSelectMention(user)}
                  className="w-full flex items-center gap-2 p-1.5 rounded-xl hover:bg-cyan-500/10 text-left transition-colors"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-6 h-6 rounded-md object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">
                      {user.name}
                    </p>
                    <p className="text-[10px] font-mono text-cyan-400">
                      @{user.username}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
