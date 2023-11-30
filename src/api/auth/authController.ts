import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import { Request, Response, NextFunction } from "express";
import { RequestError } from "../../middleware/errorMiddleware";
import { passwordsMatch, encryptPassword } from "../../utils/passwordHandler";
import {
  SignupUserSchema,
  SinginUserSchema,
  User,
  UserSchema,
  UserSchemaWithId,
} from "../user/userModel";
import {
  TokenTypeEnum,
  createAccess,
  createRefresh,
  decodeToken,
} from "../../utils/tokenHandler";
import ResponseData from "../../utils/responseHandler";
import verifyCookies from "../../utils/cookiesHandler";
import checkForIdMismatch from "../../utils/CheckId";

const salt_round = 10;

export const signupUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_data: SignupUserSchema = await SignupUserSchema.parseAsync(
      req.body
    ).then(async (value) => {
      const password_hash = bcrypt.hashSync(value.password, salt_round);
      value.password = encryptPassword(password_hash);
      return { ...value };
    });
    const user: UserSchema | UserSchemaWithId = await UserSchema.parseAsync(
      user_data
    );

    await User.insertOne(user);

    const { password, token, ...metadata } = user;
    const response = new ResponseData(
      true,
      200,
      "Sign up user successfully!!",
      metadata
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const signinUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user_data: SinginUserSchema = await SinginUserSchema.parseAsync(
      req.body
    );
    let user: UserSchemaWithId = await User.findOneAndUpdate(
      { email: user_data.email },
      { $set: { "token.refresh": "" } },
      { returnDocument: "after" }
    ).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "User not found");
      return value;
    });

    await passwordsMatch(user_data.password, user.password);

    const refresh_token = createRefresh(user._id);
    const access_token = createAccess(user._id);
    const { exp } = decodeToken(TokenTypeEnum.REFRESH, refresh_token);

    user = await User.findOneAndUpdate(
      { _id: user._id },
      { $set: { "token.refresh": refresh_token } },
      { returnDocument: "after" }
    ).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "User not found");
      return value;
    });

    const response = new ResponseData(
      true,
      200,
      "Sign in user successfully!!",
      { access_token: access_token }
    );

    return res
      .cookie("refresh_token", refresh_token, {
        httpOnly: false,
        maxAge: exp,
        // sameSite: "none",
        // secure: true, // TODO if served over HTTPS change to true
      })
      .status(200)
      .json(response);
  } catch (error: any) {
    next(error);
  }
};

export const signoutUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies = verifyCookies(req.cookies.refresh_token);
    const user_id = req.params.id;

    checkForIdMismatch(user_id, cookies.id);

    const user = await User.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      { $set: { "token.refresh": "" } },
      { returnDocument: "after" }
    ).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "User not found");
      return value;
    });
    const response = new ResponseData(
      true,
      200,
      "Sign out user successfully!!",
      {}
    );
    res.clearCookie("refresh_token");
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};
