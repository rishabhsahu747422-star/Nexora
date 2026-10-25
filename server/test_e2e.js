import "dotenv/config";
import { server } from "./src/app/app.js";
import { connectDb } from "./src/config/db.js";
import mongoose from "mongoose";

async function run() {
  console.log("Starting Nexora E2E Integration Test...");
  await connectDb();

  const PORT = 5566;
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Test server running on port ${PORT}`);

  const BASE_URL = `http://localhost:${PORT}/api`;

  let cookie1 = "";
  let cookie2 = "";

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

  const patch = async (url, body, cookie = "") => {
    const res = await fetch(`${BASE_URL}${url}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify(body),
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
  const u1 = {
    username: `u1_${timestamp}`,
    fullname: "Test User One",
    email: `u1_${timestamp}@example.com`,
    password: "Password123!",
    mobile_no: "9876543210",
  };
  const u2 = {
    username: `u2_${timestamp}`,
    fullname: "Test User Two",
    email: `u2_${timestamp}@example.com`,
    password: "Password123!",
    mobile_no: "9876543211",
  };

  try {
    // 1. Register User 1
    console.log("1. Registering User 1...");
    const reg1 = await post("/auth/register", u1);
    console.log("   Register 1 status:", reg1.status, reg1.data?.message);
    if (reg1.status !== 200 && reg1.status !== 201) throw new Error("User 1 registration failed");

    // 2. Login User 1
    console.log("2. Logging in User 1...");
    const login1 = await post("/auth/login", { email: u1.email, password: u1.password });
    console.log("   Login 1 status:", login1.status, login1.data?.message);
    cookie1 = getCookieString(login1.setCookie);
    if (login1.status !== 200 || !cookie1) throw new Error("User 1 login failed or cookies missing");

    // 3. User 1 Get Profile and Update Profile
    console.log("3. Fetching and updating User 1 profile...");
    const me1 = await get("/user/me", cookie1);
    console.log("   Me 1 status:", me1.status, "Username:", me1.data?.data?.username);
    if (me1.status !== 200) throw new Error("User 1 getMe failed");

    const update1 = await patch("/user/me", { fullname: "User One Updated", bio: "Testing bio" }, cookie1);
    console.log("   Update profile status:", update1.status, "New fullname:", update1.data?.data?.fullname);
    if (update1.status !== 200) throw new Error("User 1 profile update failed");

    // 4. Get Servers for User 1 (Zero-Server Check)
    console.log("4. Fetching initial servers (Zero-Server Test)...");
    const initServers = await get("/server", cookie1);
    console.log("   Initial servers status:", initServers.status, "Count:", initServers.data?.data?.servers?.length ?? initServers.data?.servers?.length);
    if (initServers.status !== 200) throw new Error("Zero-server fetch returned non-200");

    // 5. Create Server
    console.log("5. Creating Server...");
    const srvCreate = await post("/server/create", { name: `Server_${timestamp}`, description: "E2E Server", isPublic: true }, cookie1);
    console.log("   Create server status:", srvCreate.status, "Server ID:", srvCreate.data?.data?._id || srvCreate.data?.server?._id);
    const serverObj = srvCreate.data?.data || srvCreate.data?.server;
    const serverId = serverObj?._id;
    const inviteCode = serverObj?.inviteCode;
    if (!serverId) throw new Error("Failed to create server");

    // 6. Create Channel
    console.log("6. Creating text channel...");
    const chanCreate = await post(`/channel/${serverId}/channels`, { name: "e2e-general", type: "text" }, cookie1);
    console.log("   Create channel status:", chanCreate.status, "Channel ID:", chanCreate.data?.data?._id);
    const channelId = chanCreate.data?.data?._id;
    if (!channelId) throw new Error("Failed to create channel");

    // 7. Update Channel
    console.log("7. Updating channel...");
    const chanUpdate = await patch(`/channel/${serverId}/channels/${channelId}`, { name: "e2e-announcements", topic: "Updated topic" }, cookie1);
    console.log("   Update channel status:", chanUpdate.status, "New name:", chanUpdate.data?.data?.name);
    if (chanUpdate.status !== 200) throw new Error("Channel update failed");

    // 8. Send Message in Channel
    console.log("8. Sending message in channel...");
    const msgSend = await post(`/messages/${channelId}/message`, { content: "Hello from E2E integration!" }, cookie1);
    console.log("   Send message status:", msgSend.status, "Msg ID:", msgSend.data?.data?._id);
    const msgId = msgSend.data?.data?._id;
    if (!msgId) throw new Error("Failed to send message");

    // 9. Fetch Channel Messages
    console.log("9. Fetching channel messages...");
    const msgsFetch = await get(`/messages/${channelId}/messages`, cookie1);
    console.log("   Fetch messages status:", msgsFetch.status, "Count:", msgsFetch.data?.data?.length);
    if (msgsFetch.status !== 200 || msgsFetch.data?.data?.length === 0) throw new Error("Failed to fetch messages");

    // 10. Register & Login User 2
    console.log("10. Registering and logging in User 2...");
    await post("/auth/register", u2);
    const login2 = await post("/auth/login", { email: u2.email, password: u2.password });
    cookie2 = getCookieString(login2.setCookie);
    if (!cookie2) throw new Error("User 2 login failed");

    // 11. User 2 joins Server via inviteCode
    console.log("11. User 2 joining server via invite code...");
    const joinRes = await post(`/server/join/${inviteCode}`, {}, cookie2);
    console.log("   Join server status:", joinRes.status, joinRes.data?.message);
    if (joinRes.status !== 200) throw new Error("User 2 failed to join server");

    // 12. Fetch Server Members
    console.log("12. Fetching server members...");
    const membersRes = await get(`/serverMembers/${serverId}/members`, cookie1);
    console.log("   Server members status:", membersRes.status, "Member count:", membersRes.data?.data?.length);
    if (membersRes.data?.data?.length < 2) throw new Error("Both members should be present");

    // 13. User 2 sends a message
    console.log("13. User 2 sending reply in channel...");
    const msg2Res = await post(`/messages/${channelId}/message`, { content: "Hello from User 2!" }, cookie2);
    console.log("   User 2 send status:", msg2Res.status);
    if (msg2Res.status !== 201 && msg2Res.status !== 200) throw new Error("User 2 failed to send message");

    // 14. User 2 leaves server
    console.log("14. User 2 leaving server...");
    const leaveRes = await del(`/server/${serverId}/leave`, cookie2);
    console.log("   Leave server status:", leaveRes.status, leaveRes.data?.message);
    if (leaveRes.status !== 200) throw new Error("User 2 failed to leave server");

    // 15. User 1 deletes channel and server
    console.log("15. Cleaning up channel and server...");
    const delChan = await del(`/channel/${serverId}/channels/${channelId}`, cookie1);
    console.log("   Delete channel status:", delChan.status);
    const delServer = await del(`/server/${serverId}`, cookie1);
    console.log("   Delete server status:", delServer.status);

    // 16. Logout User 1
    console.log("16. Logging out User 1...");
    const logoutRes = await post("/auth/logout", {}, cookie1);
    console.log("   Logout status:", logoutRes.status, logoutRes.data?.message);

    console.log("\n=======================================================");
    console.log(">>> ALL CORE P0/P1 INTEGRATION TESTS PASSED SUCCESSFULLY! <<<");
    console.log("=======================================================\n");

  } catch (err) {
    console.error("TEST FAILED:", err);
    process.exit(1);
  } finally {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
