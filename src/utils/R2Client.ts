import * as dotenv from "dotenv";
import { S3Client } from "@aws-sdk/client-s3";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

const endpoint = process.env.R2_URI as string;
const accessKeyId = process.env.R2_ACCESS_ID as string;
const secretAccessKey = process.env.R2_ACCESS_KEY as string;

const r2Client = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export default r2Client;
