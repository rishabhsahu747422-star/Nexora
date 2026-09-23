import express from "express";

import app, { server } from "./src/app/app.js";
import { connectDb } from "./src/config/db.js";
connectDb();

const port = process.env.PORT || 5000;
server.listen(port, () => {
  console.log(`server is running on ${port}`);
});
