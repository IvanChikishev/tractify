import { colorConsole, Tracer } from "tracer";

export const Logger = colorConsole({
  format: "[{{timestamp}}] [{{title}}] {{message}} (in {{file}}:{{line}})",
  dateformat: "yyyy-dd-mm HH:MM:ss",
  preprocess: function (data) {
    data.title = data.title.toUpperCase();
  },
});
