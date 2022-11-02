import { pki } from "node-forge";
import { CA } from "../../../entities";

export interface CommissionerOptions {
  host: string;
  port: number;

  plugins?: Array<Plugin>;
  ssl: CA;
}
