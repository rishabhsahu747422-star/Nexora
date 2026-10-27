import "dotenv/config";
import { server } from "./src/app/app.js";
import mongoose from "mongoose";
import { io as ClientIO } from "../Client/node_modules/socket.io-client/build/esm/index.js";

async function run() {
  console.log("=== Nexora Complete End-to-End Test (Connections + Realtime DMs) ===");
  process.env.JWT_SECRET = process.env.JWT_SECRET || "nexora_test_jwt_secret_key_123456789";
  await mongoose.connect("mongodb://127.0.0.1:27017/nexora_test");
  console.log("Connected to MongoDB at 127.0.0.1:27017/nexora_test");

  const PORT = 5599;
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Test server running on port ${PORT}`);

  const BASE_URL = `http://localhost:${PORT}/api`;

  const post = async (url, body, cookie = "") => {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify(body),
    });
    const setCookie = res.headers.get("set-cookie");
    const data = await res.json().catch(() => null);
    return { status: res.status, data, setCookie };
  };

  const get = async (url, cookie = "") => {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: "GET",
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
      },
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  };

  const getCookieString = (setCookieHeader) => {
    if (!setCookieHeader) return "";
    return setCookieHeader.split(",").map(c => c.split(";")[0].trim()).join("; ");
  };

  const timestamp = Date.now();
  const u1Data = {
    username: `alpha_${timestamp}`,
    fullname: "Alpha Operative",
    email: `alpha_${timestamp}@example.com`,
    password: "Password123!",
    mobile_no: "9876543110",
  };
  const u2Data = {
    username: `beta_${timestamp}`,
    fullname: "Beta Operative",
    email: `beta_${timestamp}@example.com`,
    password: "Password123!",
    mobile_no: "9876543111",
  };

  let socketA = null;
  let socketB = null;

  try {
    // 1. Register & login User A
    console.log("\n[1] Registering & logging in User A...");
    await post("/auth/register", u1Data);
    const log1 = await post("/auth/login", { email: u1Data.email, password: u1Data.password });
    const cookie1 = getCookieString(log1.setCookie);
    const userAId = log1.data?.user?._id;
    console.log(`    User A registered & logged in (ID: ${userAId}, Username: @${u1Data.username})`);

    // 2. Register & login User B
    console.log("\n[2] Registering & logging in User B...");
    await post("/auth/register", u2Data);
    const log2 = await post("/auth/login", { email: u2Data.email, password: u2Data.password });
    const cookie2 = getCookieString(log2.setCookie);
    const userBId = log2.data?.user?._id;
    console.log(`    User B registered & logged in (ID: ${userBId}, Username: @${u2Data.username})`);

    // 3. Connect User A and User B sockets
    console.log("\n[3] Connecting Socket.IO clients for User A and User B...");
    socketA = ClientIO(`http://localhost:${PORT}`, {
      transportOptions: { polling: { extraHeaders: { Cookie: cookie1 } } },
      extraHeaders: { Cookie: cookie1 },
    });
    socketB = ClientIO(`http://localhost:${PORT}`, {
      transportOptions: { polling: { extraHeaders: { Cookie: cookie2 } } },
      extraHeaders: { Cookie: cookie2 },
    });

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
    console.log("    Both sockets connected successfully!");

    // Set up socket listeners
    let userBReceivedReq = null;
    socketB.on("connection:request-received", (data) => {
      userBReceivedReq = data;
    });

    let userAReceivedAccept = null;
    socketA.on("connection:request-accepted", (data) => {
      userAReceivedAccept = data;
    });

    const userBMessages = [];
    socketB.on("direct-message:new", (msg) => {
      userBMessages.push(msg);
    });

    const userAMessages = [];
    socketA.on("direct-message:new", (msg) => {
      userAMessages.push(msg);
    });

    // 4. Test self-request validation
    console.log("\n[4] Testing self-request prevention...");
    const selfRes = await post("/connections/request", { username: u1Data.username }, cookie1);
    if (selfRes.status === 400) {
      console.log("    Self-request properly rejected (400 Bad Request)");
    } else {
      throw new Error(`Self-request was not rejected! Status: ${selfRes.status}`);
    }

    // 5. User A sends connection request to User B
    console.log(`\n[5] User A sending connection request to @${u2Data.username}...`);
    const sendReqRes = await post("/connections/request", { username: u2Data.username }, cookie1);
    if (sendReqRes.status !== 201) {
      throw new Error(`Failed to send request: ${JSON.stringify(sendReqRes.data)}`);
    }
    console.log("    Connection request sent successfully (201 Created)");

    // Test duplicate request prevention
    const dupRes = await post("/connections/request", { username: u2Data.username }, cookie1);
    if (dupRes.status === 400 || dupRes.status === 409) {
      console.log("    Duplicate request properly rejected (Status " + dupRes.status + ")");
    }

    await new Promise((r) => setTimeout(r, 600));
    if (!userBReceivedReq) {
      throw new Error("User B did not receive realtime 'connection:request-received' socket event!");
    }
    console.log("    User B received realtime socket event: connection:request-received");

    // 6. User B inspects incoming requests and accepts
    console.log("\n[6] User B inspecting incoming requests and accepting...");
    const pendingB = await get("/connections", cookie2);
    const incoming = pendingB.data?.data?.incomingRequests || [];
    if (incoming.length !== 1) {
      throw new Error(`Expected 1 incoming request for User B, got ${incoming.length}`);
    }
    const reqId = incoming[0].id;
    console.log(`    Found incoming request ID: ${reqId}`);

    const acceptRes = await post(`/connections/request/${reqId}/accept`, {}, cookie2);
    if (acceptRes.status !== 200) {
      throw new Error(`Failed to accept request: ${JSON.stringify(acceptRes.data)}`);
    }
    console.log("    User B accepted request (200 OK)");

    await new Promise((r) => setTimeout(r, 600));
    if (!userAReceivedAccept) {
      throw new Error("User A did not receive realtime 'connection:request-accepted' socket event!");
    }
    console.log("    User A received realtime socket event: connection:request-accepted");

    // 7. Open/Create DM Conversation between User A and User B
    console.log("\n[7] Creating/Opening DM conversation...");
    const dmRes = await post("/conversations", { recipientId: userBId }, cookie1);
    if (dmRes.status !== 200 && dmRes.status !== 201) {
      throw new Error(`Failed to create DM conversation: ${JSON.stringify(dmRes.data)}`);
    }
    const conversationId = dmRes.data?.data?._id || dmRes.data?.conversation?._id || dmRes.data?._id;
    console.log(`    DM conversation active with ID: ${conversationId}`);

    // 8. User A sends a message to User B
    console.log("\n[8] User A sending message to User B...");
    const msg1Res = await post(
      `/conversations/${conversationId}/messages`,
      { content: "Hey User B, this is User A. Transmission test!" },
      cookie1
    );
    if (msg1Res.status !== 201 && msg1Res.status !== 200) {
      throw new Error(`User A failed to send message: ${JSON.stringify(msg1Res.data)}`);
    }
    console.log("    Message sent by User A (Status " + msg1Res.status + ")");

    await new Promise((r) => setTimeout(r, 600));
    const receivedByB = userBMessages.find((m) => m.content === "Hey User B, this is User A. Transmission test!");
    if (!receivedByB) {
      throw new Error(`User B did not receive realtime message! Events: ${JSON.stringify(userBMessages)}`);
    }
    console.log(`    User B received realtime message: "${receivedByB.content}"`);

    // 9. User B replies to User A
    console.log("\n[9] User B replying to User A...");
    const msg2Res = await post(
      `/conversations/${conversationId}/messages`,
      { content: "Transmission confirmed User A! I hear you loud and clear." },
      cookie2
    );
    if (msg2Res.status !== 201 && msg2Res.status !== 200) {
      throw new Error(`User B failed to reply: ${JSON.stringify(msg2Res.data)}`);
    }
    console.log("    Reply sent by User B (Status " + msg2Res.status + ")");

    await new Promise((r) => setTimeout(r, 600));
    const receivedByA = userAMessages.find((m) => m.content === "Transmission confirmed User A! I hear you loud and clear.");
    if (!receivedByA) {
      throw new Error(`User A did not receive realtime reply! Events: ${JSON.stringify(userAMessages)}`);
    }
    console.log(`    User A received realtime reply: "${receivedByA.content}"`);

    // 10. Verify message history persistence on reload
    console.log("\n[10] Verifying message persistence and history loading...");
    const historyA = await get(`/conversations/${conversationId}/messages`, cookie1);
    const historyB = await get(`/conversations/${conversationId}/messages`, cookie2);

    const msgsA = historyA.data?.data || historyA.data?.messages || historyA.data || [];
    const msgsB = historyB.data?.data || historyB.data?.messages || historyB.data || [];

    if (msgsA.length !== 2 || msgsB.length !== 2) {
      throw new Error(`Message count mismatch in history! A: ${msgsA.length}, B: ${msgsB.length}`);
    }

    console.log(`    Message history intact: 2 messages stored and loaded correctly.`);
    console.log(`    Message 1: [${msgsA[0].author_id?.username || msgsA[0].author_id}] ${msgsA[0].content}`);
    console.log(`    Message 2: [${msgsA[1].author_id?.username || msgsA[1].author_id}] ${msgsA[1].content}`);

    console.log("\n========================================================");
    console.log(">>> ALL END-TO-END CONNECTION & DM TESTS PASSED (100%) <<<");
    console.log("========================================================\n");
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err);
    process.exit(1);
  } finally {
    if (socketA) socketA.disconnect();
    if (socketB) socketB.disconnect();
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
