import { CommissionerOptions } from "./interfaces/commissionerOptions";
import net from "node:net";
import { Transmitter } from "./transmitter";
import { Logger } from "../logger";
import { AddressInfo, Socket } from "net";
import http from "node:http";
import { TransmitterContext } from "./interfaces/transmitterContext";

export class Commissioner {
  readonly server: net.Server;
  readonly history: Map<string, Transmitter>;

  constructor(readonly options: CommissionerOptions) {
    this.history = new Map<string, Transmitter>();

    this.server = net.createServer(this.onSocketConnect.bind(this));

    this.server.on("error", () => {
      console.log("base htttttttp error");
    });
  }

  async onSocketConnect(socket: net.Socket) {
    socket.on("error", () => {
      console.log("errrrror");
    });
    socket.pause();

    const context = await new Promise<TransmitterContext>((resolve) => {
      const httpServer = http.createServer();

      httpServer.on("error", () => {
        console.log("base http error");
      });

      httpServer.listen(0, "127.0.0.1", () => {
        const addressInfo = httpServer.address() as AddressInfo;

        const localSocket = net
          .createConnection(
            {
              host: addressInfo.address,
              port: addressInfo.port,
            },
            () => {
              socket.pipe(localSocket);
              localSocket.pipe(socket);

              resolve({ localSocket, httpServer });
            }
          )
          .on("error", () => {
            console.log("socket error");
          });
      });
    });

    const transmitter = new Transmitter(this, context);
    this.history.set(transmitter.uuid, transmitter);

    socket.resume();
  }

  listen() {
    this.server.listen(this.options.port, this.options.host, () => {
      Logger.info("Socket service has listening");
    });
  }
}
