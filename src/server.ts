import { createServer } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { attachRealtimeServer } from "./realtime/socket.js";

const app = createApp();
const httpServer = createServer(app);

attachRealtimeServer(httpServer);

httpServer.listen(env.PORT, () => {
  console.log(`INHOD API listening on http://localhost:${env.PORT}`);
});
