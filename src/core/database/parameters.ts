import { DataSourceOptions } from "typeorm";
import appRootPath from "app-root-path";

export const DatabaseParameters: DataSourceOptions = {
  type: "sqlite",
  database: ".local/db",
  synchronize: true,
  logging: false,
  entities: [appRootPath.resolve("dist/backend/entities/*.entity.js")],
  subscribers: [],
  migrations: [],
};
