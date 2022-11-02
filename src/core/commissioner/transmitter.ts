import http from "node:http";
import https from "node:https";
import { randomUUID } from "node:crypto";
import { Duplex } from "node:stream";
import { Logger } from "../logger";
import { TransmitterContext } from "./interfaces/transmitterContext";
import { HelperService } from "./helpers";
import { AddressInfo } from "net";
import { Commissioner } from "./index";
import { CertificateService } from "../ssl/certificate";
import net from "node:net";
import { RequestStream } from "./stream/request";
import { ResponseStream } from "./stream/response";

export class Transmitter {
  readonly uuid: string;

  constructor(
    readonly commissioner: Commissioner,
    readonly context: TransmitterContext
  ) {
    this.uuid = randomUUID();

    this.context.httpServer.on("connect", this.onServerConnect.bind(this));
    this.context.httpServer.on(
      "request",
      this.onServerRequest.bind(this, false)
    );
    this.context.httpServer.on("error", this.onServerError.bind(this));

    Logger.info("Created new socket context: %s", this.uuid);
  }

  private async createSecurityContext(options: https.ServerOptions) {
    const httpsServer = https.createServer(options);

    httpsServer.on("connect", this.onServerConnect.bind(this));
    httpsServer.on("request", this.onServerRequest.bind(this, true));
    httpsServer.on("error", this.onServerError.bind(this));

    return new Promise<{ httpsServer: https.Server; addressInfo: AddressInfo }>(
      (resolve) => {
        httpsServer.listen(0, () => {
          const addressInfo = httpsServer.address() as AddressInfo;
          resolve({ httpsServer, addressInfo });
        });
      }
    );
  }

  private async onServerConnect(
    req: http.IncomingMessage,
    socket: Duplex,
    head: Buffer
  ) {
    if (!head || head.length === 0) {
      console.log("done");

      socket.once("data", this.onServerConnectData.bind(this, req, socket));
      socket.write("HTTP/1.1 200 OK\r\n");

      if (req.headers["proxy-connection"] === "keep-alive") {
        socket.write("Proxy-Transmitter: keep-alive\r\n");
        socket.write("Transmitter: keep-alive\r\n");
      }

      return socket.write("\r\n");

      return;
    }

    await this.onServerConnectData(req, socket, head);
  }

  private async onServerConnectData(
    req: http.IncomingMessage,
    socket: Duplex,
    head: Buffer
  ) {
    socket.pause();

    if (HelperService.isTls(head)) {
      const parameters = HelperService.getRequestParameters(req, true);

      if (!parameters) {
        return socket.end();
      }

      const { ca, pk } = await CertificateService.releaseByHosts(
        [parameters.host],
        this.commissioner.options.ssl
      );

      const { addressInfo } = await this.createSecurityContext({
        cert: ca,
        key: pk,
      });

      this.bind(socket, head, addressInfo);

      return;
    }

    Logger.warn("Unsupported parameters: %s", this.uuid);
  }

  private async onServerRequest(
    ssl: boolean,
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const parameters = HelperService.getRequestParameters(req, ssl);

    if (!parameters) {
      req.socket.resume();
      res.writeHead(400, {
        "Content-Type": "text/html; charset=utf-8",
      });

      return res.end("Missing host.");
    }

    const proto = ssl ? https : http;
    const request = proto.request(
      {
        host: parameters.host,
        port: parameters.port,
        path: parameters.path,
        headers: req.headers,
        method: req.method,
      },
      (response) => {
        response.on("error", () => this.onServerError.bind(this));

        for (const [name, value] of Object.entries(response.headers)) {
          res.setHeader(name, value as string);
        }

        response.pipe(new ResponseStream(res));
      }
    );

    request.on("error", this.onServerError.bind(this));
    req.pipe(new RequestStream(request));
  }

  private async onServerError(error: Error) {
    console.log("http/s server error", error);
  }

  private bind(socket: Duplex, head: Buffer, addressInfo: AddressInfo) {
    const connection = net.connect(
      {
        host: addressInfo.address,
        port: addressInfo.port,
        allowHalfOpen: true,
      },
      () => {
        connection.on("close", () => {
          socket.destroy();
        });

        socket.on("close", () => {
          connection.destroy();
        });

        connection.on("error", async (err) => {
          connection.destroy();
          await this.onServerError(err);
        });

        connection.pipe(socket);
        socket.pipe(connection);

        socket.emit("data", head);

        return socket.resume();
      }
    );

    socket.on("error", this.onServerError.bind(this));
    connection.on("error", this.onServerError.bind(this));
  }
}
