import { ObjectId } from "mongodb";
import { RequestError } from "../../middleware/errorMiddleware";
import { UserSchemaWithId } from "../../api/user/userModel";
import { Image, ImageSchemaWithId } from "./imageModel";

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

export const checkFileType = (file: Express.Multer.File): void => {
  if (!file.mimetype.startsWith("image/") && file.size === 0)
    throw new RequestError(
      422,
      "Unprocessable Entity!!!",
      "Only an images are allowed"
    );

  return;
};

export const checkImageOwner = (
  image: ImageSchemaWithId,
  user: UserSchemaWithId
): void => {
  if (image.owner.toString() !== user._id.toString())
    throw new RequestError(
      403,
      "Forbidden!!!",
      "You do not have permission to access this image"
    );

  return;
};
