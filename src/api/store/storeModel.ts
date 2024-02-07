import { z } from "zod";
import { WithId, ObjectId } from "mongodb";
import { database } from "../../utils/databaseConnection";
import { EditorSchema } from "../../utils/editor/editorModel";
import removeMultiWhitespace from "../../utils/removeMultiWhitespace";

const StoreSchema = z.object({
  name: z
    .string({
      required_error: "`name` is required",
      invalid_type_error: "`name` must be a string",
    })
    .min(3, "`name` length must be more than 3")
    .toLowerCase()
    .transform((value) => removeMultiWhitespace(value)),
  address: z.string({
    required_error: "`address` is required",
    invalid_type_error: "`address` must be a string",
  }),
  phone_number: z
    .string({
      required_error: "`phone_number` is required",
      invalid_type_error: "`phone_number` must be a string",
    })
    .startsWith("628", "`phone_number` must an indonesian number")
    .min(10, "`phone_number` length must between 10 and 15 digits")
    .max(15, "`phone_number` length must between 10 and 15 digits"),
  email: z
    .string({
      required_error: "`email` is required",
      invalid_type_error: "`email` must be a string",
    })
    .email("`email` must be a valid email")
    .endsWith("@gmail.com", "`email` must be a valid email")
    .toLowerCase(),
  logo: z
    .instanceof(ObjectId)
    .or(
      z.string({
        required_error: "`logo` is required",
        invalid_type_error: "`logo` must be a string",
      })
    )
    .default(""),
  categories: z.instanceof(ObjectId).or(z.string()).array().default([]),
  owner: z.instanceof(ObjectId).or(
    z.string().refine(
      (value) => {
        try {
          return new ObjectId(value);
        } catch (error) {
          return false;
        }
      },
      { message: "`owner` should be an valid ObjectId" }
    )
  ),
  products: z.instanceof(ObjectId).or(z.string()).array().default([]),
  coupons: z.instanceof(ObjectId).or(z.string()).array().default([]),
  type: z
    .string({
      required_error: "`type` is required",
      invalid_type_error: "`type` must be a string",
    })
    .toLowerCase(),
  employees: z
    .object({
      user: z.instanceof(ObjectId).or(z.string()),
      assign_as: z.string({
        required_error: "`assign_as` is required",
        invalid_type_error: "`assign_as` must be a string",
      }),
    })
    .array()
    .default([]),
  customers: z.instanceof(ObjectId).or(z.string()).array().default([]),
  transactions: z.instanceof(ObjectId).or(z.string()).array().default([]),
  invoice: z
    .object({
      isEnable: z.boolean({
        required_error: "`isEnable` is required",
        invalid_type_error: "`isEnable` must be a boolean",
      }),
    })
    .default({
      isEnable: true,
    }),
  activities: z.instanceof(ObjectId).or(z.string()).array().default([]),
  website: z.instanceof(ObjectId).or(z.string()).default(""),
  created: EditorSchema,
  updated: EditorSchema,
  payment_methods: z
    .object({
      cash: z.boolean({
        required_error: "`cash` is required",
        invalid_type_error: "`cash` must be a boolean",
      }),
      payment_gateway: z.boolean({
        required_error: "`payment_gateway` is required",
        invalid_type_error: "`payment_gateway` must be a boolean",
      }),
    })
    .default({
      cash: true,
      payment_gateway: false,
    }),
});
const CreateStoreSchema = StoreSchema.pick({
  name: true,
  address: true,
  phone_number: true,
  email: true,
  type: true,
});
const GetStoreSchemaByUserId = z.object({
  from: z.number().nonnegative().finite().default(0).optional(),
  limit: z.number().nonnegative().finite().gte(1).lte(99).default(20),
});
const PatchStoreSchema = StoreSchema.pick({
  name: true,
  address: true,
  phone_number: true,
  email: true,
  type: true,
}).partial();

const QueryGetStoreSchemaByUserId = z.object({
  from: z
    .string()
    .default("0")
    .transform((value) => parseInt(value))
    .optional(),
  limit: z.string().transform((value) => parseInt(value)),
});

type StoreSchema = z.infer<typeof StoreSchema>;
type CreateStoreSchema = z.infer<typeof CreateStoreSchema>;
type GetStoreSchemaByUserId = z.infer<typeof GetStoreSchemaByUserId>;
type PatchStoreSchema = z.infer<typeof PatchStoreSchema>;
type StoreSchemaWithId = WithId<StoreSchema>;

type QueryGetStoreSchemaByUserId = z.infer<typeof QueryGetStoreSchemaByUserId>;

const Store = database.collection<StoreSchema>("Stores");

Store.createIndex({ phone_number: 1 }, { unique: true });
Store.createIndex({ email: 1 }, { unique: true });

export {
  Store,
  StoreSchema,
  CreateStoreSchema,
  GetStoreSchemaByUserId,
  PatchStoreSchema,
  StoreSchemaWithId,
  QueryGetStoreSchemaByUserId,
};
