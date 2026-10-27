import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Phone, PhoneOff, Video } from "lucide-react";
import Avatar from "../common/Avatar";
import socket from "../../socket/socket.js";
import webrtc from "../../services/webrtc.service.js";
import {
  clearIncomingCall,
  startDirectCall,
} from "../../redux/slices/voiceSlice";
import { addToast } from "../../redux/slices/uiSlice";

export default function IncomingCallModal() {
  const dispatch = useDispatch();
  const incomingCall = useSelector((state) => state.voice.incomingCall);

  if (!incomingCall) return null;

  const { callId, caller, isVideo, conversationId } = incomingCall;
  const callerName = caller?.fullname || caller?.username || "Operative";
  const callerAvatar = caller?.profile_pic || "";

  const handleAccept = async () => {
    try {
      webrtc.isDirectCall = true;
      webrtc.currentCallId = callId;

      await webrtc.startLocalMedia({ audio: true, video: isVideo });

      socket.emit("direct-call:accept", { callId });

      dispatch(
        startDirectCall({
          callId,
          conversationId,
          peer: caller,
          isVideo,
          isCaller: false,
          status: "connected",
        })
      );
      dispatch(clearIncomingCall());
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message: err.message || "Failed to access microphone/camera",
        })
      );
      handleDecline();
    }
  };

  const handleDecline = () => {
    socket.emit("direct-call:reject", { callId, reason: "declined" });
    dispatch(clearIncomingCall());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm bg-[var(--surface-primary, #11141C)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-2xl shadow-black/90 text-center space-y-5">
        <div className="relative inline-block mx-auto">
          <div className="absolute inset-0 rounded-full bg-[var(--accent)]/20 animate-ping" />
          <Avatar
            src={callerAvatar}
            name={callerName}
            size="xl"
            className="relative z-10 mx-auto ring-4 ring-[var(--accent)]/30"
          />
        </div>

        <div>
          <h3 className="font-display font-bold text-lg text-white">
            {callerName}
          </h3>
          <p className="text-xs font-mono text-[var(--accent)] flex items-center justify-center gap-1.5 mt-1">
            {isVideo ? (
              <>
                <Video className="w-3.5 h-3.5" />
                <span>Incoming Secure Video Call...</span>
              </>
            ) : (
              <>
                <Phone className="w-3.5 h-3.5" />
                <span>Incoming Secure Audio Transmission...</span>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 pt-2">
          {/* Decline Button */}
          <button
            onClick={handleDecline}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all hover:scale-102 active:scale-98"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Decline</span>
          </button>

          {/* Accept Button */}
          <button
            onClick={handleAccept}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-102 active:scale-98"
          >
            {isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
            <span>Accept</span>
          </button>
        </div>
      </div>
    </div>
  );
}
