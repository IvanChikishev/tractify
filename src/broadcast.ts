import { ipcMain, ipcRenderer, IpcMainEvent } from "electron";
import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";

class BroadcastService extends EventEmitter {
  load() {}

  call<T, E>(
    path: string,
    message: T,
    callback: (value: E) => Promise<void> | void
  ): void;

  async call<T, E>(path: string, message: T): Promise<E>;

  call<T, E>(path: string, message: any, callback?: any): any {
    const targetId = randomUUID();

    const response = new Promise<E>((resolve) => {
      this.once(targetId, (response: E) => {
        resolve(response);
      });
    });

    console.log(ipcMain);

    if (!callback) {
      return response;
    }

    response.then(callback);
  }
}

export const Broadcast = new BroadcastService();
