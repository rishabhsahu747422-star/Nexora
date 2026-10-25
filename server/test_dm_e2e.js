import "dotenv/config";
import { server } from "./src/app/app.js";
import { connectDb } from "./src/config/db.js";
import mongoose from "mongoose";

async function run() {
  console.log("Starting Nexora Direct Messaging Integration Test...");
  await connectDb();

  const PORT = 5577;
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

  const del = async (url, cookie = "") => {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: "DELETE",
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
    username: `dm_u1_${timestamp}`,
    fullname: "Alice Operative",
    email: `dm_u1_${timestamp}@example.com`,
    password: "Password123!",
    mobile_no: "9876543220",
  };
  const u2Data = {
    username: `dm_u2_${timestamp}`,
    fullname: "Bob Operative",
    email: `dm_u2_${timestamp}@example.com`,
    password: "Password123!",
    mobile_no: "9876543221",
  };
  const u3Data = {
    username: `dm_u3_${timestamp}`,
    fullname: "Eve Intruder",
    email: `dm_u3_${timestamp}@example.com`,
    password: "Password123!",
    mobile_no: "9876543222",
  };

  try {
    // 1. Register & login Alice (User 1)
    console.log("1. Registering Alice...");
    const reg1 = await post("/auth/register", u1Data);
    if (reg1.status !== 200 && reg1.status !== 201) throw new Error("Alice reg failed");
    const log1 = await post("/auth/login", { email: u1Data.email, password: u1Data.password });
    const cookie1 = getCookieString(log1.setCookie);
    const aliceId = log1.data?.user?._id;
    console.log("   Alice logged in. ID:", aliceId);

    // 2. Register & login Bob (User 2)
    console.log("2. Registering Bob...");
    const reg2 = await post("/auth/register", u2Data);
    if (reg2.status !== 200 && reg2.status !== 201) throw new Error("Bob reg failed");
    const log2 = await post("/auth/login", { email: u2Data.email, password: u2Data.password });
    const cookie2 = getCookieString(log2.setCookie);
    const bobId = log2.data?.user?._id;
    console.log("   Bob logged in. ID:", bobId);

    // 3. Register & login Eve (User 3)
    console.log("3. Registering Eve...");
    const reg3 = await post("/auth/register", u3Data);
    if (reg3.status !== 200 && reg3.status !== 201) throw new Error("Eve reg failed");
    const log3 = await post("/auth/login", { email: u3Data.email, password: u3Data.password });
    const cookie3 = getCookieString(log3.setCookie);
    console.log("   Eve logged in.");

    // 4. Test self-DM rejection
    console.log("4. Testing self-DM rejection...");
    const selfDm = await post("/conversations", { recipientId: aliceId }, cookie1);
    console.log("   Self DM status:", selfDm.status, "(Expected 400)");
    if (selfDm.status !== 400) throw new Error("Self-DM should be rejected with 400");

    // 5. Alice starts DM with Bob
    console.log("5. Alice creating DM with Bob...");
    const createDmRes = await post("/conversations", { recipientId: bobId }, cookie1);
    console.log("   Create DM status:", createDmRes.status, "Conversation ID:", createDmRes.data?.data?._id);
    if (createDmRes.status !== 201 && createDmRes.status !== 200) throw new Error("Failed to create DM");
    const convId = createDmRes.data?.data?._id;

    // 6. Test duplicate prevention: Bob opens DM with Alice
    console.log("6. Bob opening DM with Alice (checking duplicate prevention)...");
    const dupRes = await post("/conversations", { recipientId: aliceId }, cookie2);
    console.log("   Bob open DM status:", dupRes.status, "Conversation ID:", dupRes.data?.data?._id);
    if (dupRes.data?.data?._id !== convId) {
      throw new Error(`Duplicate conversation created! Expected ${convId}, got ${dupRes.data?.data?._id}`);
    }
    console.log("   [PASS] Exact same conversation returned, zero duplication!");

    // 7. Alice sends message to Bob
    console.log("7. Alice sending direct transmission to Bob...");
    const msg1Res = await post(`/conversations/${convId}/messages`, { content: "Transmission alpha: Hello Bob!" }, cookie1);
    console.log("   Alice send status:", msg1Res.status, "Message ID:", msg1Res.data?.data?._id);
    if (msg1Res.status !== 201 && msg1Res.status !== 200) throw new Error("Alice failed to send DM");
    const msg1Id = msg1Res.data?.data?._id;

    // 8. Bob sends reply to Alice
    console.log("8. Bob sending reply to Alice...");
    const msg2Res = await post(`/conversations/${convId}/messages`, { content: "Transmission beta: Roger that, Alice!" }, cookie2);
    console.log("   Bob send status:", msg2Res.status, "Message ID:", msg2Res.data?.data?._id);
    if (msg2Res.status !== 201 && msg2Res.status !== 200) throw new Error("Bob failed to send DM");

    // 9. Fetch message history for conversation
    console.log("9. Fetching conversation messages (Bob reading history)...");
    const histRes = await get(`/conversations/${convId}/messages`, cookie2);
    console.log("   History status:", histRes.status, "Count:", histRes.data?.data?.length);
    if (histRes.status !== 200 || histRes.data?.data?.length !== 2) throw new Error("History length mismatch");
    console.log("   First message author:", histRes.data?.data?.[0]?.author_id?.fullname);
    console.log("   Second message author:", histRes.data?.data?.[1]?.author_id?.fullname);

    // 10. Fetch conversation lists
    console.log("10. Fetching Alice's and Bob's conversation list...");
    const list1 = await get("/conversations", cookie1);
    const list2 = await get("/conversations", cookie2);
    console.log("   Alice conv count:", list1.data?.data?.length, "Last message:", list1.data?.data?.[0]?.lastMessage?.content);
    console.log("   Bob conv count:", list2.data?.data?.length, "Last message:", list2.data?.data?.[0]?.lastMessage?.content);
    if (list1.data?.data?.length !== 1 || list2.data?.data?.length !== 1) throw new Error("Conversation list mismatch");

    // 11. Security Check: Eve (unauthorized 3rd user) attempts to access conversation
    console.log("11. Security Test: Eve attempting unauthorized access to Alice & Bob's conversation...");
    const eveAccessConv = await get(`/conversations/${convId}`, cookie3);
    console.log("   Eve view conv status:", eveAccessConv.status, "(Expected 403)");
    if (eveAccessConv.status !== 403) throw new Error("Eve was not blocked from viewing conversation!");

    const eveAccessMsgs = await get(`/conversations/${convId}/messages`, cookie3);
    console.log("   Eve view messages status:", eveAccessMsgs.status, "(Expected 403)");
    if (eveAccessMsgs.status !== 403) throw new Error("Eve was not blocked from reading messages!");

    const eveSendMsg = await post(`/conversations/${convId}/messages`, { content: "Intruder payload" }, cookie3);
    console.log("   Eve send message status:", eveSendMsg.status, "(Expected 403)");
    if (eveSendMsg.status !== 403) throw new Error("Eve was not blocked from sending message!");
    console.log("   [PASS] All unauthorized access attempts successfully rejected with 403 Forbidden!");

    // 12. Message Deletion Authorization Check
    console.log("12. Message Deletion Authorization...");
    // Bob tries to delete Alice's message (must fail with 403)
    const bobDelAliceMsg = await del(`/conversations/${convId}/messages/${msg1Id}`, cookie2);
    console.log("   Bob delete Alice's message status:", bobDelAliceMsg.status, "(Expected 403)");
    if (bobDelAliceMsg.status !== 403) throw new Error("Bob should not be able to delete Alice's message");

    // Alice deletes her own message (must succeed with 200)
    const aliceDelMsg = await del(`/conversations/${convId}/messages/${msg1Id}`, cookie1);
    console.log("   Alice delete own message status:", aliceDelMsg.status, "(Expected 200)");
    if (aliceDelMsg.status !== 200) throw new Error("Alice failed to delete own message");

    // Verify messages count is now 1
    const postDelHist = await get(`/conversations/${convId}/messages`, cookie1);
    console.log("   Messages count after deletion:", postDelHist.data?.data?.length, "(Expected 1)");
    if (postDelHist.data?.data?.length !== 1) throw new Error("Message was not deleted from DB");

    // 13. Verify channel messaging concurrently works without interference
    console.log("13. Concurrency check: Verifying server channels still work independently...");
    const srvRes = await post("/server/create", { name: `Server_${timestamp}`, isPublic: true }, cookie1);
    const serverId = srvRes.data?.data?._id || srvRes.data?.server?._id;
    const chanRes = await post(`/channel/${serverId}/channels`, { name: "dm-coexist-channel", type: "text" }, cookie1);
    const chanId = chanRes.data?.data?._id;
    const chanMsg = await post(`/messages/${chanId}/message`, { content: "Channel message parallel to DMs" }, cookie1);
    console.log("   Channel message status:", chanMsg.status, "ID:", chanMsg.data?.data?._id);
    if (chanMsg.status !== 200 && chanMsg.status !== 201) throw new Error("Channel messaging failed");

    // Clean up test server
    await del(`/server/${serverId}`, cookie1);

    console.log("\n=================================================================");
    console.log(">>> ALL DIRECT MESSAGING & SECURITY TESTS PASSED PERFECTLY! <<<");
    console.log("=================================================================\n");
  } catch (err) {
    console.error("DM TEST FAILED:", err);
    process.exit(1);
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
