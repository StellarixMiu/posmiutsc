import * as fs from "fs-extra";
import { ZodError } from "zod";
import { MongoServerError } from "mongodb";
import { Request, Response, NextFunction } from "express";
import ResponseData from "../utils/responseHandler";

export class RequestError extends Error {
  status = 500;
  constructor(status: number, message?: string, stack?: any) {
    super(message);
    Object.setPrototypeOf(this, RequestError.prototype);

    if (typeof status == "number") {
      this.status = status;
    }
    this.stack = stack;
  }
}

export const errorMiddleware = (
  err: RequestError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.file) fs.removeSync(req.file.path);

  if (err instanceof MongoServerError)
    err = new RequestError(409, `Bad Request!!!`, err.message);
  if (err instanceof ZodError)
    err = new RequestError(422, `${err.name}!!!`, err.issues);

  const status: number = err.status || 500;
  const message: string = err.message ?? "Something went wrong!!";
  const data = err.stack || err.message; // TODO REMOVE err.stack at prod
  const response = new ResponseData(false, status, message, data);

  return res.status(status).json(response);
};
