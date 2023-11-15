import { z } from "zod";
import { ObjectId, WithId } from "mongodb";
import { database } from "../../utils/databaseConnection";
import BodyWithStoreId from "../../utils/body/BodyWithStoreId";

const CategorySchema = z.object({
  name: z
    .string({
      required_error: "`name` is required",
      invalid_type_error: "`name` must be a string",
    })
    .min(3, "`name` length must be more than 3")
    .toLowerCase(),
  stores: z
    .object({
      id: z.instanceof(ObjectId).or(
        z.string().refine((value) => {
          try {
            return new ObjectId(value);
          } catch (error) {
            return false;
          }
        }, "The provided value is not a valid ObjectId")
      ),
      products: z.instanceof(ObjectId).or(z.string()).array().default([]),
    })
    .array(),
});
const CreateCategorySchema = CategorySchema.pick({ name: true }).merge(
  BodyWithStoreId
);
const ProductToCategorySchema = BodyWithStoreId.merge(
  z.object({
    products: z
      .instanceof(ObjectId)
      .or(
        z.string().refine((value) => {
          try {
            return new ObjectId(value);
          } catch (error) {
            return false;
          }
        }, "The provided value is not a valid ObjectId")
      )
      .array(),
  })
);
const GetCategorySchemaByStoreId = z.object({
  limit: z.number().nonnegative().finite().gte(1).lte(10).default(5).optional(),
});

type CategorySchema = z.infer<typeof CategorySchema>;
type CreateCategorySchema = z.infer<typeof CreateCategorySchema>;
type ProductToCategorySchema = z.infer<typeof ProductToCategorySchema>;
type GetCategorySchemaByStoreId = z.infer<typeof GetCategorySchemaByStoreId>;
type CategorySchemaWithId = WithId<CategorySchema>;

const Category = database.collection<CategorySchema>("Categories");

Category.createIndex({ name: 1 });

export {
  CategorySchema,
  CreateCategorySchema,
  ProductToCategorySchema,
  GetCategorySchemaByStoreId,
  CategorySchemaWithId,
  Category,
};
