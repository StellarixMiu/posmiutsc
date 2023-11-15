import * as jwt from "jsonwebtoken";
import { RequestError } from "../middleware/errorMiddleware";
import {
  TokenTypeEnum,
  isRefreshTokenExpired,
  decodeToken,
} from "./tokenHandler";

const verifyCookies = (cookies?: string) => {
  if (!cookies)
    throw new RequestError(
      401,
      "Unauthorized!!!",
      "Request cookies not defined"
    );
  if (isRefreshTokenExpired(cookies))
    throw new RequestError(403, "Forbidden!!!", "Cookies is expired");

  return decodeToken(TokenTypeEnum.REFRESH, cookies);
};

export default verifyCookies;
