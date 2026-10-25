import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  MicOff,
  Headphones,
  PhoneOff,
  Video,
  VideoOff,
  Volume2,
} from "lucide-react";
import {
  toggleMute,
  toggleDeafen,
  toggleVideo,
  leaveVoiceChannel,
} from "../../redux/slices/voiceSlice";
import { addToast } from "../../redux/slices/uiSlice";
import socket from "../../socket/socket.js";
import webrtc from "../../services/webrtc.service";

export default function VoiceChannelOverlay() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const voice = useSelector((state) => state.voice);

  if (!voice.isConnected) return null;

  const handleToggleMute = (e) => {
    e.stopPropagation();
    const nextMuted = !voice.isMuted;
    webrtc.setMuted(nextMuted);
    dispatch(toggleMute());
  };

  const handleToggleVideo = async (e) => {
    e.stopPropagation();
    const nextVideo = !voice.isVideo;
    try {
      await webrtc.setVideo(nextVideo);
      dispatch(toggleVideo());
    } catch {
      dispatch(addToast({ type: "error", message: "Failed to access camera" }));
    }
  };

  const handleToggleDeafen = (e) => {
    e.stopPropagation();
    dispatch(toggleDeafen());
  };

  const handleDisconnect = (e) => {
    e.stopPropagation();
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

  const handleReturnToStage = () => {
    if (voice.serverId && voice.channelId) {
      navigate(`/app/server/${voice.serverId}/${voice.channelId}`);
    }
  };

  return (
    <div
      onClick={handleReturnToStage}
      className="p-2.5 bg-[#080B10] border-t border-emerald-500/20 flex items-center justify-between cursor-pointer hover:bg-[#0E131C] transition-colors select-none"
    >
      <div className="flex items-center gap-2 min-w-0 pr-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-emerald-400 truncate">
              Voice Connected
            </span>
            <span className="text-[9px] font-mono text-slate-500">
              ({voice.participants.length + 1})
            </span>
          </div>
          <p className="text-[10px] text-slate-400 truncate">
            {voice.channelName || "Audio Stage"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={handleToggleMute}
          className={`p-1.5 rounded-lg border transition-colors ${
            voice.isMuted
              ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
              : "text-slate-400 hover:text-white border-white/5"
          }`}
          title={voice.isMuted ? "Unmute" : "Mute"}
        >
          {voice.isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
        </button>

        <button
          onClick={handleToggleDeafen}
          className={`p-1.5 rounded-lg border transition-colors ${
            voice.isDeafened
              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
              : "text-slate-400 hover:text-white border-white/5"
          }`}
          title={voice.isDeafened ? "Undeafen" : "Deafen"}
        >
          <Headphones className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleDisconnect}
          className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/30 transition-colors ml-0.5"
          title="Disconnect"
        >
          <PhoneOff className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
