import { z } from "zod";
import { WithId, ObjectId } from "mongodb";
import { database } from "../../utils/databaseConnection";

const accountTypeEnum = ["FREE", "PAID"] as const;
const multiWhitespaceRegex = new RegExp(/\s+/g);

const UserSchema = z.object({
  name: z
    .string({
      required_error: "`name` is required",
      invalid_type_error: "`name` must be a string",
    })
    .min(3, "`name` length must be more than 3")
    .toLowerCase()
    .transform((value) => value.replace(multiWhitespaceRegex, " ").trim()),
  email: z
    .string({
      required_error: "`email` is required",
      invalid_type_error: "`email` must be a string",
    })
    .email("`email` must be a valid email")
    .endsWith("@gmail.com", "`email` must be a valid email")
    .toLowerCase(),
  password: z
    .string({
      required_error: "`password` is required",
      invalid_type_error: "`password` must be a string",
    })
    .min(8, "`password` length must be more than 8"),
  phone_number: z
    .string({
      required_error: "`phone_number` is required",
      invalid_type_error: "`phone_number` must be a string",
    })
    .startsWith("628", "`phone_number` must an indonesian number")
    .min(10, "`phone_number` length must between 10 and 15 digits")
    .max(15, "`phone_number` length must between 10 and 15 digits")
    .regex(/^\d+$/, "`phone_number` must be a valid number"),
  account_type: z.enum(accountTypeEnum).default("FREE"),
  image: z.instanceof(ObjectId).or(z.string()).default(""),
  token: z
    .object({
      refresh: z.string().or(z.undefined()).optional(),
      reset: z.string().or(z.undefined()).optional(),
    })
    .default({
      refresh: "",
      reset: "",
    }),
  isVerified: z.boolean().default(false),
  work_at: z
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
    .default([]),
});
const SignupUserSchema = UserSchema.pick({
  name: true,
  email: true,
  password: true,
  phone_number: true,
});
const SinginUserSchema = UserSchema.pick({
  email: true,
  password: true,
});
const PatchUserSchema = UserSchema.pick({
  name: true,
  email: true,
  phone_number: true,
}).partial();

type UserSchema = z.infer<typeof UserSchema>;
type SignupUserSchema = z.infer<typeof SignupUserSchema>;
type SinginUserSchema = z.infer<typeof SinginUserSchema>;
type PatchUserSchema = z.infer<typeof PatchUserSchema>;

type UserSchemaWithId = WithId<UserSchema>;

const User = database.collection<UserSchema>("Users");

User.createIndex({ phone_number: 1 }, { unique: true });
User.createIndex({ email: 1 }, { unique: true });

export {
  UserSchema,
  SignupUserSchema,
  SinginUserSchema,
  PatchUserSchema,
  UserSchemaWithId,
  User,
};
