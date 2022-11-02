import { IncomingMessage } from "node:http";
import lil from "lil-uri";

export class HelperService {
  /**
   * Проверяет поддержку TLS
   * @param head {Buffer}
   */
  static isTls(head?: Buffer) {
    if (!head) return false;
    return head[0] == 0x16 || head[0] == 0x80 || head[0] == 0x00;
  }

  static getRequestParameters(req: IncomingMessage, ssl?: boolean) {
    const url = req.url || "/";
    const host = req.headers["host"];

    if (!url || !host) {
      return undefined;
    }

    const requestUrlInfo = lil(url);

    const baseConnectionInfo = {
      host: requestUrlInfo.hostname(),
      port: requestUrlInfo.port(),
    };

    if (!baseConnectionInfo.host) {
      const headerHostInfo = lil(host);

      baseConnectionInfo.host = headerHostInfo.hostname();
      baseConnectionInfo.port = headerHostInfo.port();
    }

    if (!baseConnectionInfo.host) {
      return undefined;
    }

    let basePath = requestUrlInfo.path() || "/";
    const query = requestUrlInfo.search();

    if (query) {
      basePath = basePath
        .concat("?")
        .concat(new URLSearchParams(query as any).toString());
    }

    return {
      host: baseConnectionInfo.host,
      port: baseConnectionInfo.port || (ssl ? 443 : 80),
      path: basePath,
      params: requestUrlInfo.query() || {},
    };
  }
}
