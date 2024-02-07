import { z } from "zod";
import { ObjectId, WithId } from "mongodb";
import { database } from "../../utils/databaseConnection";
import { EditorSchema } from "../../utils/editor/editorModel";
import WithStoreId from "../../utils/withStoreId";

enum TransactionsStatusEnum {
  FAILED = "FAILED",
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
}

enum PaymentMethodsEnum {
  CASH = "CASH",
  PAYMENT_GATEWAY = "PAYMENT_GATEWAY",
}

const TransactionsSchema = z.object({
  customer: z.instanceof(ObjectId).or(
    z.string().refine((value) => {
      try {
        return new ObjectId(value);
      } catch (error) {
        return false;
      }
    }, "The provided value is not a valid ObjectId")
  ),
  products: z
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
      quantity: z.number().nonnegative().finite(),
    })
    .array(),
  total_amount: z.number().nonnegative().finite(),
  total_price: z.number().nonnegative().finite(),
  status: z
    .nativeEnum(TransactionsStatusEnum)
    .default(TransactionsStatusEnum.PENDING),
  payment_details: z
    .object({
      methods: z.nativeEnum(PaymentMethodsEnum),
      details: z.string(),
    })
    .default({
      methods: PaymentMethodsEnum.CASH,
      details: "",
    }),
  applied_coupons: z
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
    .array()
    .max(3)
    .default([]),
  created: EditorSchema,
  updated: EditorSchema,
});
const CreateTransactionsSchema = TransactionsSchema.pick({
  customer: true,
  products: true,
  applied_coupons: true,
}).merge(WithStoreId);
const GetTransactionsSchemaByStoreId = z.object({
  from: z.number().nonnegative().finite().default(0).optional(),
  limit: z.number().nonnegative().finite().gte(1).lte(99).default(20),
});
const GetTransactionsSchemaByCustomerId = WithStoreId.merge(
  z
    .object({
      customer_id: z.string().refine(
        (value) => {
          try {
            return new ObjectId(value);
          } catch (error) {
            return false;
          }
        },
        { message: "`customer_id` should be an valid ObjectId" }
      ),
    })
    .merge(
      z.object({
        from: z.number().nonnegative().finite().default(0).optional(),
        limit: z.number().nonnegative().finite().gte(1).lte(99).default(20),
      })
    )
);

const QueryGetTransactionsSchemaByStoreId = z.object({
  from: z
    .string()
    .default("0")
    .transform((value) => parseInt(value))
    .optional(),
  limit: z.string().transform((value) => parseInt(value)),
});

type TransactionsSchema = z.infer<typeof TransactionsSchema>;
type CreateTransactionsSchema = z.infer<typeof CreateTransactionsSchema>;
type GetTransactionsSchemaByStoreId = z.infer<
  typeof GetTransactionsSchemaByStoreId
>;
type GetTransactionsSchemaByCustomerId = z.infer<
  typeof GetTransactionsSchemaByCustomerId
>;
type TransactionsSchemaWithId = WithId<TransactionsSchema>;

type QueryGetTransactionsSchemaByStoreId = z.infer<
  typeof QueryGetTransactionsSchemaByStoreId
>;

const Transaction = database.collection<TransactionsSchema>("Transactions");

Transaction.createIndex({ customer: 1 });
Transaction.createIndex({ status: 1 });
Transaction.createIndex({ total_amount: 1 });
Transaction.createIndex({ total_price: 1 });

export {
  Transaction,
  TransactionsSchema,
  CreateTransactionsSchema,
  GetTransactionsSchemaByStoreId,
  GetTransactionsSchemaByCustomerId,
  TransactionsSchemaWithId,
  TransactionsStatusEnum,
  PaymentMethodsEnum,
  QueryGetTransactionsSchemaByStoreId,
};
