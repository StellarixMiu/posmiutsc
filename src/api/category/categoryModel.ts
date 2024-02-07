import { z } from "zod";
import { ObjectId, WithId } from "mongodb";
import { database } from "../../utils/databaseConnection";
import WithStoreId from "../../utils/withStoreId";
import removeMultiWhitespace from "../../utils/removeMultiWhitespace";

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
    .transform((value) => removeMultiWhitespace(value)),
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
  .merge(WithStoreId)
  .merge(ProductsObjectSchema);
const ProductToCategorySchema = WithStoreId.merge(ProductsObjectSchema);
const GetCategorySchemaByStoreId = z.object({
  from: z.number().nonnegative().finite().default(0).optional(),
  limit: z.number().nonnegative().finite().gte(1).lte(99).default(20),
});

const QueryGetCategorySchemaByStoreId = z.object({
  from: z
    .string()
    .default("0")
    .transform((value) => parseInt(value))
    .optional(),
  limit: z.string().transform((value) => parseInt(value)),
});

type CategorySchema = z.infer<typeof CategorySchema>;
type CreateCategorySchema = z.infer<typeof CreateCategorySchema>;
type ProductToCategorySchema = z.infer<typeof ProductToCategorySchema>;
type GetCategorySchemaByStoreId = z.infer<typeof GetCategorySchemaByStoreId>;
type CategorySchemaWithId = WithId<CategorySchema>;

type QueryGetCategorySchemaByStoreId = z.infer<
  typeof QueryGetCategorySchemaByStoreId
>;

const Category = database.collection<CategorySchema>("Categories");

Category.createIndex({ name: 1 });

export {
  Category,
  CategorySchema,
  CreateCategorySchema,
  ProductToCategorySchema,
  GetCategorySchemaByStoreId,
  CategorySchemaWithId,
  QueryGetCategorySchemaByStoreId,
};
