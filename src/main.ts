import { BrowserWindow, app, ipcMain, screen } from "electron";
import { Preload } from "./core/preload";

import * as path from "path";
import { Broadcast } from "./broadcast";
import { Database } from "./core/database";

async function render() {
  const window = new BrowserWindow({
    width: 870,
    height: 600,
    minHeight: 600,
    minWidth: 870,
    title: "Tractify",
    webPreferences: {
      preload: path.resolve(__dirname, "preload.js"),
    },

    titleBarStyle: "hidden",
    trafficLightPosition: { x: 18, y: 18 },
  });

  window.setPosition(100, 100);

  /**
   * dev mode with webpack hot-reload
   */
  if (Preload.isDev) {
    await Preload.webpack(window);
  } else {
    await window.loadFile("dist/frontend/index.html");
  }

  return window;
}

app.whenReady().then(async () => {
  await Database.initialize();

  // const proxyService = new Proxy({
  //   async transport() {},
  // });
  //
  // await proxyService.listen();

  const window = await render();

  let mX = 0,
    mY = 0;

  ipcMain.on("header::move", (event, args) => {
    const mousePosition = screen.getCursorScreenPoint();

    window.setPosition(mousePosition.x - mX, mousePosition.y - mY);
  });

  ipcMain.on("header::focus", () => {
    const mousePosition = screen.getCursorScreenPoint();
    const [windowX, windowY] = window.getPosition();

    mX = mousePosition.x - windowX;
    mY = mousePosition.y - windowY;
  });

  Broadcast.load();

  // const message = await Broadcast.call("example", { message: "Hello, World!" });
  // console.log(message);
});
