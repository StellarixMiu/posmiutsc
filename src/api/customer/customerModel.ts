import { z } from "zod";
import { ObjectId, WithId } from "mongodb";
import { database } from "../../utils/databaseConnection";
import removeMultiWhitespace from "../../utils/removeMultiWhitespace";
import WithStoreId from "../../utils/withStoreId";

const CustomerSchema = z.object({
  name: z
    .string({
      required_error: "`name` is required",
      invalid_type_error: "`name` must be a string",
    })
    .min(3, "`name` length must be more than 3")
    .transform((value) => removeMultiWhitespace(value)),
  phone_number: z
    .string({
      required_error: "`phone_number` is required",
      invalid_type_error: "`phone_number` must be a string",
    })
    .startsWith("628", "`phone_number` must an indonesian number")
    .min(10, "`phone_number` length must between 10 and 15 digits")
    .max(15, "`phone_number` length must between 10 and 15 digits"),
  transactions: z.instanceof(ObjectId).array().default([]),
  address: z
    .string({
      required_error: "`address` is required",
      invalid_type_error: "`address` must be a string",
    })
    .optional()
    .default(""),
});
const CreateCustomerSchema = CustomerSchema.omit({
  transactions: true,
}).merge(WithStoreId);
const GetCustomerSchemaByStoreId = z.object({
  from: z.number().nonnegative().finite().default(0).optional(),
  limit: z.number().nonnegative().finite().gte(1).lte(99).default(20),
});
const PatchCustomerSchema = CreateCustomerSchema;

const QueryGetCustomerSchemaByStoreId = z.object({
  from: z
    .string()
    .default("0")
    .transform((value) => parseInt(value))
    .optional(),
  limit: z.string().transform((value) => parseInt(value)),
});

type CustomerSchema = z.infer<typeof CustomerSchema>;
type CreateCustomerSchema = z.infer<typeof CreateCustomerSchema>;
type GetCustomerSchemaByStoreId = z.infer<typeof GetCustomerSchemaByStoreId>;
type PatchCustomerSchema = z.infer<typeof PatchCustomerSchema>;
type CustomerSchemaWithId = WithId<CustomerSchema>;

type QueryGetCustomerSchemaByStoreId = z.infer<
  typeof QueryGetCustomerSchemaByStoreId
>;

const Customer = database.collection<CustomerSchema>("Customers");

Customer.createIndex({ name: 1 });
Customer.createIndex({ phone_number: 1 });

export {
  Customer,
  CustomerSchema,
  CreateCustomerSchema,
  GetCustomerSchemaByStoreId,
  PatchCustomerSchema,
  CustomerSchemaWithId,
  QueryGetCustomerSchemaByStoreId,
};
