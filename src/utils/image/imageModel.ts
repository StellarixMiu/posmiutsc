import { z } from "zod";
import { ObjectId, WithId } from "mongodb";
import { database } from "../databaseConnection";

const ImageSchema = z.object({
  path: z
    .string({
      required_error: "`path` is required",
      invalid_type_error: "`path` must be a string",
    })
    .min(3, "`path` length must be more than 3"),
  name: z
    .string({
      required_error: "`name` is required",
      invalid_type_error: "`name` must be a string",
    })
    .min(3, "`name` length must be more than 3"),
  size: z.number().nonnegative().finite(),
  mimetype: z
    .string({
      required_error: "`mimetype` is required",
      invalid_type_error: "`mimetype` must be a string",
    })
    .startsWith("image/", "Only an images are allowed"),
  owner: z.instanceof(ObjectId).or(
    z
      .string({
        required_error: "`owner` is required",
        invalid_type_error: "`owner` must be a string",
      })
      .refine((value) => {
        try {
          return new ObjectId(value);
        } catch (error) {
          return false;
        }
      })
  ),
});

type ImageSchema = z.infer<typeof ImageSchema>;
type ImageSchemaWithId = WithId<ImageSchema>;

const Image = database.collection<ImageSchema>("Images");

Image.createIndex({ path: 1 }, { unique: true });
Image.createIndex({ name: 1 }, { unique: true });

export { ImageSchema, ImageSchemaWithId, Image };
