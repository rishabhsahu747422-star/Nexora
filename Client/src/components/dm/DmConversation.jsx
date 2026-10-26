import React, { useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Shield, Loader2 } from "lucide-react";
import Avatar from "../common/Avatar";
import MessageItem from "../chat/MessageItem";
import MessageComposer from "../chat/MessageComposer";
import { openModal } from "../../redux/slices/uiSlice";
import { fetchDmMessages, sendDm } from "../../redux/slices/dmSlice";

export default function DmConversation({ dmId }) {
  const dispatch = useDispatch();
  const messagesEndRef = useRef(null);

  const currentUser = useSelector((state) => state.auth.user);
  const conversation = useSelector((state) =>
    state.dms.conversations.find((c) => (c._id || c.id) === dmId)
  );
  const messages = useSelector((state) => state.dms.messages || []);
  const messagesLoading = useSelector((state) => state.dms.messagesLoading);
  const density = useSelector((state) => state.ui.messageDensity);

  useEffect(() => {
    if (dmId) {
      dispatch(fetchDmMessages(dmId));
    }
  }, [dmId, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, dmId]);

  const otherUser = conversation?.participants?.find(
    (p) => (p._id || p.id || p).toString() !== (currentUser?._id || currentUser?.id)?.toString()
  ) || conversation?.participants?.[0] || {};

  const name = otherUser.fullname || otherUser.username || "Encrypted Transmission";
  const username = otherUser.username || "agent";
  const avatar = otherUser.profile_pic || "";

  const handleSendMessage = (payload) => {
    if (!dmId) return;
    dispatch(
      sendDm({
        conversationId: dmId,
        content: payload.content,
        files: payload.files,
      })
    );
  };

  if (!dmId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#07080C] text-slate-500 text-xs font-mono">
        Select a transmission thread to start messaging
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#07080C] overflow-hidden">
      {/* DM Header */}
      <div className="h-14 bg-[#10141C] border-b border-white/10 px-4 flex items-center justify-between z-10 flex-shrink-0">
        <div
          onClick={() =>
            dispatch(
              openModal({
                type: "PROFILE",
                props: {
                  user: {
                    id: otherUser._id || otherUser.id,
                    name,
                    username,
                    avatar,
                    status: "online",
                  },
                },
              })
            )
          }
          className="flex items-center gap-3 cursor-pointer hover:opacity-90"
        >
          <Avatar
            src={avatar}
            name={name}
            size="sm"
            status="online"
          />
          <div>
            <h3 className="font-display font-semibold text-sm text-slate-100 flex items-center gap-1.5">
              <span>{name}</span>
            </h3>
            <span className="text-[10px] font-mono text-cyan-400">
              @{username}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">P2P Encrypted</span>
          </div>
        </div>
      </div>

      {/* Messages Stream */}
      <div
        className="flex-1 overflow-y-auto px-2 py-4 flex flex-col"
        style={{ gap: "var(--message-gap, 4px)" }}
      >
        {/* DM Starter Card */}
        <div className="p-6 text-center border-b border-white/5 mb-4">
          <Avatar
            src={avatar}
            name={name}
            size="lg"
            status="online"
            className="mx-auto mb-2"
          />
          <h4 className="font-display font-bold text-base text-white">
            {name}
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            This is the very beginning of your direct transmission history with{" "}
            <span className="text-cyan-400">@{username}</span>.
          </p>
        </div>

        {messagesLoading && messages.length === 0 && (
          <div className="flex items-center justify-center py-8 text-xs font-mono text-slate-500 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Decrypting messages...</span>
          </div>
        )}

        {messages.map((message) => (
          <MessageItem
            key={message._id || message.id}
            message={message}
            contextId={dmId}
            density={density}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <MessageComposer
        contextId={dmId}
        placeholder={`Message @${username}...`}
        onSend={handleSendMessage}
      />
    </div>
  );
}
