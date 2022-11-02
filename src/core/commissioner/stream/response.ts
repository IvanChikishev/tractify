import { ServerResponse } from "node:http";
import { EventEmitter } from "node:events";

export class ResponseStream extends EventEmitter {
  readonly writable = true;

  constructor(readonly res: ServerResponse) {
    super();
  }

  end(cb?: any): this;
  end(data: Uint8Array, cb?: any): this;
  end(str: Uint8Array, encoding?: BufferEncoding, cb?: any): this;
  end(message?: Uint8Array): this {
    this.res.end(message);

    return this;
  }

  write(buffer: Uint8Array, cb?: (err?: Error | null) => void): boolean;
  write(
    str: Uint8Array | string,
    encoding?: BufferEncoding,
    cb?: (err?: Error | null) => void
  ): boolean;
  write(message?: Uint8Array | string): boolean {
    if (message) {
      this.res.write(message);
    }

    return true;
  }
}
