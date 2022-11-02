import { Socket } from "node:net";
import { Server } from "node:http";

export interface TransmitterContext {
  localSocket: Socket;
  httpServer: Server;
}
