import * as dotenv from "dotenv";
import { ObjectId } from "mongodb";
import { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { createAccess } from "../../utils/tokenHandler";
import { RequestError } from "../../middleware/errorMiddleware";
import { PatchUserSchema, User, UserSchemaWithId } from "./userModel";
import {
  Image,
  ImageSchema,
  ImageSchemaWithId,
} from "../../utils/image/imageModel";
import {
  checkFileType,
  deleteR2Image,
  getImage,
  postR2Image,
} from "../../utils/image/imageController";
import ResponseData from "../../utils/responseHandler";
import verifyCookies from "../../utils/cookiesHandler";
import checkForIdMismatch from "../../utils/CheckId";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

const r2_endpoint: string = process.env.R2_PUBLIC_ENDPOINT as string;

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

export const addUserImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const user_id = req.params.id;
    const file = req.file;
    const { auth_token } = req.body;

    if (!file) throw new RequestError(404, "Not Found!!!", "File not found");

    checkForIdMismatch(auth_token.id, cookies.id);
    checkForIdMismatch(auth_token.id, user_id);
    checkFileType(file);

    const r2_data = await postR2Image(file, user_id.toString());

    if (!r2_data)
      throw new RequestError(
        500,
        "Internal Server Error!!!",
        "Failed to upload image to Cloudflare R2"
      );

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let image: ImageSchema | ImageSchemaWithId = await ImageSchema.parseAsync({
      path: file.path,
      full_path: `${r2_endpoint}${file.filename.split(".")[0]}`,
      name: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      e_tag: r2_data.ETag,
      version_id: r2_data.VersionId,
      owner_id: user._id,
    });

    if (user.image)
      throw new RequestError(
        400,
        "Bad Request!!!",
        "User already has an image"
      );

    await Image.insertOne(image).then(async (value) => {
      if (!value.acknowledged) throw new Error();

      user = await User.findOneAndUpdate(
        { _id: user._id },
        {
          $set: {
            image: value.insertedId,
          },
        },
        { returnDocument: "after" }
      ).then((value) => {
        if (value === null)
          throw new RequestError(404, "Not Found!!!", "User not found");
        return value;
      });
    });

    const { password, token, ...metadata } = user;
    const response = new ResponseData(
      true,
      200,
      "Add store logo successfully!!",
      metadata
    );
    return res.status(200).json(response);
  } catch (error: any) {
    await deleteR2Image(req.file?.filename.split(".")[0]);
    next(error);
  }
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
        throw new RequestError(404, "Not Found!!!", "User not found");
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
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const user_data: PatchUserSchema = await PatchUserSchema.parseAsync(
      req.body
    );
    const user_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);
    checkForIdMismatch(auth_token.id, user_id);

    let user: UserSchemaWithId = await getUser(user_id);

    await User.findOneAndUpdate(
      { _id: user._id },
      {
        $set: {
          name: user_data.name || user.name || "",
          email: user_data.email || user.email || "",
          phone_number: user_data.phone_number || user.phone_number || "",
        },
      },
      { returnDocument: "after" }
    ).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "User not found");
      return value;
    });

    const { password, token, ...metadata } = user;
    const response = new ResponseData(
      true,
      200,
      "Patch user by id successfully!!",
      metadata
    );
    res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const patchUserImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const file = req.file;
    const user_id = req.params.id;
    const { auth_token } = req.body;

    if (!file) throw new RequestError(404, "Not Found!!!", "File not found");

    checkForIdMismatch(auth_token.id, cookies.id);
    checkForIdMismatch(auth_token.id, user_id);
    checkFileType(file);

    let user: UserSchemaWithId = await getUser(auth_token.id);

    if (!user.image)
      throw new RequestError(404, "Not Found!!!", "User image not found");

    let image: ImageSchemaWithId = await getImage(user.image.toString());

    if (user._id.toString() !== image.owner_id.toString())
      throw new RequestError(
        403,
        "Forbidden!!!",
        "You do not have access rights to this image"
      );
    if (user.image.toString() !== image._id.toString())
      throw new RequestError(
        400,
        "Bad Request!!!",
        "Mismatch between `product_image_id` and `image_id`"
      );

    const r2_data = await postR2Image(file, user_id.toString());

    if (!r2_data)
      throw new RequestError(
        500,
        "Internal Server Error!!!",
        "Failed to upload image to Cloudflare R2"
      );

    await deleteR2Image(image.name.split(".")[0]);

    const new_image = await ImageSchema.parseAsync({
      path: file.path,
      full_path: `${r2_endpoint}${file.filename.split(".")[0]}`,
      name: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      e_tag: r2_data.ETag,
      version_id: r2_data.VersionId,
      owner_id: user._id,
    });

    await Image.deleteOne({ _id: image._id });
    await Image.insertOne(new_image).then(async (value) => {
      if (!value.acknowledged) throw new Error();

      user = await User.findOneAndUpdate(
        { _id: user._id },
        {
          $set: {
            image: value.insertedId,
          },
        },
        { returnDocument: "after" }
      ).then((value) => {
        if (value === null)
          throw new RequestError(404, "Not Found!!!", "User not found");
        return value;
      });
    });

    const { password, token, ...metadata } = user;
    const response = new ResponseData(
      true,
      200,
      "Patch user image successfully!!",
      metadata
    );
    return res.status(200).json(response);
  } catch (error: any) {
    await deleteR2Image(req.file?.filename.split(".")[0]);
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
