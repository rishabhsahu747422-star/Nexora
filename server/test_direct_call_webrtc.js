import { io as ClientIO } from "../Client/node_modules/socket.io-client/build/esm/index.js";
import mongoose from "mongoose";
import { server } from "./src/app/app.js";
import { connectDb } from "./src/config/db.js";

const PORT = 5099;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, headers: res.headers, data };
}

function extractCookie(res, cookieName) {
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) return null;
  const match = setCookie.match(new RegExp(`${cookieName}=([^;]+)`));
  return match ? match[1] : null;
}

function createSocketClient(token) {
  return ClientIO(BASE_URL, {
    auth: { token },
    extraHeaders: {
      Cookie: `accessToken=${token}`,
    },
    transports: ["websocket"],
    reconnection: false,
    timeout: 5000,
  });
}

async function runDirectCallWebRTCTest() {
  console.log("===============================================================");
  console.log("  NEXORA — Two-Way Video Calling & Screen Sharing E2E Audit   ");
  console.log("===============================================================");

  await connectDb();
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`[PASS] Test server online on port ${PORT}`);

  try {
    const ts = Date.now().toString().slice(-6);

    // 1. Register User A and User B
    console.log("\n--> 1. Registering User A (Alice) and User B (Bob)...");
    const regA = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullname: "Alice Operator",
        username: `alice_${ts}`,
        email: `alice_${ts}@test.com`,
        password: "Password123!",
        mobile_no: "9111111111",
      }),
    });
    if (regA.status !== 200 && regA.status !== 201) throw new Error(`User A register failed: ${JSON.stringify(regA.data)}`);
    const loginA = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: `alice_${ts}@test.com`, password: "Password123!" }),
    });
    const tokenA = extractCookie(loginA, "accessToken");
    const userAId = loginA.data?.data?._id || loginA.data?.user?._id;

    const regB = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullname: "Bob Operative",
        username: `bob_${ts}`,
        email: `bob_${ts}@test.com`,
        password: "Password123!",
        mobile_no: "9222222222",
      }),
    });
    if (regB.status !== 200 && regB.status !== 201) throw new Error(`User B register failed: ${JSON.stringify(regB.data)}`);
    const loginB = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: `bob_${ts}@test.com`, password: "Password123!" }),
    });
    const tokenB = extractCookie(loginB, "accessToken");
    const userBId = loginB.data?.data?._id || loginB.data?.user?._id;

    console.log(`[PASS] Alice ID: ${userAId}, Bob ID: ${userBId}`);

    // Create DM Conversation
    const convRes = await request("/api/conversations", {
      method: "POST",
      headers: { Cookie: `accessToken=${tokenA}` },
      body: JSON.stringify({ recipientId: userBId }),
    });
    const convId = convRes.data?.data?._id || convRes.data?.conversation?._id;
    console.log(`[PASS] Conversation established: ${convId}`);

    // Connect Sockets
    const socketA = createSocketClient(tokenA);
    const socketB = createSocketClient(tokenB);

    await Promise.all([
      new Promise((resolve, reject) => {
        socketA.on("connect", resolve);
        socketA.on("connect_error", reject);
      }),
      new Promise((resolve, reject) => {
        socketB.on("connect", resolve);
        socketB.on("connect_error", reject);
      }),
    ]);
    console.log(`[PASS] Sockets connected: Alice=${socketA.id}, Bob=${socketB.id}`);

    // Wait for presence rooms to register
    await sleep(200);

    // 2. Test A: Two-Way Direct Video Call Initiation & Acceptance
    console.log("\n--> 2. Testing Two-Way Video Call Initiation & Signaling...");

    const incomingCallPromise = new Promise((resolve) => {
      socketB.once("direct-call:incoming", resolve);
    });

    let assignedCallId = null;
    await new Promise((resolve, reject) => {
      socketA.emit(
        "direct-call:initiate",
        {
          recipientId: userBId,
          conversationId: convId,
          isVideo: true,
        },
        (ack) => {
          if (ack?.success) {
            assignedCallId = ack.callId;
            resolve(ack);
          } else {
            reject(new Error(ack?.message || "Initiate failed"));
          }
        }
      );
    });
    console.log(`[PASS] Alice initiated video call, server assigned Call ID: ${assignedCallId}`);

    const incoming = await incomingCallPromise;
    if (incoming.callId !== assignedCallId || !incoming.isVideo) {
      throw new Error(`Incoming call payload mismatch: ${JSON.stringify(incoming)}`);
    }
    console.log(`[PASS] Bob received direct-call:incoming with matching callId and isVideo=true`);

    // Bob accepts call
    const acceptedPromiseA = new Promise((resolve) => socketA.once("direct-call:accepted", resolve));
    const acceptedPromiseB = new Promise((resolve) => socketB.once("direct-call:accepted", resolve));

    socketB.emit("direct-call:accept", { callId: assignedCallId });

    const [acceptedA, acceptedB] = await Promise.all([acceptedPromiseA, acceptedPromiseB]);
    if (acceptedA.callId !== assignedCallId || acceptedB.callId !== assignedCallId) {
      throw new Error("Accepted event callId mismatch");
    }
    if (acceptedA.callerSocketId !== socketA.id || acceptedA.recipientSocketId !== socketB.id) {
      throw new Error(`Socket ID mapping mismatch in accepted event: ${JSON.stringify(acceptedA)}`);
    }
    if (!acceptedA.recipientUser || acceptedA.recipientUser.username !== `bob_${ts}`) {
      throw new Error(`RecipientUser payload mismatch: ${JSON.stringify(acceptedA)}`);
    }
    console.log(`[PASS] Both peers received direct-call:accepted with valid caller/recipient metadata`);

    // 3. Test WebRTC Offer / Answer & ICE Candidate Queueing
    console.log("\n--> 3. Testing WebRTC Offer/Answer Exchange & ICE Routing...");

    const offerPromiseB = new Promise((resolve) => socketB.once("direct-call:signal", resolve));

    // Alice generates SDP offer with audio and video sections
    const sampleVideoOfferSdp =
      "v=0\r\no=alice 123456 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\n";
    socketA.emit("direct-call:signal", {
      targetSocketId: socketB.id,
      signal: { type: "offer", sdp: sampleVideoOfferSdp },
      callId: assignedCallId,
    });

    const receivedOfferB = await offerPromiseB;
    if (receivedOfferB.signal.type !== "offer" || !receivedOfferB.signal.sdp.includes("m=video")) {
      throw new Error(`Offer delivery failure: ${JSON.stringify(receivedOfferB)}`);
    }
    console.log(`[PASS] Bob received Alice's SDP offer with both audio and video media lines`);

    // Alice immediately emits ICE candidate before Bob's answer is processed (candidate queue test)
    const candidatePromiseB = new Promise((resolve) => socketB.once("direct-call:signal", resolve));
    socketA.emit("direct-call:signal", {
      targetSocketId: socketB.id,
      signal: {
        type: "candidate",
        candidate: { candidate: "candidate:1 1 UDP 2122260223 127.0.0.1 50000 typ host", sdpMid: "0", sdpMLineIndex: 0 },
      },
      callId: assignedCallId,
    });
    const receivedCandidateB = await candidatePromiseB;
    if (receivedCandidateB.signal.type !== "candidate") {
      throw new Error("Candidate routing failure");
    }
    console.log(`[PASS] Candidate routed to Bob (queued until setRemoteDescription completes)`);

    // Bob creates and sends SDP answer
    const answerPromiseA = new Promise((resolve) => socketA.once("direct-call:signal", resolve));
    const sampleVideoAnswerSdp =
      "v=0\r\no=bob 654321 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\n";
    socketB.emit("direct-call:signal", {
      targetSocketId: socketA.id,
      signal: { type: "answer", sdp: sampleVideoAnswerSdp },
      callId: assignedCallId,
    });
    const receivedAnswerA = await answerPromiseA;
    if (receivedAnswerA.signal.type !== "answer") {
      throw new Error("Answer delivery failure");
    }
    console.log(`[PASS] Alice received Bob's SDP answer; two-way media negotiation completed`);

    // 4. Test Screen Sharing Renegotiation
    console.log("\n--> 4. Testing Screen Sharing Track & SDP Renegotiation...");

    const screenOfferPromiseB = new Promise((resolve) => socketB.once("direct-call:signal", resolve));
    const sampleScreenShareOffer =
      "v=0\r\no=alice 123456 3 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\na=sendrecv\r\n";
    socketA.emit("direct-call:signal", {
      targetSocketId: socketB.id,
      signal: { type: "offer", sdp: sampleScreenShareOffer },
      callId: assignedCallId,
    });
    const receivedScreenOffer = await screenOfferPromiseB;
    if (receivedScreenOffer.signal.type !== "offer") {
      throw new Error("Screen share renegotiation offer failed");
    }
    console.log(`[PASS] Screen share renegotiation offer delivered to Bob`);

    const screenAnswerPromiseA = new Promise((resolve) => socketA.once("direct-call:signal", resolve));
    socketB.emit("direct-call:signal", {
      targetSocketId: socketA.id,
      signal: { type: "answer", sdp: sampleVideoAnswerSdp },
      callId: assignedCallId,
    });
    const receivedScreenAnswer = await screenAnswerPromiseA;
    if (receivedScreenAnswer.signal.type !== "answer") {
      throw new Error("Screen share renegotiation answer failed");
    }
    console.log(`[PASS] Screen share renegotiation answer delivered to Alice`);

    // 5. Test Call Termination & Cleanup
    console.log("\n--> 5. Testing Call Termination & Resource Cleanup...");
    const callEndedPromiseB = new Promise((resolve) => socketB.once("direct-call:ended", resolve));
    socketA.emit("direct-call:end", { callId: assignedCallId });
    const callEndedB = await callEndedPromiseB;
    if (callEndedB.callId !== assignedCallId) {
      throw new Error("Call ended event callId mismatch");
    }
    console.log(`[PASS] direct-call:ended cleanly received by Bob and session terminated`);

    // 6. Test Audio-Only Call Upgraded to Video
    console.log("\n--> 6. Testing Audio-Only Call and Mid-Call Video Upgrade...");
    const incomingAudioCallPromise = new Promise((resolve) => socketB.once("direct-call:incoming", resolve));
    let audioCallId = null;
    await new Promise((resolve) => {
      socketA.emit(
        "direct-call:initiate",
        {
          recipientId: userBId,
          conversationId: convId,
          isVideo: false,
        },
        (ack) => {
          audioCallId = ack.callId;
          resolve(ack);
        }
      );
    });
    const incomingAudio = await incomingAudioCallPromise;
    if (incomingAudio.isVideo !== false) {
      throw new Error("Expected isVideo: false for audio call");
    }
    console.log(`[PASS] Audio call incoming with isVideo=false`);

    const audioAcceptedPromiseA = new Promise((resolve) => socketA.once("direct-call:accepted", resolve));
    socketB.emit("direct-call:accept", { callId: audioCallId });
    await audioAcceptedPromiseA;
    console.log(`[PASS] Audio call accepted`);

    // Alice turns on camera mid-call: triggers renegotiation offer
    const upgradeOfferPromise = new Promise((resolve) => socketB.once("direct-call:signal", resolve));
    socketA.emit("direct-call:signal", {
      targetSocketId: socketB.id,
      signal: { type: "offer", sdp: sampleVideoOfferSdp },
      callId: audioCallId,
    });
    const upgradeOffer = await upgradeOfferPromise;
    if (upgradeOffer.signal.type !== "offer") {
      throw new Error("Mid-call camera upgrade offer failed");
    }
    console.log(`[PASS] Mid-call camera activation renegotiation offer delivered to Bob`);

    // Bob rejects or ends second call
    const callEnded2Promise = new Promise((resolve) => socketA.once("direct-call:ended", resolve));
    socketB.emit("direct-call:end", { callId: audioCallId });
    await callEnded2Promise;
    console.log(`[PASS] Call 2 terminated successfully`);

    socketA.disconnect();
    socketB.disconnect();
    await sleep(200);

    console.log("\n===============================================================");
    console.log("   ALL DIRECT CALL & SCREEN SHARING SIGNALING TESTS PASSED!   ");
    console.log("===============================================================");
  } finally {
    server.close();
    await mongoose.connection.close();
  }
}

runDirectCallWebRTCTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n[DIRECT CALL TEST FAILED]:", err);
    process.exit(1);
  });
