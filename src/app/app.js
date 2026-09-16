import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cookieParser from "cookie-parser";
import authRoute from "../routes/auth.routes.js";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import serverRoute from "../routes/server.routes.js";
import http from "http";
import { socketIntialise } from "../config/soocket.js";
import serverMemberRoutes from "../routes/serverMember.routes.js";
import roleRoutes from "../routes/role.routes.js";
import userRoutes from "../routes/user.routes.js";
import messageRoutes from "../routes/message.routes.js";

const app = express();
export const server = http.createServer(app);
socketIntialise(server);

app.use(passport.initialize());
app.use(express.json());
app.use(cookieParser());

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    (_, __, profile, done) => {
      return done(null, profile);
    },
  ),
);

app.use("/api/auth", authRoute);
app.use("/api/server", serverRoute);
app.use("/api/serverMembers", serverMemberRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/user", userRoutes);
app.use("/api/messages", messageRoutes);

export default app;
