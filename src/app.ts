import * as dotenv from "dotenv";
import express, { Express } from "express";
import cookieParser from "cookie-parser";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import morgan from "morgan";
import ApiRouter from "./api/index";
import { databaseConnect } from "./utils/databaseConnection";
import { errorMiddleware } from "./middleware/errorMiddleware";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

databaseConnect();

const app: Express = express();
const corsConfig: CorsOptions = {
  origin: true,
  credentials: true,
};

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors(corsConfig));
app.options("*", cors(corsConfig));
app.use(helmet());
// app.use(morgan("tiny"));

app.use("/api/", ApiRouter);

app.use(errorMiddleware);

export default app;
