import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js";

import dotenv from "dotenv";
dotenv.config();

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

app.set("port", process.env.PORT || 3006);
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);

const start = async () => {
  try {
    const connectionMongo = await mongoose.connect(process.env.MONGO_URL);
    console.log(`MONGO Connected DB host: ${connectionMongo.connection.host}`);
  } catch (e) {
    console.log(`There is a connection problem in DB i.e, ${e}`);
  }

  server.listen(app.get("port"), () => {
    console.log(`App is listening on port ${app.get("port")}`);
    console.log(`App is running on: http://localhost:${app.get("port")} `);
  });
};

start();
