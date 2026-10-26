import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import {
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  Video,
  VideoOff,
  ScreenShare,
  Volume2,
  Users,
  Radio,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Avatar from "../common/Avatar";
import Button from "../common/Button";
import {
  startConnecting,
  leaveVoiceChannel,
  toggleMute,
  toggleDeafen,
  toggleVideo,
  toggleScreenShare,
} from "../../redux/slices/voiceSlice";
import { addToast } from "../../redux/slices/uiSlice";
import socket from "../../socket/socket.js";
import webrtc from "../../services/webrtc.service";

export default function VoiceStage({ channel }) {
  const dispatch = useDispatch();
  const voice = useSelector((state) => state.voice);
  const currentUser = useSelector((state) => state.auth.user);

  const localVideoRef = useRef(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // socketId -> MediaStream

  const channelId = channel?._id || channel?.id;
  const isThisChannelConnected = voice.isConnected && voice.channelId === channelId;
  const isThisChannelConnecting = voice.isConnecting && voice.channelId === channelId;

  // Listen to remote streams from webrtc service
  useEffect(() => {
    webrtc.onRemoteStreamUpdate = (socketId, stream) => {
      setRemoteStreams((prev) => ({
        ...prev,
        [socketId]: stream,
      }));
    };
  }, []);

  // Update local video element
  useEffect(() => {
    if (localVideoRef.current && webrtc.localStream) {
      localVideoRef.current.srcObject = voice.isVideo ? webrtc.localStream : null;
    }
  }, [voice.isVideo, isThisChannelConnected]);

  const handleConnect = async () => {
    try {
      dispatch(
        startConnecting({
          serverId: channel.server || channel.serverId,
          channelId,
          channelName: channel.name,
        })
      );

      // Start local audio capture
      await webrtc.startLocalMedia({ audio: true, video: voice.isVideo });

      // Join socket voice room
      if (socket.connected) {
        socket.emit("voice:join", {
          channelId,
          muted: voice.isMuted,
          deafened: voice.isDeafened,
          video: voice.isVideo,
        });
      }

      dispatch(
        addToast({
          type: "success",
          message: `Connected to voice channel: ${channel.name}`,
        })
      );
    } catch (err) {
      console.error("[Voice] Connection failed:", err);
      dispatch(leaveVoiceChannel());
      dispatch(
        addToast({
          type: "error",
          message: err.message || "Failed to access microphone. Please check permissions.",
        })
      );
    }
  };

  const handleDisconnect = () => {
    webrtc.cleanup();
    if (socket.connected) {
      socket.emit("voice:leave");
    }
    dispatch(leaveVoiceChannel());
    dispatch(
      addToast({
        type: "info",
        message: "Disconnected from voice channel.",
      })
    );
  };

  const handleToggleMute = () => {
    const nextMuted = !voice.isMuted;
    webrtc.setMuted(nextMuted);
    dispatch(toggleMute());
  };

  const handleToggleVideo = async () => {
    const nextVideo = !voice.isVideo;
    try {
      await webrtc.setVideo(nextVideo);
      dispatch(toggleVideo());
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message: "Unable to access camera device.",
        })
      );
    }
  };

  const handleToggleDeafen = () => {
    dispatch(toggleDeafen());
  };

  // Remote audio elements playing remote peers
  const renderRemoteAudioElements = () => {
    return Object.entries(remoteStreams).map(([socketId, stream]) => (
      <audio
        key={socketId}
        ref={(audioEl) => {
          if (audioEl && audioEl.srcObject !== stream) {
            audioEl.srcObject = stream;
          }
        }}
        autoPlay
        muted={voice.isDeafened}
      />
    ));
  };

  // If not connected to this channel
  if (!isThisChannelConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[var(--workspace-bg)] select-none">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mb-4">
          <Volume2 className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="font-display font-bold text-xl text-white">
          {channel.name}
        </h3>
        <p className="text-slate-400 text-sm max-w-sm mt-1 mb-6">
          High-fidelity encrypted voice and video stage.
        </p>

        <Button
          variant="primary"
          size="lg"
          className="shadow-glow-cyan"
          icon={isThisChannelConnecting ? Loader2 : Radio}
          disabled={isThisChannelConnecting}
          onClick={handleConnect}
        >
          {isThisChannelConnecting ? "Connecting to Stage..." : "Connect to Audio Stage"}
        </Button>
      </div>
    );
  }

  // Combine currentUser and remote participants
  const allParticipants = [
    {
      socketId: socket.id || "local",
      userId: currentUser?._id || currentUser?.id,
      user: currentUser,
      isMe: true,
      muted: voice.isMuted,
      deafened: voice.isDeafened,
      video: voice.isVideo,
      isSpeaking: voice.isSpeaking && !voice.isMuted,
    },
    ...voice.participants.map((p) => ({
      ...p,
      isMe: false,
    })),
  ];

  return (
    <div className="flex-1 flex flex-col bg-[var(--workspace-bg)] select-none overflow-hidden relative">
      {/* Hidden Audio Elements for WebRTC playback */}
      {renderRemoteAudioElements()}

      {/* Stage Header Info */}
      <div className="px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--surface-primary)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <h3 className="font-display font-semibold text-sm text-slate-100 flex items-center gap-2">
              <span>{channel.name}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                P2P WEBRTC LIVE
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Low-latency spatial audio engine (Opus 48kHz)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Users className="w-4 h-4 text-cyan-400" />
          <span>{allParticipants.length} Connected</span>
        </div>
      </div>

      {/* Participants Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {allParticipants.map((p) => {
            const u = p.user || {};
            const name = u.fullname || u.username || "Operative";
            const username = u.username || "user";
            const avatar = u.profile_pic;
            const hasVideo = p.video;
            const peerStream = remoteStreams[p.socketId];

            return (
              <motion.div
                key={p.socketId || p.userId}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`relative bg-[var(--surface-primary)] border ${
                  p.isSpeaking
                    ? "border-emerald-500/80 shadow-lg shadow-emerald-500/20"
                    : "border-[var(--border-subtle)]"
                } rounded-2xl p-4 flex flex-col items-center justify-center transition-all duration-300 min-h-[200px] overflow-hidden`}
              >
                {/* Video rendering or Avatar */}
                {hasVideo ? (
                  <div className="w-full h-36 rounded-xl overflow-hidden bg-black/60 relative mb-2">
                    {p.isMe ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover mirror"
                      />
                    ) : (
                      <video
                        ref={(el) => {
                          if (el && peerStream && el.srcObject !== peerStream) {
                            el.srcObject = peerStream;
                          }
                        }}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                ) : (
                  <div
                    className={`relative p-1 rounded-3xl transition-all duration-200 mb-2 ${
                      p.isSpeaking ? "ring-4 ring-emerald-500/80 shadow-lg shadow-emerald-500/30" : ""
                    }`}
                  >
                    <Avatar
                      src={avatar}
                      name={name}
                      size="xl"
                      status="online"
                    />
                  </div>
                )}

                <div className="mt-1 text-center">
                  <span className="font-display font-semibold text-sm text-slate-100 flex items-center justify-center gap-1.5">
                    {name}
                    {p.isMe && <span className="text-[10px] text-[var(--accent)] font-mono">(You)</span>}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    @{username}
                  </span>
                </div>

                {/* State Pills */}
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  {p.muted && (
                    <div className="p-1 rounded-md bg-rose-500/20 text-rose-400" title="Muted">
                      <MicOff className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {p.deafened && (
                    <div className="p-1 rounded-md bg-amber-500/20 text-amber-400" title="Deafened">
                      <Headphones className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {p.isSpeaking && (
                    <div className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-semibold animate-pulse">
                      SPEAKING
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Voice Controls Dock Bar */}
      <div className="p-4 bg-[var(--surface-primary)] border-t border-[var(--border-subtle)] flex items-center justify-center gap-3">
        {/* Toggle Mute */}
        <button
          onClick={handleToggleMute}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            voice.isMuted
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
              : "bg-[var(--surface-elevated)] text-slate-200 border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          {voice.isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-400" />}
          <span>{voice.isMuted ? "Unmute" : "Mute"}</span>
        </button>

        {/* Toggle Video */}
        <button
          onClick={handleToggleVideo}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            voice.isVideo
              ? "bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-border)] hover:bg-[var(--accent-soft-hover)]"
              : "bg-[var(--surface-elevated)] text-slate-200 border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          {voice.isVideo ? <Video className="w-4 h-4 text-[var(--accent)]" /> : <VideoOff className="w-4 h-4" />}
          <span>{voice.isVideo ? "Stop Video" : "Camera"}</span>
        </button>

        {/* Toggle Deafen */}
        <button
          onClick={handleToggleDeafen}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
            voice.isDeafened
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
              : "bg-[var(--surface-elevated)] text-slate-200 border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)]"
          }`}
        >
          <Headphones className="w-4 h-4" />
          <span>{voice.isDeafened ? "Undeafen" : "Deafen"}</span>
        </button>

        {/* Disconnect Voice */}
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors"
        >
          <PhoneOff className="w-4 h-4" />
          <span>Disconnect</span>
        </button>
      </div>
    </div>
  );
}
