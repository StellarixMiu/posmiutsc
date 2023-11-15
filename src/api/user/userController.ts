import { ObjectId } from "mongodb";
import { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { RequestError } from "../../middleware/errorMiddleware";
import { createAccess } from "../../utils/tokenHandler";
import { PatchUserSchema, User, UserSchemaWithId } from "./userModel";
import ResponseData from "../../utils/responseHandler";
import verifyCookies from "../../utils/cookiesHandler";
import checkForIdMismatch from "../../utils/CheckId";

export const getUser = async (user_id: string): Promise<UserSchemaWithId> => {
  const user = await User.findOne({
    _id: new ObjectId(user_id),
  }).then((value) => {
    if (value === null)
      throw new RequestError(404, "Not Found!!!", "User not found");
    return value;
  });
  return user;
};

export const requestAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const user_id = req.params.id;

    checkForIdMismatch(cookies.id, user_id);

    let user: UserSchemaWithId = await User.findOne({
      _id: new ObjectId(user_id),
    }).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "User not found");
      return value;
    });

    const access_token = createAccess(user._id);
    const response = new ResponseData(
      true,
      200,
      "Get access token successfully!!",
      {
        access_token: access_token,
      }
    );
    res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const getUserByToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    const user: UserSchemaWithId = await User.findOne({
      _id: new ObjectId(auth_token.id),
    }).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "user not found");
      return value;
    });

    const { password, token, ...metadata } = user;
    const response = new ResponseData(
      true,
      200,
      "Get user by token successfully!!",
      metadata
    );
    res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const user_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);
    checkForIdMismatch(auth_token.id, user_id);

    const user: UserSchemaWithId = await User.findOne({
      _id: new ObjectId(auth_token.id),
    }).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "user not found");
      return value;
    });

    const { password, token, ...metadata } = user;
    const response = new ResponseData(
      true,
      200,
      "Get user by id successfully!!",
      metadata
    );
    res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const patchUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies = verifyCookies(req.cookies.refresh_token);
    const body_update = await PatchUserSchema.parseAsync(req.body);
    const cookies_id = cookies.id as string;
    const params_id = req.params.id as string;
    const auth_id = req.body.auth_token.id as string;

    if (
      params_id !== auth_id ||
      auth_id !== cookies_id ||
      cookies_id !== params_id
    )
      throw new RequestError(401, "Unauthorized!!!", "id doesn't match");

    const user = await User.findOneAndUpdate(
      { _id: new ObjectId(params_id) },
      { $set: body_update },
      { returnDocument: "after" }
    ).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "user not found");
      return value;
    });

    const { password, token, ...metadata } = user;
    const response = new ResponseData(true, 200, "Success!!", metadata);
    res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const deleteUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies = verifyCookies(req.cookies.refresh_token);
    const cookies_id = cookies.id as string;
    const params_id = req.params.id as string;
    const auth_id = req.body.auth_token.id as string;

    if (
      params_id !== auth_id ||
      auth_id !== cookies_id ||
      cookies_id !== params_id
    )
      throw new RequestError(401, "Unauthorized!!!", "id doesn't match");

    const user = await User.findOneAndDelete({
      _id: new ObjectId(params_id),
    }).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "user not found");
      return value;
    });
    res.status(204).json({});
  } catch (error: any) {
    next(error);
  }
};
