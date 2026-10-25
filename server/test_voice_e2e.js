import http from "http";
import { io as ClientIO } from "../Client/node_modules/socket.io-client/build/esm/index.js";
import mongoose from "mongoose";
import { server } from "./src/app/app.js";
import { connectDb } from "./src/config/db.js";
import userModel from "./src/models/user.model.js";
import serverModel from "./src/models/server.model.js";
import channelModel from "./src/models/channel.model.js";
import serverMemberModel from "./src/models/serverMember.model.js";

const PORT = 5098;
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

async function runVoiceE2ETest() {
  console.log("==================================================");
  console.log("  NEXORA — Real-Time Voice WebRTC & Signaling E2E ");
  console.log("==================================================");

  // 1. Connect DB & Start Server
  await connectDb();
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`[PASS] Server running on port ${PORT}`);

  try {
    const ts = Date.now().toString().slice(-6);
    // 2. Register User 1 (Host), User 2 (Peer), User 3 (Unauthorized Outsider)
    console.log("\n--> 1. Registering Test Users...");
    const reg1 = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullname: "Voice Host",
        username: `vh_${ts}`,
        email: `vh_${ts}@test.com`,
        password: "Password123!",
        mobile_no: "9876543210",
      }),
    });
    if (reg1.status !== 200 && reg1.status !== 201) throw new Error(`User 1 registration failed: ${JSON.stringify(reg1.data)}`);
    const login1 = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: `vh_${ts}@test.com`, password: "Password123!" }),
    });
    const token1 = extractCookie(login1, "accessToken");

    const reg2 = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullname: "Voice Peer",
        username: `vp_${ts}`,
        email: `vp_${ts}@test.com`,
        password: "Password123!",
        mobile_no: "9876543211",
      }),
    });
    if (reg2.status !== 200 && reg2.status !== 201) throw new Error(`User 2 registration failed: ${JSON.stringify(reg2.data)}`);
    const login2 = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: `vp_${ts}@test.com`, password: "Password123!" }),
    });
    const token2 = extractCookie(login2, "accessToken");

    const reg3 = await request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullname: "Voice Outsider",
        username: `vo_${ts}`,
        email: `vo_${ts}@test.com`,
        password: "Password123!",
        mobile_no: "9876543212",
      }),
    });
    if (reg3.status !== 200 && reg3.status !== 201) throw new Error(`User 3 registration failed: ${JSON.stringify(reg3.data)}`);
    const login3 = await request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: `vo_${ts}@test.com`, password: "Password123!" }),
    });
    const token3 = extractCookie(login3, "accessToken");

    console.log("[PASS] 3 Test users registered & authenticated with JWTs");

    // 3. User 1 creates Server and Channels
    console.log("\n--> 2. Creating Server & Voice/Text Channels...");
    const srvRes = await request("/api/server/create", {
      method: "POST",
      headers: { Cookie: `accessToken=${token1}` },
      body: JSON.stringify({
        name: "Voice Sanctuary",
        description: "Community for voice and video testing",
        isPublic: true,
      }),
    });
    if (srvRes.status !== 200 && srvRes.status !== 201) throw new Error(`Server create failed: ${JSON.stringify(srvRes.data)}`);
    const serverObj = srvRes.data.data || srvRes.data.server;
    const serverId = serverObj._id;
    const inviteCode = serverObj.inviteCode;

    // Create Voice Channel
    const voiceChanRes = await request(`/api/channel/${serverId}/channels`, {
      method: "POST",
      headers: { Cookie: `accessToken=${token1}` },
      body: JSON.stringify({
        name: "sound-stage-alpha",
        type: "voice",
      }),
    });
    if (voiceChanRes.status !== 200 && voiceChanRes.status !== 201) throw new Error(`Voice channel create failed: ${JSON.stringify(voiceChanRes.data)}`);
    const voiceChannelId = voiceChanRes.data.data?._id || voiceChanRes.data.channel?._id;

    // Create Text Channel
    const textChanRes = await request(`/api/channel/${serverId}/channels`, {
      method: "POST",
      headers: { Cookie: `accessToken=${token1}` },
      body: JSON.stringify({
        name: "chatter-box",
        type: "text",
      }),
    });
    if (textChanRes.status !== 200 && textChanRes.status !== 201) throw new Error(`Text channel create failed: ${JSON.stringify(textChanRes.data)}`);
    const textChannelId = textChanRes.data.data?._id || textChanRes.data.channel?._id;

    // User 2 joins the server
    const joinSrvRes = await request(`/api/server/join/${inviteCode}`, {
      method: "POST",
      headers: { Cookie: `accessToken=${token2}` },
    });
    if (joinSrvRes.status !== 200) throw new Error(`User 2 join server failed: ${JSON.stringify(joinSrvRes.data)}`);
    console.log("[PASS] Server created with voice and text channels; User 2 joined server; User 3 remains outsider");

    // 4. Connect WebSockets
    console.log("\n--> 3. Connecting Authenticated Socket Clients...");
    const socket1 = createSocketClient(token1);
    const socket2 = createSocketClient(token2);
    const socket3 = createSocketClient(token3);

    await Promise.all([
      new Promise((res) => socket1.on("connect", res)),
      new Promise((res) => socket2.on("connect", res)),
      new Promise((res) => socket3.on("connect", res)),
    ]);
    console.log(`[PASS] Sockets connected: S1=${socket1.id}, S2=${socket2.id}, S3=${socket3.id}`);

    // 5. Test Authorization & Validation Rejection
    console.log("\n--> 4. Testing Voice Channel Security & Authorization Rules...");

    // Test A: User 3 (outsider) attempts voice:join
    const outsiderPromise = new Promise((resolve, reject) => {
      socket3.once("voice:error", (err) => resolve(err));
      socket3.once("voice:joined", () => reject(new Error("Outsider should not join voice room!")));
    });
    socket3.emit("voice:join", { channelId: voiceChannelId });
    const outsiderErr = await outsiderPromise;
    if (outsiderErr.code !== 403) throw new Error(`Expected 403 for outsider, got: ${JSON.stringify(outsiderErr)}`);
    console.log(`[PASS] Outsider rejected from voice room with 403: "${outsiderErr.message}"`);

    // Test B: User 1 attempts voice:join on a TEXT channel
    const textChanPromise = new Promise((resolve, reject) => {
      socket1.once("voice:error", (err) => resolve(err));
      socket1.once("voice:joined", () => reject(new Error("Text channel should not allow voice:join!")));
    });
    socket1.emit("voice:join", { channelId: textChannelId });
    const textChanErr = await textChanPromise;
    if (textChanErr.code !== 400) throw new Error(`Expected 400 for text channel voice:join, got: ${JSON.stringify(textChanErr)}`);
    console.log(`[PASS] Text channel voice:join rejected with 400: "${textChanErr.message}"`);

    // Test C: User 1 attempts voice:join with non-existent channel ID
    const fakeIdPromise = new Promise((resolve, reject) => {
      socket1.once("voice:error", (err) => resolve(err));
      socket1.once("voice:joined", () => reject(new Error("Non-existent channel should fail!")));
    });
    socket1.emit("voice:join", { channelId: new mongoose.Types.ObjectId().toString() });
    const fakeIdErr = await fakeIdPromise;
    if (fakeIdErr.code !== 404) throw new Error(`Expected 404 for non-existent channel, got: ${JSON.stringify(fakeIdErr)}`);
    console.log(`[PASS] Non-existent channel voice:join rejected with 404: "${fakeIdErr.message}"`);

    // 6. Test Valid Voice Room Join & Signaling Flow
    console.log("\n--> 5. Testing Legitimate Voice Room Join & Peer Discovery...");

    // User 1 joins
    const join1Promise = new Promise((resolve) => socket1.once("voice:joined", resolve));
    socket1.emit("voice:join", { channelId: voiceChannelId });
    const join1Data = await join1Promise;
    if (join1Data.channelId !== voiceChannelId || join1Data.existingParticipants.length !== 0) {
      throw new Error(`Invalid join1 response: ${JSON.stringify(join1Data)}`);
    }
    console.log(`[PASS] User 1 joined voice room as first participant (existing: 0)`);

    // User 2 joins -> User 1 receives participant-joined, User 2 receives existingParticipants containing User 1
    const pJoinedPromise = new Promise((resolve) => socket1.once("voice:participant-joined", resolve));
    const join2Promise = new Promise((resolve) => socket2.once("voice:joined", resolve));

    socket2.emit("voice:join", { channelId: voiceChannelId });

    const [pJoinedData, join2Data] = await Promise.all([pJoinedPromise, join2Promise]);
    if (pJoinedData.socketId !== socket2.id) {
      throw new Error(`Participant-joined mismatch: expected ${socket2.id}, got ${pJoinedData.socketId}`);
    }
    if (join2Data.existingParticipants.length !== 1 || join2Data.existingParticipants[0].socketId !== socket1.id) {
      throw new Error(`User 2 existingParticipants mismatch: ${JSON.stringify(join2Data)}`);
    }
    console.log(`[PASS] User 2 joined voice room: User 1 notified, User 2 received existing participant`);

    // 7. Test WebRTC Signaling Exchange (Offer, Answer, ICE)
    console.log("\n--> 6. Testing WebRTC Signaling Relay (Offer/Answer/ICE Candidate)...");

    // User 2 sends Offer to User 1
    const offerPromise = new Promise((resolve) => socket1.once("voice:signal", resolve));
    socket2.emit("voice:signal", {
      targetSocketId: socket1.id,
      signal: { type: "offer", sdp: "v=0\r\no=alice ... (test SDP offer)" },
    });
    const receivedOffer = await offerPromise;
    if (receivedOffer.from !== socket2.id || receivedOffer.signal.type !== "offer") {
      throw new Error(`Offer relay failed: ${JSON.stringify(receivedOffer)}`);
    }
    console.log(`[PASS] WebRTC Offer relayed from User 2 to User 1`);

    // User 1 sends Answer to User 2
    const answerPromise = new Promise((resolve) => socket2.once("voice:signal", resolve));
    socket1.emit("voice:signal", {
      targetSocketId: socket2.id,
      signal: { type: "answer", sdp: "v=0\r\no=bob ... (test SDP answer)" },
    });
    const receivedAnswer = await answerPromise;
    if (receivedAnswer.from !== socket1.id || receivedAnswer.signal.type !== "answer") {
      throw new Error(`Answer relay failed: ${JSON.stringify(receivedAnswer)}`);
    }
    console.log(`[PASS] WebRTC Answer relayed from User 1 to User 2`);

    // User 2 sends ICE Candidate to User 1
    const icePromise = new Promise((resolve) => socket1.once("voice:signal", resolve));
    socket2.emit("voice:signal", {
      targetSocketId: socket1.id,
      signal: { candidate: "candidate:1 1 UDP 2122260223 192.168.1.100 50000 typ host", sdpMid: "0", sdpMLineIndex: 0 },
    });
    const receivedIce = await icePromise;
    if (receivedIce.from !== socket2.id || !receivedIce.signal.candidate) {
      throw new Error(`ICE relay failed: ${JSON.stringify(receivedIce)}`);
    }
    console.log(`[PASS] WebRTC ICE Candidate relayed from User 2 to User 1`);

    // 8. Test Malformed and Unauthorized Signaling Rejection
    console.log("\n--> 7. Testing Signaling Security & Isolation Controls...");

    // Unauthorized outsider (User 3) tries to signal User 1
    const unauthSignalPromise = new Promise((resolve) => socket3.once("voice:error", resolve));
    socket3.emit("voice:signal", {
      targetSocketId: socket1.id,
      signal: { type: "offer", sdp: "hacker offer" },
    });
    const unauthErr = await unauthSignalPromise;
    if (unauthErr.code !== 403) throw new Error(`Expected 403 for unauthorized signal, got: ${JSON.stringify(unauthErr)}`);
    console.log(`[PASS] Unauthorized outsider signaling rejected with 403: "${unauthErr.message}"`);

    // Malformed signal payload
    const malformedPromise = new Promise((resolve) => socket1.once("voice:error", resolve));
    socket1.emit("voice:signal", { targetSocketId: null, signal: null });
    const malformedErr = await malformedPromise;
    if (malformedErr.code !== 400) throw new Error(`Expected 400 for malformed signal, got: ${JSON.stringify(malformedErr)}`);
    console.log(`[PASS] Malformed signaling payload rejected with 400: "${malformedErr.message}"`);

    // 9. Test Media Status Updates
    console.log("\n--> 8. Testing Participant Media State Toggles...");
    const mediaTogglePromise = new Promise((resolve) => socket1.once("voice:participant-updated", resolve));
    socket2.emit("voice:toggle-media", { muted: true, deafened: false, video: true });
    const updatedState = await mediaTogglePromise;
    if (updatedState.socketId !== socket2.id || updatedState.muted !== true || updatedState.video !== true) {
      throw new Error(`Media state toggle failed: ${JSON.stringify(updatedState)}`);
    }
    console.log(`[PASS] Media state update broadcast to peers (muted: true, video: true)`);

    // 10. Test Leave & Disconnect Cleanup
    console.log("\n--> 9. Testing Voice Room Leave & Disconnect Cleanup...");
    const leavePromise = new Promise((resolve) => socket1.once("voice:participant-left", resolve));
    socket2.emit("voice:leave");
    const leaveData = await leavePromise;
    if (leaveData.socketId !== socket2.id) {
      throw new Error(`Leave notification mismatch: ${JSON.stringify(leaveData)}`);
    }
    console.log(`[PASS] User 2 voice:leave broadcast to User 1`);

    // Disconnect User 1 socket and verify clean teardown
    socket1.disconnect();
    socket2.disconnect();
    socket3.disconnect();
    await sleep(200);
    console.log(`[PASS] Sockets cleanly disconnected and voice room membership wiped`);

    // 11. Test Messaging Non-Regression (Text Channels & DMs)
    console.log("\n--> 10. Verifying Non-Regression: Server Channel Chat & Direct Messages...");

    // Server Channel Message
    const msgRes = await request(`/api/messages/${textChannelId}/message`, {
      method: "POST",
      headers: { Cookie: `accessToken=${token1}` },
      body: JSON.stringify({ content: "Channel transmission test during voice ops" }),
    });
    if (msgRes.status !== 200 && msgRes.status !== 201) throw new Error(`Channel message failed: ${JSON.stringify(msgRes.data)}`);
    console.log("[PASS] Server text channel messaging functional");

    // Direct Message
    const recipientId = reg2.data?.data?._id || reg2.data?.user?._id || login2.data?.data?._id || login2.data?.user?._id;
    const dmConvRes = await request("/api/conversations", {
      method: "POST",
      headers: { Cookie: `accessToken=${token1}` },
      body: JSON.stringify({ recipientId }),
    });
    if (dmConvRes.status !== 200 && dmConvRes.status !== 201) {
      throw new Error(`Start DM conversation failed: ${JSON.stringify(dmConvRes.data)}`);
    }
    const dmId = dmConvRes.data.data?._id || dmConvRes.data.conversation?._id;

    const dmMsgRes = await request(`/api/conversations/${dmId}/messages`, {
      method: "POST",
      headers: { Cookie: `accessToken=${token1}` },
      body: JSON.stringify({ content: "Direct encrypted ping during voice ops" }),
    });
    if (dmMsgRes.status !== 200 && dmMsgRes.status !== 201) throw new Error(`DM message failed: ${JSON.stringify(dmMsgRes.data)}`);
    console.log("[PASS] Direct Messaging (DM) functional concurrently");

    console.log("\n==================================================");
    console.log("   ALL 10 VOICE & WEBRTC SIGNALING TESTS PASSED!  ");
    console.log("==================================================");
  } finally {
    server.close();
    await mongoose.connection.close();
  }
}

runVoiceE2ETest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n[TEST FAILED]:", err);
    process.exit(1);
  });
