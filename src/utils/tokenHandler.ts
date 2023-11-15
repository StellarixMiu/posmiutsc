import * as dotenv from "dotenv";
import * as jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

const jwt_refresh_token = process.env.JWT_REFRESH_TOKEN as string;
const jwt_access_token = process.env.JWT_ACCESS_TOKEN as string;

export enum TokenTypeEnum {
  REFRESH = "REFRESH",
  ACCESS = "ACCESS",
}

export const createRefresh = (id: ObjectId) => {
  const refresh_token: string = jwt.sign({ id: id }, jwt_refresh_token, {
    expiresIn: "7d",
  });
  return refresh_token;
};

export const createAccess = (id: ObjectId) => {
  const access_token = jwt.sign({ id: id }, jwt_access_token, {
    expiresIn: "60s",
  });
  return access_token;
};

export const decodeToken = (
  type: TokenTypeEnum,
  token: string | undefined
): jwt.JwtPayload => {
  const decoded_token = jwt.verify(
    token as string,
    type === "REFRESH" ? jwt_refresh_token : jwt_access_token
  ) as jwt.JwtPayload;
  return decoded_token;
};

export const isRefreshTokenExpired = (refresh_token: string): boolean => {
  let exp = 1;
  if (refresh_token.length >= 1) {
    const decoded_refresh = decodeToken(
      TokenTypeEnum.REFRESH,
      refresh_token
    ) as jwt.JwtPayload;
    exp = decoded_refresh.exp as number;
  }
  return Date.now() >= exp * 1000;
};

export const testRefresh = (id: ObjectId) => {
  const refresh_token: string = jwt.sign({ id: id }, jwt_refresh_token, {
    expiresIn: "5s",
  });
  return refresh_token;
};
