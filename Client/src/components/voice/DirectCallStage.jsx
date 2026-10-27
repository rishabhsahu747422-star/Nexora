import React, { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  ScreenShare,
  PhoneOff,
  Shield,
  Loader2,
  Volume2,
} from "lucide-react";
import Avatar from "../common/Avatar";
import socket from "../../socket/socket.js";
import webrtc from "../../services/webrtc.service.js";
import {
  endDirectCall,
  toggleMute,
  toggleVideo,
  setScreenSharing,
} from "../../redux/slices/voiceSlice";
import { addToast } from "../../redux/slices/uiSlice";

export default function DirectCallStage() {
  const dispatch = useDispatch();
  const activeDirectCall = useSelector((state) => state.voice.activeDirectCall);
  const { isMuted, isVideo, isScreenSharing } = useSelector((state) => state.voice);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState("connecting");
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  // Initialize and track remote media stream and connection state
  useEffect(() => {
    if (!activeDirectCall) return;

    // Check if remote stream already exists in webrtc service
    for (const [_, peer] of webrtc.peers.entries()) {
      if (peer.remoteStream && peer.remoteStream.getTracks().length > 0) {
        setRemoteStream(peer.remoteStream);
        setHasRemoteVideo(
          peer.remoteStream
            .getVideoTracks()
            .some((t) => t.readyState === "live" && t.enabled)
        );
        break;
      }
    }

    webrtc.onRemoteStreamUpdate = (socketId, stream) => {
      console.log("[DirectCallStage] onRemoteStreamUpdate received:", stream);
      setRemoteStream(stream);

      const hasVideoTrack = stream
        .getVideoTracks()
        .some((t) => t.readyState === "live" && t.enabled);
      setHasRemoteVideo(hasVideoTrack);

      if (remoteVideoRef.current && hasVideoTrack) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.play().catch((err) => {
          console.warn("[DirectCallStage] remoteVideo play error:", err);
        });
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch((err) => {
          console.warn("[DirectCallStage] remoteAudio play error:", err);
        });
      }
    };

    webrtc.onConnectionStateChange = (socketId, state) => {
      console.log("[DirectCallStage] Connection state changed:", state);
      setConnectionState(state);
    };

    webrtc.onScreenShareEnded = () => {
      dispatch(setScreenSharing(false));
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = isVideo ? webrtc.localStream : null;
      }
    };

    // Update local video element for camera or screen share preview
    if (localVideoRef.current) {
      if (isScreenSharing && webrtc.screenStream) {
        localVideoRef.current.srcObject = webrtc.screenStream;
      } else if (isVideo && webrtc.localStream) {
        localVideoRef.current.srcObject = webrtc.localStream;
      } else {
        localVideoRef.current.srcObject = null;
      }
    }

    return () => {
      webrtc.onRemoteStreamUpdate = null;
      webrtc.onConnectionStateChange = null;
      webrtc.onScreenShareEnded = null;
    };
  }, [activeDirectCall, dispatch, isVideo, isScreenSharing]);

  // Sync remote stream to video & audio elements whenever remoteStream or hasRemoteVideo changes
  useEffect(() => {
    if (remoteStream) {
      const hasLiveVideo = remoteStream
        .getVideoTracks()
        .some((t) => t.readyState === "live" && t.enabled);
      setHasRemoteVideo(hasLiveVideo);

      if (remoteVideoRef.current && hasLiveVideo) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch((err) => {
          console.warn("[DirectCallStage] video play retry:", err);
        });
      }

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.play().catch((err) => {
          console.warn("[DirectCallStage] audio play retry:", err);
        });
      }
    }
  }, [remoteStream, hasRemoteVideo]);

  // Sync local preview whenever local camera or screen share toggles
  useEffect(() => {
    if (localVideoRef.current) {
      if (isScreenSharing && webrtc.screenStream) {
        localVideoRef.current.srcObject = webrtc.screenStream;
      } else if (isVideo && webrtc.localStream) {
        localVideoRef.current.srcObject = webrtc.localStream;
      } else {
        localVideoRef.current.srcObject = null;
      }
    }
  }, [isVideo, isScreenSharing]);

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
      if (localVideoRef.current) {
        if (isScreenSharing && webrtc.screenStream) {
          localVideoRef.current.srcObject = webrtc.screenStream;
        } else {
          localVideoRef.current.srcObject = nextVideo ? webrtc.localStream : null;
        }
      }
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message: err.message || "Failed to toggle camera",
        })
      );
    }
  };

  const handleToggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        await webrtc.stopScreenShare();
        dispatch(setScreenSharing(false));
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = isVideo ? webrtc.localStream : null;
        }
        dispatch(
          addToast({
            type: "info",
            message: "Screen transmission ended.",
          })
        );
      } else {
        const stream = await webrtc.startScreenShare();
        dispatch(setScreenSharing(true));
        if (localVideoRef.current && stream) {
          localVideoRef.current.srcObject = stream;
        }
        dispatch(
          addToast({
            type: "success",
            message: "Screen transmission active.",
          })
        );
      }
    } catch (err) {
      dispatch(
        addToast({
          type: "error",
          message: err.message || "Failed to toggle screen sharing",
        })
      );
    }
  };

  const handleEndCall = () => {
    const activeCallId = webrtc.currentCallId || callId;
    socket.emit("direct-call:end", { callId: activeCallId });
    webrtc.cleanup();
    dispatch(endDirectCall());
    dispatch(
      addToast({
        type: "info",
        message: "Transmission session terminated.",
      })
    );
  };

  // Determine call status display text
  let statusText = "CONNECTING...";
  if (status === "ringing") {
    statusText = isCaller ? "RINGING..." : "INCOMING...";
  } else if (connectionState === "connected") {
    statusText = "CONNECTED";
  } else if (connectionState === "failed") {
    statusText = "CONNECTION FAILED";
  } else if (connectionState === "disconnected") {
    statusText = "RECONNECTING...";
  }

  const showLocalPip = isVideo || isScreenSharing;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xl animate-fadeIn">
      {/* Persistent Audio Element for WebRTC remote audio playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Top Header */}
      <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <Avatar src={peerAvatar} name={peerName} size="sm" status="online" />
          <div>
            <h3 className="font-display font-semibold text-sm text-white flex items-center gap-2">
              <span>{peerName}</span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  statusText === "CONNECTED"
                    ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                    : statusText === "CONNECTION FAILED"
                    ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                    : "text-[var(--accent)] bg-[var(--accent-soft)] border-[var(--accent-border)]"
                }`}
              >
                {statusText}
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
          /* Ringing State */
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
        ) : hasRemoteVideo ? (
          /* Remote Video Stream Active (Camera or Screen Share) */
          <div className="relative w-full h-full max-w-5xl rounded-3xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl flex items-center justify-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain bg-black"
            />
          </div>
        ) : (
          /* Audio-Only / Camera Off Active Transmission */
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
              <p className="text-xs font-mono text-emerald-400 mt-1 flex items-center justify-center gap-1.5">
                <Volume2 className="w-4 h-4 animate-pulse" />
                <span>Audio transmission active</span>
              </p>
            </div>
          </div>
        )}

        {/* Local Picture-in-Picture Preview (Camera or Local Screen Share) */}
        {showLocalPip && (
          <div className="absolute bottom-6 right-6 w-48 h-36 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black flex flex-col z-20 group">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono text-white flex items-center gap-1 border border-white/10">
              {isScreenSharing ? (
                <>
                  <ScreenShare className="w-2.5 h-2.5 text-[var(--accent)]" />
                  <span>Sharing Screen</span>
                </>
              ) : (
                <>
                  <Video className="w-2.5 h-2.5 text-emerald-400" />
                  <span>You</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Control Dock */}
      <div className="h-20 px-6 border-t border-white/10 flex items-center justify-center gap-4 bg-slate-900/80 flex-shrink-0">
        {/* Mute / Unmute Button */}
        <button
          onClick={handleToggleMute}
          className={`p-3.5 rounded-2xl transition-all ${
            isMuted
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              : "bg-white/10 hover:bg-white/15 text-white"
          }`}
          title={isMuted ? "Unmute microphone" : "Mute microphone"}
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

        {/* Screen Share Button */}
        <button
          onClick={handleToggleScreenShare}
          className={`p-3.5 rounded-2xl transition-all flex items-center gap-2 ${
            isScreenSharing
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/20"
              : "bg-white/10 hover:bg-white/15 text-slate-300"
          }`}
          title={isScreenSharing ? "Stop sharing screen" : "Share screen"}
        >
          <ScreenShare className="w-5 h-5" />
          {isScreenSharing && (
            <span className="text-[11px] font-mono pr-1 hidden sm:inline">Sharing</span>
          )}
        </button>

        {/* End Call Button */}
        <button
          onClick={handleEndCall}
          className="p-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all hover:scale-102 active:scale-98"
          title="End Transmission"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="text-xs">End Transmission</span>
        </button>
      </div>
    </div>
  );
}
