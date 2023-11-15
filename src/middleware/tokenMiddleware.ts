import * as fs from "fs-extra";
import * as jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
import { Request, Response, NextFunction } from "express";
import { RequestError } from "./errorMiddleware";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

const jwt_refresh_token = process.env.JWT_REFRESH_TOKEN as string;
const jwt_access_token = process.env.JWT_ACCESS_TOKEN as string;

export function verifyToken() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const auth_header = req.headers["authorization"];
      if (!auth_header)
        throw new RequestError(
          401,
          "Unauthorized!!!",
          "Authorization header is needed"
        );

      const token = auth_header && (auth_header.split(" ")[1] as string);
      const auth_token = jwt.verify(
        token,
        jwt_access_token,
        (error, decoded) => {
          if (error !== null || !decoded) {
            throw new RequestError(
              403,
              "Forbidden!!!",
              "Invalid token at authorization header"
            );
          }
          return decoded;
        }
      );

      req.body = {
        ...req.body,
        auth_token: auth_token,
      };

      next();
    } catch (error: any) {
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  };
}
