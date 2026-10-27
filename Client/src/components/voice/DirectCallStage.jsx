import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Shield,
  Loader2,
} from "lucide-react";
import Avatar from "../common/Avatar";
import socket from "../../socket/socket.js";
import webrtc from "../../services/webrtc.service.js";
import {
  endDirectCall,
  toggleMute,
  toggleVideo,
} from "../../redux/slices/voiceSlice";
import { addToast } from "../../redux/slices/uiSlice";

export default function DirectCallStage() {
  const dispatch = useDispatch();
  const activeDirectCall = useSelector((state) => state.voice.activeDirectCall);
  const { isMuted, isVideo } = useSelector((state) => state.voice);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [remoteStream, setRemoteStream] = useState(null);

  useEffect(() => {
    if (!activeDirectCall) return;

    webrtc.onRemoteStreamUpdate = (socketId, stream) => {
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    if (localVideoRef.current && webrtc.localStream) {
      localVideoRef.current.srcObject = webrtc.localStream;
    }

    return () => {
      webrtc.onRemoteStreamUpdate = null;
    };
  }, [activeDirectCall]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!activeDirectCall) return null;

  const { callId, peer, isCaller, status } = activeDirectCall;
  const peerName = peer?.fullname || peer?.username || "Operative";
  const peerAvatar = peer?.profile_pic || "";

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    dispatch(toggleMute());
    webrtc.setMuted(nextMuted);
  };

  const handleToggleVideo = async () => {
    try {
      const nextVideo = !isVideo;
      dispatch(toggleVideo());
      await webrtc.setVideo(nextVideo);
      if (localVideoRef.current && webrtc.localStream) {
        localVideoRef.current.srcObject = nextVideo ? webrtc.localStream : null;
      }
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message: "Failed to toggle camera",
        })
      );
    }
  };

  const handleEndCall = () => {
    socket.emit("direct-call:end", { callId });
    webrtc.cleanup();
    dispatch(endDirectCall());
    dispatch(
      addToast({
        type: "info",
        message: "Transmission session terminated.",
      })
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl animate-fadeIn">
      {/* Top Header */}
      <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <Avatar src={peerAvatar} name={peerName} size="sm" status="online" />
          <div>
            <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2">
              <span>{peerName}</span>
              <span className="text-[10px] font-mono text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded-full border border-[var(--accent-border)]">
                {status === "ringing" ? "RINGING..." : "CONNECTED"}
              </span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
          <Shield className="w-3.5 h-3.5" />
          <span>Encrypted Direct Transmission</span>
        </div>
      </div>

      {/* Main Call View */}
      <div className="flex-1 relative flex items-center justify-center p-6 overflow-hidden">
        {status === "ringing" ? (
          <div className="text-center space-y-4">
            <div className="relative inline-block mx-auto">
              <div className="absolute inset-0 rounded-full bg-[var(--accent)]/30 animate-ping" />
              <Avatar
                src={peerAvatar}
                name={peerName}
                size="2xl"
                className="relative z-10 ring-4 ring-[var(--accent)]/50 mx-auto"
              />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-white">
                Calling {peerName}...
              </h2>
              <p className="text-xs font-mono text-slate-400 mt-1 flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Establishing encrypted connection route...</span>
              </p>
            </div>
          </div>
        ) : isVideo ? (
          <div className="relative w-full h-full max-w-5xl rounded-3xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl flex items-center justify-center">
            {/* Remote Video Stream */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!remoteStream && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs font-mono">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
                <span>Synchronizing incoming video stream...</span>
              </div>
            )}

            {/* Local Video Stream PIP */}
            <div className="absolute bottom-6 right-6 w-44 h-32 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ) : (
          /* Voice Only Active Call */
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[var(--accent)]/20 animate-pulse scale-110" />
              <Avatar
                src={peerAvatar}
                name={peerName}
                size="2xl"
                className="relative z-10 ring-4 ring-white/10 shadow-2xl"
              />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl text-white">
                {peerName}
              </h2>
              <p className="text-xs font-mono text-emerald-400 mt-1">
                Audio transmission active
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Control Dock */}
      <div className="h-20 px-6 border-t border-white/10 flex items-center justify-center gap-4 bg-slate-900/80 flex-shrink-0">
        {/* Mute Button */}
        <button
          onClick={handleToggleMute}
          className={`p-3.5 rounded-2xl transition-all ${
            isMuted
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              : "bg-white/10 hover:bg-white/15 text-white"
          }`}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Video Toggle Button */}
        <button
          onClick={handleToggleVideo}
          className={`p-3.5 rounded-2xl transition-all ${
            !isVideo
              ? "bg-white/10 hover:bg-white/15 text-slate-400"
              : "bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent)]"
          }`}
          title={isVideo ? "Turn off camera" : "Turn on camera"}
        >
          {isVideo ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* End Call Button */}
        <button
          onClick={handleEndCall}
          className="p-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all hover:scale-102 active:scale-98"
          title="End Call"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="text-xs">End Transmission</span>
        </button>
      </div>
    </div>
  );
}
