import { z } from "zod";
import { WithId, ObjectId } from "mongodb";
import { database } from "../../utils/databaseConnection";
import { EditorSchema } from "../../utils/editor/editorModel";
import BodyWithStoreId from "../../utils/body/BodyWithStoreId";

const slugRegex = new RegExp(/^[a-zA-Z0-9-]*$/);
const DimensionsUnitEnum = ["MM", "CM", "M", "INCH"] as const;
const WeightUnitEnum = ["KG", "GRAM"] as const;

const ProductSchema = z.object({
  slug: z
    .string({
      required_error: "`slug` is required",
      invalid_type_error: "`slug` must be a string",
    })
    .min(3, "`slug` length must be more than 3")
    .refine(
      (value) => {
        return value && slugRegex.test(value);
      },
      { message: "`slug` should only contain numbers, letters, and minus sign" }
    ),
  name: z
    .string({
      required_error: "`name` is required",
      invalid_type_error: "`name` must be a string",
    })
    .min(3, "`name` length must be more than 3")
    .toLowerCase(),
  base_price: z.number().nonnegative().finite(),
  price: z.number().nonnegative().finite(),
  dimensions: z
    .object({
      width: z.number().nonnegative().finite().default(0),
      length: z.number().nonnegative().finite().default(0),
      height: z.number().nonnegative().finite().default(0),
      unit: z.enum(DimensionsUnitEnum).default("MM"),
    })
    .default({
      width: 0,
      length: 0,
      height: 0,
      unit: "MM",
    }),
  weight: z
    .object({
      value: z.number().nonnegative().finite().default(0),
      unit: z.enum(WeightUnitEnum).default("GRAM"),
    })
    .default({
      value: 0,
      unit: "GRAM",
    }),
  description: z
    .string({
      invalid_type_error: "`description` must be a string",
    })
    .optional(),
  isFavorite: z
    .boolean({
      required_error: "`isFavorite` is required",
      invalid_type_error: "`isFavorite` must be a boolean",
    })
    .default(false),
  image: z
    .instanceof(ObjectId)
    .or(
      z.string({
        required_error: "`image` is required",
        invalid_type_error: "`image` must be a string",
      })
    )
    .default(""),
  stock: z.number().nonnegative().finite(),
  sku: z
    .string({
      required_error: "`sku` is required",
      invalid_type_error: "`sku` must be a string",
    })
    .toUpperCase(),
  upc: z
    .string({
      required_error: "`upc` is required",
      invalid_type_error: "`upc` must be a string",
    })
    .toUpperCase(),
  created: EditorSchema,
  updated: EditorSchema,
});
const ProductImage = BodyWithStoreId.merge(
  z.object({
    image_id: z.string().refine(
      (value) => {
        try {
          return new ObjectId(value);
        } catch (error) {
          return false;
        }
      },
      { message: "`image_id` should be an valid ObjectId" }
    ),
  })
);
const CreateProductSchema = ProductSchema.omit({
  slug: true,
  created: true,
  updated: true,
  isFavorite: true,
  image: true,
})
  .partial({
    base_price: true,
    sku: true,
    upc: true,
  })
  .merge(BodyWithStoreId);
const GetProductSchemaByStoreId = z.object({
  limit: z.number().nonnegative().finite().gte(1).lte(10).default(5).optional(),
});
const GetProductSchemaBySlug = ProductSchema.pick({ slug: true });
const PatchProductSchema = ProductSchema.pick({
  slug: true,
  name: true,
  price: true,
  dimensions: true,
  weight: true,
  description: true,
  isFavorite: true,
  base_price: true,
  sku: true,
  upc: true,
})
  .partial()
  .merge(BodyWithStoreId);

const PatchStockProductSchema = BodyWithStoreId.merge(
  z.object({
    before: z.number().nonnegative().finite(),
    after: z.number().nonnegative().finite(),
  })
);

type ProductSchema = z.infer<typeof ProductSchema>;
type ProductImage = z.infer<typeof ProductImage>;
type CreateProductSchema = z.infer<typeof CreateProductSchema>;
type GetProductSchemaByStoreId = z.infer<typeof GetProductSchemaByStoreId>;
type GetProductSchemaBySlug = z.infer<typeof GetProductSchemaBySlug>;
type PatchProductSchema = z.infer<typeof PatchProductSchema>;
type PatchStockProductSchema = z.infer<typeof PatchStockProductSchema>;
type ProductSchemaWithId = WithId<ProductSchema>;

const Product = database.collection<ProductSchema>("Products");

Product.createIndex({ slug: 1 }, { unique: true });

export {
  Product,
  ProductSchema,
  ProductImage,
  CreateProductSchema,
  GetProductSchemaByStoreId,
  GetProductSchemaBySlug,
  PatchProductSchema,
  PatchStockProductSchema,
  ProductSchemaWithId,
  DimensionsUnitEnum,
};
