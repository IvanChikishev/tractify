import "reflect-metadata";
import { DataSource } from "typeorm";
import { DatabaseParameters } from "./parameters";

export const Database = new DataSource(DatabaseParameters);
