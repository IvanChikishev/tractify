import { contextBridge, ipcRenderer } from "electron";

ipcRenderer.on("broadcast:message", (event, message) => {
  console.log(message);
});

contextBridge.exposeInMainWorld("electron", {
  headerMouseMove(x: number, y: number) {
    ipcRenderer.send("header::move");
  },

  headerMouseUp(x: number, y: number) {
    ipcRenderer.send("header::focus");
  },
});
