import * as dotenv from "dotenv";
import * as fs from "fs-extra";
import { ObjectId } from "mongodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { RequestError } from "../../middleware/errorMiddleware";
import { UserSchemaWithId } from "../../api/user/userModel";
import { Image, ImageSchemaWithId } from "./imageModel";
import r2Client from "../R2Client";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

const bucket = process.env.R2_BUCKET_NAME as string;

export const postR2Image = async (
  file: Express.Multer.File,
  owner_id: string
): Promise<
  | {
      ETag: string | undefined;
      VersionId: string | undefined;
    }
  | undefined
> => {
  try {
    const { filename, mimetype, size, encoding } = file;
    const buffer = fs.readFileSync(file.path);
    const command = new PutObjectCommand({
      Bucket: bucket,
      Body: buffer,
      Key: filename.split(".")[0],
      ContentType: mimetype,
      Metadata: {
        filename,
        mimetype,
        encoding,
        size: size.toString(),
        owner_id,
      },
    });
    const { ETag, VersionId } = await r2Client.send(command);
    fs.removeSync(file.path);
    return { ETag, VersionId };
  } catch (error: any) {
    fs.removeSync(file.path);
    console.log(error);
    return;
  }
};

export const deleteR2Image = async (
  r2_key: string | undefined
): Promise<void> => {
  if (!r2_key) return;

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: r2_key,
  });
  await r2Client.send(command);
  return;
};

export const createPresignedUrl = async (
  r2_key: string | undefined
): Promise<string | void> => {
  if (!r2_key) return;
  const link = await getSignedUrl(
    r2Client,
    new GetObjectCommand({
      Bucket: bucket,
      Key: r2_key,
    }),
    { expiresIn: 720 }
  );
  return link;
};

export const checkFileType = (file: Express.Multer.File): void => {
  if (!file.mimetype.startsWith("image/") || file.size === 0)
    throw new RequestError(
      422,
      "Unprocessable Entity!!!",
      "Only an images are allowed"
    );

  return;
};

export const getImage = async (
  image_id: string
): Promise<ImageSchemaWithId> => {
  const image = await Image.findOne({
    _id: new ObjectId(image_id),
  }).then((value) => {
    if (value === null)
      throw new RequestError(404, "Not Found!!!", "Image not found");
    return value;
  });
  return image;
};

export const checkImageOwner = (
  image: ImageSchemaWithId,
  user: UserSchemaWithId
): void => {
  if (image.owner_id.toString() !== user._id.toString())
    throw new RequestError(
      403,
      "Forbidden!!!",
      "You do not have permission to access this image"
    );

  return;
};
