import { z } from "zod";
import { ObjectId, WithId } from "mongodb";
import { database } from "../databaseConnection";

enum ActivitiesTypeEnum {
  CREATED = "CREATED",
  UPDATED = "UPDATED",
}
// const ActivitiesTypeEnum = ["CREATED", "SOLD"] as const;

const ActivitiesSchema = z.object({
  type: z.nativeEnum(ActivitiesTypeEnum),
  changes: z.instanceof(ObjectId).or(z.string()),
  descriptions: z
    .string({
      required_error: "`name` is required",
      invalid_type_error: "`name` must be a string",
    })
    .min(3, "`name` length must be more than 3"),
});

type ActivitiesSchema = z.infer<typeof ActivitiesSchema>;
type ActivitiesSchemaWithId = WithId<ActivitiesSchema>;

const Activities = database.collection<ActivitiesSchema>("Activities");

Activities.createIndex({ type: 1 });

export {
  ActivitiesSchema,
  ActivitiesSchemaWithId,
  ActivitiesTypeEnum,
  Activities,
};
