import * as dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

const db_uri: string = process.env.MONGO_URI as string;
const client = new MongoClient(db_uri);
export const database = client.db();

export const databaseConnect = async () => {
  await client.connect();
};

export const databaseDisconnect = async () => {
  await client.close();
};
