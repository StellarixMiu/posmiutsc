import * as dotenv from "dotenv";
import app from "./app";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

const port: number = process.env.PORT as unknown as number | 2442;
const server = createServer(app);
const socket = new Server(server);

// socket.on("connection", (data) => {});

server.listen(port, async () => {
  console.log(`⚡️[server]: running at http://localhost:${port}`);
});
