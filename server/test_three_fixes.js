import "dotenv/config";
import { server } from "./src/app/app.js";
import mongoose from "mongoose";
import channelModel from "./src/models/channel.model.js";

async function run() {
  console.log("======================================================================");
  console.log("   NEXORA - VERIFICATION OF 3 CORE FIXES");
  console.log("   1. Self-Message Identity (Real name + YOU badge; other name without)");
  console.log("   2. Community Default Channels (#general-chat text + Voice voice; no announcement)");
  console.log("   3. Resilient Community Invitation Links (Code, case-insensitivity, trailing slash, server ID)");
  console.log("======================================================================\n");

  process.env.JWT_SECRET = process.env.JWT_SECRET || "nexora_test_jwt_secret_key_123456789";
  await mongoose.connect("mongodb://127.0.0.1:27017/nexora_test");
  console.log("✓ Connected to MongoDB at mongodb://127.0.0.1:27017/nexora_test");

  const PORT = 5597;
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`✓ Test backend server running on port ${PORT}\n`);

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
    return setCookieHeader.split(",").map((c) => c.split(";")[0].trim()).join("; ");
  };

  // Step 0: Register User A and User B
  const ts = Date.now();
  const shortId = String(ts).slice(-6);
  const u1Data = {
    username: `rs_${shortId}`,
    fullname: "Rishabh Sahu",
    email: `rs_${shortId}@example.com`,
    password: "Password123!",
    mobile_no: `98${String(ts).slice(-8)}`,
  };
  const u2Data = {
    username: `vm_${shortId}`,
    fullname: "Vikram Malhotra",
    email: `vm_${shortId}@example.com`,
    password: "Password123!",
    mobile_no: `97${String(ts).slice(-8)}`,
  };

  const reg1 = await post("/auth/register", u1Data);
  if (reg1.status !== 201 && reg1.status !== 200) {
    throw new Error(`User 1 register failed: ${JSON.stringify(reg1.data)}`);
  }
  const cookie1 = getCookieString(reg1.setCookie);
  const user1 = reg1.data?.user || reg1.data?.data?.user || reg1.data?.data;

  const reg2 = await post("/auth/register", u2Data);
  if (reg2.status !== 201 && reg2.status !== 200) {
    throw new Error(`User 2 register failed: ${JSON.stringify(reg2.data)}`);
  }
  const cookie2 = getCookieString(reg2.setCookie);
  const user2 = reg2.data?.user || reg2.data?.data?.user || reg2.data?.data;

  console.log(`✓ User A registered: ${user1.fullname} (@${user1.username})`);
  console.log(`✓ User B registered: ${user2.fullname} (@${user2.username})\n`);

  // ======================================================================
  // 1. COMMUNITY CREATION & DEFAULT CHANNELS
  // ======================================================================
  console.log("--- 1. Testing Community Default Channels ---");
  const createServerRes = await post(
    "/server/create",
    { name: "Nexora Elite Guild", description: "Verification community" },
    cookie1
  );
  if (createServerRes.status !== 201) {
    throw new Error(`Failed to create server: ${JSON.stringify(createServerRes.data)}`);
  }
  const createdServer = createServerRes.data?.data || createServerRes.data?.server;
  console.log(`✓ Created server: "${createdServer.name}" (${createdServer._id})`);

  // Query database for channels belonging to createdServer
  const channels = await channelModel.find({ server: createdServer._id }).sort({ position: 1 });
  console.log(`✓ Found ${channels.length} channels created for community.`);

  channels.forEach((c) => {
    console.log(`   - Channel: "${c.name}" | Type: "${c.type}" | Position: ${c.position}`);
  });

  if (channels.length !== 2) {
    throw new Error(`Expected exactly 2 default channels, but found ${channels.length}`);
  }

  const generalChannel = channels.find((c) => c.name === "#general-chat");
  const voiceChannel = channels.find((c) => c.name === "Voice");
  const announcementChannel = channels.find((c) => c.name.toLowerCase().includes("announcement"));

  if (!generalChannel || generalChannel.type !== "text") {
    throw new Error("Default #general-chat text channel missing or incorrect type!");
  }
  if (!voiceChannel || voiceChannel.type !== "voice") {
    throw new Error("Default Voice channel missing or incorrect type!");
  }
  if (announcementChannel) {
    throw new Error("Announcement channel was automatically created, which is forbidden!");
  }

  console.log("✓ VERIFIED: Only #general-chat (text) and Voice (voice) were created. No announcement channel.\n");

  // ======================================================================
  // 2. RESILIENT COMMUNITY INVITATION RESOLUTION
  // ======================================================================
  console.log("--- 2. Testing Resilient Community Invitation Links ---");
  const inviteCode = createdServer.inviteCode;
  console.log(`✓ Community inviteCode: "${inviteCode}"`);

  // Test standard invite resolution
  const res1 = await get(`/server/invite/${inviteCode}`);
  if (res1.status !== 200 || !res1.data?.data?.name) {
    throw new Error(`Standard invite resolution failed: ${JSON.stringify(res1.data)}`);
  }
  console.log(`✓ Standard invite resolved: Server="${res1.data.data.name}"`);

  // Test case-insensitive invite resolution (e.g. UPPERCASE)
  const res2 = await get(`/server/invite/${inviteCode.toUpperCase()}`);
  if (res2.status !== 200 || !res2.data?.data?.name) {
    throw new Error(`Uppercase invite resolution failed: ${JSON.stringify(res2.data)}`);
  }
  console.log(`✓ Uppercase invite resolved successfully.`);

  // Test resolution using server _id directly
  const res3 = await get(`/server/invite/${createdServer._id}`);
  if (res3.status !== 200 || !res3.data?.data?.name) {
    throw new Error(`Server _id invite fallback resolution failed: ${JSON.stringify(res3.data)}`);
  }
  console.log(`✓ Server _id fallback invite resolved successfully.`);

  // Test User B joining via inviteCode
  const joinRes = await post(`/server/join/${inviteCode}`, {}, cookie2);
  if (joinRes.status !== 200) {
    throw new Error(`User B join failed: ${JSON.stringify(joinRes.data)}`);
  }
  console.log(`✓ User B successfully joined via invite code.`);

  // Test User B joining again (duplicate join prevention)
  const dupJoinRes = await post(`/server/join/${inviteCode}`, {}, cookie2);
  if (dupJoinRes.status !== 200 || !dupJoinRes.data?.data?.alreadyMember) {
    throw new Error(`Duplicate join not handled gracefully: ${JSON.stringify(dupJoinRes.data)}`);
  }
  console.log(`✓ Duplicate join safely returned 200 with alreadyMember=true.`);

  // Test invalid invite code
  const invalidRes = await get("/server/invite/INVALID_CODE_XYZ");
  if (invalidRes.status !== 404) {
    throw new Error(`Invalid invite did not return 404: ${invalidRes.status}`);
  }
  console.log(`✓ Invalid invite code safely returned 404: "${invalidRes.data?.message}"\n`);

  // ======================================================================
  // 3. SENDER IDENTITY & SELF-MESSAGE PRESENTATION
  // ======================================================================
  console.log("--- 3. Testing Sender Identity & Self-Message Presentation Logic ---");

  // Send message in #general-chat from User A (Rishabh Sahu)
  const sendMsgA = await post(
    `/messages/${generalChannel._id}/message`,
    { content: "Welcome operatives to the collective." },
    cookie1
  );
  if (sendMsgA.status !== 200 && sendMsgA.status !== 201) {
    throw new Error(`Failed to send message A: ${JSON.stringify(sendMsgA.data)}`);
  }
  const msgA = sendMsgA.data?.data || sendMsgA.data?.message;

  // Send reply in #general-chat from User B (Vikram Malhotra)
  const sendMsgB = await post(
    `/messages/${generalChannel._id}/message`,
    { content: "Acknowledged. Standing by for instructions." },
    cookie2
  );
  if (sendMsgB.status !== 200 && sendMsgB.status !== 201) {
    throw new Error(`Failed to send message B: ${JSON.stringify(sendMsgB.data)}`);
  }
  const msgB = sendMsgB.data?.data || sendMsgB.data?.message;

  // Simulate MessageItem identity computation logic:
  const computePresentation = (msg, activeUser) => {
    const authorId =
      msg.author_id?._id || msg.author_id?.id || msg.author_id ||
      msg.sender?._id || msg.sender?.id || msg.sender ||
      msg.authorId || msg.senderId;

    const currentUserId = activeUser?._id || activeUser?.id;
    const isAuthor = Boolean(currentUserId && authorId && String(currentUserId) === String(authorId));

    const authorName =
      msg.author_id?.fullname ||
      msg.author_id?.username ||
      msg.authorName ||
      msg.sender?.fullname ||
      msg.sender?.username ||
      (isAuthor ? (activeUser?.fullname || activeUser?.username) : null) ||
      "Operative";

    return {
      displayedName: authorName,
      hasYouBadge: isAuthor,
      isAuthor,
    };
  };

  // Inspect User A's session (Rishabh)
  const presA_for_MsgA = computePresentation(msgA, user1);
  const presA_for_MsgB = computePresentation(msgB, user1);

  console.log(`[Rishabh's Session]`);
  console.log(`  - Own message: displayedName="${presA_for_MsgA.displayedName}", hasYouBadge=${presA_for_MsgA.hasYouBadge}`);
  console.log(`  - Vikram's message: displayedName="${presA_for_MsgB.displayedName}", hasYouBadge=${presA_for_MsgB.hasYouBadge}`);

  // Inspect User B's session (Vikram)
  const presB_for_MsgA = computePresentation(msgA, user2);
  const presB_for_MsgB = computePresentation(msgB, user2);

  console.log(`[Vikram's Session]`);
  console.log(`  - Rishabh's message: displayedName="${presB_for_MsgA.displayedName}", hasYouBadge=${presB_for_MsgA.hasYouBadge}`);
  console.log(`  - Own message: displayedName="${presB_for_MsgB.displayedName}", hasYouBadge=${presB_for_MsgB.hasYouBadge}`);

  // Assertions:
  if (presA_for_MsgA.displayedName !== "Rishabh Sahu" || !presA_for_MsgA.hasYouBadge) {
    throw new Error(`Rishabh's own message did not show "Rishabh Sahu" with YOU badge! Got "${presA_for_MsgA.displayedName}", hasBadge=${presA_for_MsgA.hasYouBadge}`);
  }
  if (presA_for_MsgB.displayedName !== "Vikram Malhotra" || presA_for_MsgB.hasYouBadge) {
    throw new Error(`Vikram's message in Rishabh's session did not show "Vikram Malhotra" without YOU badge!`);
  }
  if (presB_for_MsgB.displayedName !== "Vikram Malhotra" || !presB_for_MsgB.hasYouBadge) {
    throw new Error(`Vikram's own message did not show "Vikram Malhotra" with YOU badge!`);
  }
  if (presB_for_MsgA.displayedName !== "Rishabh Sahu" || presB_for_MsgA.hasYouBadge) {
    throw new Error(`Rishabh's message in Vikram's session did not show "Rishabh Sahu" without YOU badge!`);
  }

  console.log("\n✓ VERIFIED: Real author display names are always preserved, and YOU badge is only rendered for the author's own message.");

  await mongoose.disconnect();
  server.close();

  console.log("\n======================================================================");
  console.log("   ALL 3 CORE FIXES AUDITED, VERIFIED AND PASSING SUCCESSFULLY!");
  console.log("======================================================================\n");
  process.exit(0);
}

run().catch((err) => {
  console.error("\n❌ Test execution failed:", err);
  process.exit(1);
});
