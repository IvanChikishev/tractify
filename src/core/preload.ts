import { spawn } from "node:child_process";
import { BrowserWindow } from "electron";

export class Preload {
  static async webpack(window: BrowserWindow, host?: string) {
    const ls = spawn("npm", ["run", "build:ui-dev"]);

    await new Promise<void>((resolve) => {
      ls.stderr.on("data", (data: Buffer) => {
        if (data.toString().includes(host ?? "http://127.0.0.1:9001/")) {
          resolve();
        }
      });
    });

    return window.loadURL("http://localhost:9001");
  }

  static get isDev() {
    return process.env.mode === "dev";
  }
}
