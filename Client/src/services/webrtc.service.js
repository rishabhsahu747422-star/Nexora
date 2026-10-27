import socket from "../socket/socket.js";

export const getIceServers = () => {
  const servers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
  ];

  const turnUrl = import.meta.env.VITE_TURN_SERVER_URL || import.meta.env.VITE_TURN_URL;
  const turnUsername = import.meta.env.VITE_TURN_USERNAME;
  const turnCredential = import.meta.env.VITE_TURN_CREDENTIAL;

  if (turnUrl) {
    const turnConfig = { urls: turnUrl };
    if (turnUsername) turnConfig.username = turnUsername;
    if (turnCredential) turnConfig.credential = turnCredential;
    servers.push(turnConfig);
    console.log("[WebRTC] Added configured TURN server:", turnUrl);
  }

  return servers;
};

class WebRTCService {
  constructor() {
    this.localStream = null;
    this.screenStream = null;
    // Map: targetSocketId -> { pc, remoteStream, user, pendingCandidates: [], hasRemoteDescription: boolean, makingOffer: boolean }
    this.peers = new Map();
    this.audioContext = null;
    this.analyser = null;
    this.speakingInterval = null;
    this.onSpeakingChange = null;
    this.onRemoteStreamUpdate = null;
    this.onScreenShareEnded = null;
    this.onConnectionStateChange = null;
    this.isDirectCall = false;
    this.currentCallId = null;
  }

  getRTCConfiguration() {
    return {
      iceServers: getIceServers(),
      iceCandidatePoolSize: 2,
    };
  }

  async startLocalMedia({ audio = true, video = false }) {
    console.log(`[WebRTC] Requesting local media: audio=${audio}, video=${video}`);
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: audio
          ? {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            }
          : false,
        video: video
          ? {
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              frameRate: { ideal: 30, max: 60 },
            }
          : false,
      });

      const audioTracks = this.localStream.getAudioTracks();
      const videoTracks = this.localStream.getVideoTracks();
      console.log(
        `[WebRTC] Local media acquired successfully: ${audioTracks.length} audio track(s), ${videoTracks.length} video track(s)`
      );

      this.setupSpeakingDetection();
      return this.localStream;
    } catch (err) {
      console.error("[WebRTC] Error acquiring local media:", err);
      let errorMsg = "Could not access microphone/camera.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMsg = "Microphone/camera access was denied. Please allow permissions in your browser.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMsg = "No microphone or camera input device found.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errorMsg = "Camera or microphone is already in use by another application.";
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

      if (this.audioContext) {
        try {
          this.audioContext.close();
        } catch (_) {}
      }

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(this.localStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.2;
      source.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      let wasSpeaking = false;

      if (this.speakingInterval) {
        clearInterval(this.speakingInterval);
      }

      this.speakingInterval = setInterval(() => {
        if (!this.analyser) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        const isSpeaking = average > 18;

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

  createPeerConnection(targetSocketId, user, isInitiator = false) {
    console.log(
      `[WebRTC] Creating RTCPeerConnection for ${targetSocketId} (initiator: ${isInitiator})`
    );

    if (this.peers.has(targetSocketId)) {
      this.closePeer(targetSocketId);
    }

    const pc = new RTCPeerConnection(this.getRTCConfiguration());
    const remoteStream = new MediaStream();

    const peerData = {
      pc,
      remoteStream,
      user,
      pendingCandidates: [],
      hasRemoteDescription: false,
      makingOffer: false,
    };
    this.peers.set(targetSocketId, peerData);

    // Attach local media tracks if available
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        console.log(`[WebRTC] Adding local ${track.kind} track to PC with ${targetSocketId}`);
        pc.addTrack(track, this.localStream);
      });
    }

    // Attach screen sharing track if screen is actively sharing
    if (this.screenStream) {
      const screenTrack = this.screenStream.getVideoTracks()[0];
      if (screenTrack) {
        const videoSender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (videoSender) {
          videoSender.replaceTrack(screenTrack).catch((err) =>
            console.error("[WebRTC] replaceTrack with screenTrack failed:", err)
          );
        } else {
          pc.addTrack(screenTrack, this.screenStream);
        }
      }
    }

    // ICE Candidate generation
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

    // Track reception
    pc.ontrack = (event) => {
      console.log(
        `[WebRTC] ontrack received from ${targetSocketId}: kind=${event.track.kind}, id=${event.track.id}`
      );

      // Add track to remoteStream if not already present
      if (!remoteStream.getTracks().some((t) => t.id === event.track.id)) {
        remoteStream.addTrack(event.track);
      }

      event.track.onmute = () => {
        console.log(`[WebRTC] Remote track muted: ${event.track.kind}`);
        if (this.onRemoteStreamUpdate) {
          this.onRemoteStreamUpdate(targetSocketId, remoteStream);
        }
      };

      event.track.onunmute = () => {
        console.log(`[WebRTC] Remote track unmuted: ${event.track.kind}`);
        if (this.onRemoteStreamUpdate) {
          this.onRemoteStreamUpdate(targetSocketId, remoteStream);
        }
      };

      event.track.onended = () => {
        console.log(`[WebRTC] Remote track ended: ${event.track.kind}`);
        remoteStream.removeTrack(event.track);
        if (this.onRemoteStreamUpdate) {
          this.onRemoteStreamUpdate(targetSocketId, remoteStream);
        }
      };

      if (this.onRemoteStreamUpdate) {
        this.onRemoteStreamUpdate(targetSocketId, remoteStream);
      }
    };

    // Connection state diagnostics
    pc.onconnectionstatechange = () => {
      console.log(
        `[WebRTC] Connection state with ${targetSocketId}: ${pc.connectionState} (ICE: ${pc.iceConnectionState}, Signaling: ${pc.signalingState})`
      );
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(targetSocketId, pc.connectionState);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE state with ${targetSocketId}: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === "failed") {
        console.warn(`[WebRTC] ICE connection failed with ${targetSocketId}. Attempting restart.`);
        if (isInitiator) {
          pc.createOffer({ iceRestart: true })
            .then((offer) => pc.setLocalDescription(offer))
            .then(() => {
              const eventName = this.isDirectCall ? "direct-call:signal" : "voice:signal";
              socket.emit(eventName, {
                targetSocketId,
                signal: { type: "offer", sdp: pc.localDescription },
                callId: this.currentCallId,
              });
            })
            .catch((err) => console.error("[WebRTC] ICE restart failed:", err));
        }
      }
    };

    // If initiator, generate and send initial SDP offer
    if (isInitiator) {
      peerData.makingOffer = true;
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer))
        .then(() => {
          console.log(`[WebRTC] Initial offer created and sent to ${targetSocketId}`);
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
        .catch((err) => console.error("[WebRTC] Create offer error:", err))
        .finally(() => {
          peerData.makingOffer = false;
        });
    }

    return pc;
  }

  async handleSignal(senderSocketId, signal, senderUser, callId = null) {
    if (callId) {
      this.currentCallId = callId;
    }

    let peer = this.peers.get(senderSocketId);

    if (signal.type === "offer") {
      console.log(`[WebRTC] Handling offer from ${senderSocketId}`);
      let pc;
      if (!peer || !peer.pc) {
        pc = this.createPeerConnection(senderSocketId, senderUser, false);
        peer = this.peers.get(senderSocketId);
      } else {
        pc = peer.pc;
      }

      try {
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        peer.hasRemoteDescription = true;
        console.log(`[WebRTC] Remote description set for offer from ${senderSocketId}`);

        // Drain queued ICE candidates
        await this.drainCandidateQueue(senderSocketId);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log(`[WebRTC] Created answer and sent to ${senderSocketId}`);

        const eventName = this.isDirectCall ? "direct-call:signal" : "voice:signal";
        socket.emit(eventName, {
          targetSocketId: senderSocketId,
          signal: {
            type: "answer",
            sdp: pc.localDescription,
          },
          callId: this.currentCallId,
        });
      } catch (err) {
        console.error(`[WebRTC] Error processing offer from ${senderSocketId}:`, err);
      }
    } else if (signal.type === "answer") {
      console.log(`[WebRTC] Handling answer from ${senderSocketId}`);
      if (peer && peer.pc) {
        try {
          await peer.pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          peer.hasRemoteDescription = true;
          console.log(`[WebRTC] Remote description set for answer from ${senderSocketId}`);

          // Drain queued ICE candidates
          await this.drainCandidateQueue(senderSocketId);
        } catch (err) {
          console.error(`[WebRTC] Error setting remote description for answer:`, err);
        }
      }
    } else if (signal.type === "candidate") {
      if (signal.candidate) {
        if (peer && peer.hasRemoteDescription && peer.pc.remoteDescription) {
          try {
            await peer.pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (err) {
            console.warn(`[WebRTC] Error adding ICE candidate directly:`, err);
          }
        } else {
          // Queue candidate until remote description is set
          if (!peer) {
            peer = { pendingCandidates: [signal.candidate] };
            this.peers.set(senderSocketId, peer);
          } else {
            peer.pendingCandidates = peer.pendingCandidates || [];
            peer.pendingCandidates.push(signal.candidate);
          }
          console.log(
            `[WebRTC] Queued ICE candidate from ${senderSocketId} (queue size: ${peer.pendingCandidates.length})`
          );
        }
      }
    }
  }

  async drainCandidateQueue(socketId) {
    const peer = this.peers.get(socketId);
    if (!peer || !peer.pc || !peer.pendingCandidates || peer.pendingCandidates.length === 0) {
      return;
    }

    console.log(
      `[WebRTC] Draining ${peer.pendingCandidates.length} queued ICE candidate(s) for ${socketId}`
    );
    const candidates = [...peer.pendingCandidates];
    peer.pendingCandidates = [];

    for (const cand of candidates) {
      try {
        await peer.pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch (err) {
        console.warn("[WebRTC] Error draining ICE candidate:", err);
      }
    }
  }

  async renegotiate(targetSocketId) {
    const peer = this.peers.get(targetSocketId);
    if (!peer || !peer.pc) return;

    try {
      console.log(`[WebRTC] Starting SDP renegotiation with ${targetSocketId}...`);
      peer.makingOffer = true;
      const offer = await peer.pc.createOffer();
      await peer.pc.setLocalDescription(offer);

      const eventName = this.isDirectCall ? "direct-call:signal" : "voice:signal";
      socket.emit(eventName, {
        targetSocketId,
        signal: {
          type: "offer",
          sdp: peer.pc.localDescription,
        },
        callId: this.currentCallId,
      });
      console.log(`[WebRTC] Renegotiation offer sent to ${targetSocketId}`);
    } catch (err) {
      console.error(`[WebRTC] Renegotiation error with ${targetSocketId}:`, err);
    } finally {
      peer.makingOffer = false;
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
    console.log(`[WebRTC] setVideo: ${enabled}`);
    if (!this.localStream) {
      if (enabled) {
        await this.startLocalMedia({ audio: true, video: true });
      }
      return;
    }

    let videoTrack = this.localStream.getVideoTracks().find((t) => t.readyState === "live");

    if (enabled) {
      if (!videoTrack) {
        try {
          const videoStream = await navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 1280, max: 1920 },
              height: { ideal: 720, max: 1080 },
              frameRate: { ideal: 30, max: 60 },
            },
          });
          videoTrack = videoStream.getVideoTracks()[0];
          this.localStream.addTrack(videoTrack);

          // Update each peer connection
          for (const [targetSocketId, { pc }] of this.peers.entries()) {
            const videoSender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
            if (videoSender && !this.screenStream) {
              await videoSender.replaceTrack(videoTrack);
            } else if (!videoSender) {
              pc.addTrack(videoTrack, this.localStream);
              await this.renegotiate(targetSocketId);
            }
          }
        } catch (err) {
          console.error("[WebRTC] Failed to acquire video track on toggle:", err);
          throw err;
        }
      } else {
        videoTrack.enabled = true;
        // If screen sharing is not active, ensure camera track is in video senders
        if (!this.screenStream) {
          for (const [_, { pc }] of this.peers.entries()) {
            const videoSender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
            if (videoSender) {
              await videoSender.replaceTrack(videoTrack);
            }
          }
        }
      }
    } else if (videoTrack) {
      videoTrack.enabled = false;
      // If camera stopped and not screen sharing, replace with null or disabled
      if (!this.screenStream) {
        for (const [_, { pc }] of this.peers.entries()) {
          const videoSender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
          if (videoSender) {
            // Keep track but disabled or replaceTrack(null)
            videoTrack.enabled = false;
          }
        }
      }
    }

    if (socket.connected) {
      socket.emit("voice:toggle-media", { video: enabled });
    }
  }

  async startScreenShare() {
    console.log("[WebRTC] Starting screen share via getDisplayMedia");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      throw new Error("Screen sharing is not supported in this browser environment.");
    }

    try {
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
        },
        audio: false,
      });

      const screenTrack = this.screenStream.getVideoTracks()[0];
      if (!screenTrack) {
        throw new Error("No video track found in screen share stream.");
      }

      console.log(`[WebRTC] Screen share acquired: ${screenTrack.label}`);

      // Handle user stopping screen share via browser native banner
      screenTrack.onended = async () => {
        console.log("[WebRTC] Native screen share ended event received");
        await this.stopScreenShare();
        if (this.onScreenShareEnded) {
          this.onScreenShareEnded();
        }
      };

      // Replace or add video track on all peers
      for (const [targetSocketId, { pc }] of this.peers.entries()) {
        const videoSender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (videoSender) {
          console.log(`[WebRTC] Replacing video track with screenTrack for ${targetSocketId}`);
          await videoSender.replaceTrack(screenTrack);
        } else {
          console.log(`[WebRTC] Adding screenTrack to PC and renegotiating for ${targetSocketId}`);
          pc.addTrack(screenTrack, this.screenStream);
          await this.renegotiate(targetSocketId);
        }
      }

      return this.screenStream;
    } catch (err) {
      console.error("[WebRTC] Failed to start screen sharing:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        throw new Error("Screen sharing permission was cancelled or denied.");
      }
      throw err;
    }
  }

  async stopScreenShare() {
    console.log("[WebRTC] Stopping screen share");
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (_) {}
      });
      this.screenStream = null;
    }

    // Revert peer video senders to camera track or null
    const cameraTrack = this.localStream?.getVideoTracks().find((t) => t.readyState === "live");
    for (const [_, { pc }] of this.peers.entries()) {
      const videoSender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
      if (videoSender) {
        if (cameraTrack && cameraTrack.enabled) {
          console.log("[WebRTC] Restoring camera video track on sender");
          await videoSender.replaceTrack(cameraTrack);
        } else {
          console.log("[WebRTC] Clearing video track on sender (no live camera)");
          await videoSender.replaceTrack(null);
        }
      }
    }
  }

  getRemoteStream(socketId) {
    const peer = this.peers.get(socketId);
    return peer ? peer.remoteStream : null;
  }

  closePeer(socketId) {
    const peer = this.peers.get(socketId);
    if (peer) {
      try {
        if (peer.pc) {
          peer.pc.close();
        }
      } catch (e) {
        console.warn(e);
      }
      this.peers.delete(socketId);
    }
  }

  cleanup() {
    console.log("[WebRTC] Cleaning up WebRTC session resources");
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

    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    this.peers.forEach((peer) => {
      try {
        if (peer.pc) {
          peer.pc.close();
        }
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
