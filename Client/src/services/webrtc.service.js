import socket from "../socket/socket.js";

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ],
};

class WebRTCService {
  constructor() {
    this.localStream = null;
    this.peers = new Map(); // targetSocketId -> { pc, remoteStream, user }
    this.audioContext = null;
    this.analyser = null;
    this.speakingInterval = null;
    this.onSpeakingChange = null;
    this.onRemoteStreamUpdate = null;
    this.isDirectCall = false;
    this.currentCallId = null;
  }

  async startLocalMedia({ audio = true, video = false }) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: video
          ? {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 24 },
            }
          : false,
      });

      this.setupSpeakingDetection();
      return this.localStream;
    } catch (err) {
      console.error("[WebRTC] Error acquiring media:", err);
      let errorMsg = "Could not access microphone/camera.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMsg = "Microphone/camera access was denied. Please allow permissions in your browser.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMsg = "No microphone or camera input device found.";
      }
      throw new Error(errorMsg);
    }
  }

  setupSpeakingDetection() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx || !this.localStream) return;

      const audioTracks = this.localStream.getAudioTracks();
      if (audioTracks.length === 0) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(this.localStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.2;
      source.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      let wasSpeaking = false;

      this.speakingInterval = setInterval(() => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const isSpeaking = average > 18; // threshold for speaking

        if (isSpeaking !== wasSpeaking) {
          wasSpeaking = isSpeaking;
          if (this.onSpeakingChange) {
            this.onSpeakingChange(isSpeaking);
          }
        }
      }, 100);
    } catch (e) {
      console.warn("[WebRTC] Audio analysis not supported or failed:", e);
    }
  }

  createPeerConnection(targetSocketId, user, isInitiator) {
    if (this.peers.has(targetSocketId)) {
      this.closePeer(targetSocketId);
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    const remoteStream = new MediaStream();

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socket.connected) {
        const eventName = this.isDirectCall ? "direct-call:signal" : "voice:signal";
        socket.emit(eventName, {
          targetSocketId,
          signal: {
            type: "candidate",
            candidate: event.candidate,
          },
          callId: this.currentCallId,
        });
      }
    };

    pc.ontrack = (event) => {
      event.streams[0]?.getTracks().forEach((track) => {
        remoteStream.addTrack(track);
      });

      if (this.onRemoteStreamUpdate) {
        this.onRemoteStreamUpdate(targetSocketId, remoteStream);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state with ${targetSocketId}:`, pc.iceConnectionState);
      if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
        if (isInitiator && pc.iceConnectionState === "failed") {
          pc.createOffer({ iceRestart: true }).then((offer) => {
            pc.setLocalDescription(offer);
            const eventName = this.isDirectCall ? "direct-call:signal" : "voice:signal";
            socket.emit(eventName, {
              targetSocketId,
              signal: { type: "offer", sdp: pc.localDescription },
              callId: this.currentCallId,
            });
          }).catch(console.error);
        }
      }
    };

    this.peers.set(targetSocketId, { pc, remoteStream, user });

    if (isInitiator) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          const eventName = this.isDirectCall ? "direct-call:signal" : "voice:signal";
          socket.emit(eventName, {
            targetSocketId,
            signal: {
              type: "offer",
              sdp: pc.localDescription,
            },
            callId: this.currentCallId,
          });
        })
        .catch((err) => console.error("[WebRTC] Offer error:", err));
    }

    return pc;
  }

  async handleSignal(senderSocketId, signal, senderUser, callId = null) {
    let peer = this.peers.get(senderSocketId);

    if (callId) {
      this.currentCallId = callId;
    }

    if (signal.type === "offer") {
      const pc = this.createPeerConnection(senderSocketId, senderUser, false);
      await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const eventName = this.isDirectCall ? "direct-call:signal" : "voice:signal";
      socket.emit(eventName, {
        targetSocketId: senderSocketId,
        signal: {
          type: "answer",
          sdp: pc.localDescription,
        },
        callId: this.currentCallId,
      });
    } else if (signal.type === "answer") {
      if (peer && peer.pc) {
        await peer.pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      }
    } else if (signal.type === "candidate") {
      if (peer && peer.pc && signal.candidate) {
        try {
          await peer.pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } catch (err) {
          console.warn("[WebRTC] Error adding ICE candidate:", err);
        }
      }
    }
  }

  setMuted(muted) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
    if (socket.connected) {
      socket.emit("voice:toggle-media", { muted });
    }
  }

  async setVideo(enabled) {
    if (!this.localStream) return;

    let videoTrack = this.localStream.getVideoTracks()[0];

    if (enabled) {
      if (!videoTrack) {
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 },
          });
          videoTrack = videoStream.getVideoTracks()[0];
          this.localStream.addTrack(videoTrack);

          // Add to all existing peer connections
          this.peers.forEach(({ pc }) => {
            pc.addTrack(videoTrack, this.localStream);
          });
        } catch (err) {
          console.error("[WebRTC] Failed to enable camera:", err);
          throw err;
        }
      } else {
        videoTrack.enabled = true;
      }
    } else if (videoTrack) {
      videoTrack.enabled = false;
    }

    if (socket.connected) {
      socket.emit("voice:toggle-media", { video: enabled });
    }
  }

  closePeer(socketId) {
    const peer = this.peers.get(socketId);
    if (peer) {
      try {
        peer.pc.close();
      } catch (e) {
        console.warn(e);
      }
      this.peers.delete(socketId);
    }
  }

  cleanup() {
    if (this.speakingInterval) {
      clearInterval(this.speakingInterval);
      this.speakingInterval = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {
        console.warn(e);
      }
      this.audioContext = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    this.peers.forEach(({ pc }) => {
      try {
        pc.close();
      } catch (e) {
        console.warn(e);
      }
    });
    this.peers.clear();
    this.isDirectCall = false;
    this.currentCallId = null;
  }
}

export const webrtc = new WebRTCService();
export default webrtc;
