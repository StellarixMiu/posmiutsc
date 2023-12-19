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
  full_path: z
    .string({
      required_error: "`full_path` is required",
      invalid_type_error: "`full_path` must be a string",
    })
    .min(3, "`full_path` length must be more than 3")
    .url({
      message: "`full_path` must be a valid URL",
    }),
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
  e_tag: z
    .string({
      required_error: "`e_tag` is required",
      invalid_type_error: "`e_tag` must be a string",
    })
    .min(3, "`e_tag` length must be more than 3"),
  version_id: z
    .string({
      required_error: "`version_id` is required",
      invalid_type_error: "`version_id` must be a string",
    })
    .min(3, "`version_id` length must be more than 3"),
  owner_id: z.instanceof(ObjectId).or(
    z
      .string({
        required_error: "`owner` is required",
        invalid_type_error: "`owner` must be a string",
      })
      .refine(
        (value) => {
          try {
            return new ObjectId(value);
          } catch (error) {
            return false;
          }
        },
        { message: "`owner_id` should be an valid ObjectId" }
      )
  ),
});

type ImageSchema = z.infer<typeof ImageSchema>;
type ImageSchemaWithId = WithId<ImageSchema>;

const Image = database.collection<ImageSchema>("Images");

Image.createIndex({ full_path: 1 });
Image.createIndex({ path: 1 }, { unique: true });
Image.createIndex({ name: 1 }, { unique: true });

export { ImageSchema, ImageSchemaWithId, Image };
