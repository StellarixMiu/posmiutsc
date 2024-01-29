import { z } from "zod";
import { database } from "../../utils/databaseConnection";
import { ObjectId, WithId } from "mongodb";
import BodyWithStoreId from "../../utils/body/BodyWithStoreId";

const multiWhitespaceRegex = new RegExp(/\s+/g);

const ProductsObjectSchema = z.object({
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
});

const CategorySchema = z.object({
  name: z
    .string({
      required_error: "`name` is required",
      invalid_type_error: "`name` must be a string",
    })
    .min(3, "`name` length must be more than 3")
    .toLowerCase()
    .transform((value) => value.replace(multiWhitespaceRegex, " ").trim()),
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
const CreateCategorySchema = CategorySchema.pick({ name: true })
  .merge(BodyWithStoreId)
  .merge(ProductsObjectSchema);
const ProductToCategorySchema = BodyWithStoreId.merge(ProductsObjectSchema);
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
