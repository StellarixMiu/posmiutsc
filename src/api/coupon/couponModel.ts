import { z } from "zod";
import { WithId } from "mongodb";
import { database } from "../../utils/databaseConnection";
import { EditorSchema } from "../../utils/editor/editorModel";
import WithStoreId from "../../utils/withStoreId";
import removeMultiWhitespace from "../../utils/removeMultiWhitespace";

enum CouponTypeEnum {
  PRICE = "PRICE",
  PERCENT = "PERCENT",
}

const CouponSchema = z.object({
  name: z
    .string({
      required_error: "`name` is required",
      invalid_type_error: "`name` must be a string",
    })
    .min(3, "`name` length must be more than 3")
    .transform((value) => removeMultiWhitespace(value)),
  description: z
    .string({
      invalid_type_error: "`name` must be a string",
    })
    .optional(),
  code: z
    .string({
      required_error: "`code` is required",
      invalid_type_error: "`code` must be a string",
    })
    .min(3, "`code` length must be more than 3")
    .regex(
      /^[a-zA-Z0-9]*$/,
      "The provided string contains special or invalid characters"
    )
    .toUpperCase(),
  type: z.nativeEnum(CouponTypeEnum).default(CouponTypeEnum.PRICE),
  discount: z.number().nonnegative().finite(),
  isActive: z.boolean().default(true),
  starts_date: z
    .string()
    .datetime({ offset: true })
    .or(z.date().default(new Date())),
  ends_date: z.string().datetime({ offset: true }),
  created: EditorSchema,
  updated: EditorSchema,
});
const CreateCouponSchema = CouponSchema.omit({
  isActive: true,
  created: true,
  updated: true,
}).merge(WithStoreId);
const GetCouponSchemaByStoreId = z.object({
  from: z.number().nonnegative().finite().default(0).optional(),
  limit: z.number().nonnegative().finite().gte(1).lte(99).default(20),
});
const PatchCouponSchema = CouponSchema.pick({
  name: true,
  description: true,
  type: true,
  discount: true,
}).merge(WithStoreId);

const QueryGetCouponSchemaByStoreId = z.object({
  from: z
    .string()
    .default("0")
    .transform((value) => parseInt(value))
    .optional(),
  limit: z.string().transform((value) => parseInt(value)),
});

type CouponSchema = z.infer<typeof CouponSchema>;
type CreateCouponSchema = z.infer<typeof CreateCouponSchema>;
type GetCouponSchemaById = z.infer<typeof WithStoreId>;
type GetCouponSchemaByStoreId = z.infer<typeof GetCouponSchemaByStoreId>;
type PatchCouponSchema = z.infer<typeof PatchCouponSchema>;
type CouponSchemaWithId = WithId<CouponSchema>;

type QueryGetCouponSchemaByStoreId = z.infer<
  typeof QueryGetCouponSchemaByStoreId
>;

const Coupon = database.collection<CouponSchema>("Coupons");

// Coupon.createIndex({ name: 1 });
Coupon.createIndex({ type: 1 });
Coupon.createIndex({ discount: 1 });
Coupon.createIndex({ code: 1 }, { unique: true });

export {
  Coupon,
  CouponSchema,
  CreateCouponSchema,
  GetCouponSchemaById,
  GetCouponSchemaByStoreId,
  PatchCouponSchema,
  CouponSchemaWithId,
  CouponTypeEnum,
  QueryGetCouponSchemaByStoreId,
};
