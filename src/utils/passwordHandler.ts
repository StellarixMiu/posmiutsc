import * as dotenv from "dotenv";
import * as bcrypt from "bcrypt";
import { RequestError } from "../middleware/errorMiddleware";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

const random_password: any = process.env.RANDOM_PASSWORD?.split("-");

export const encryptPassword = (password: string): string => {
  const removed_password = password.split("$2b$10$")[1];
  const encrypted_password = `${removed_password}${
    random_password[Math.floor(Math.random() * 14)]
  }`;
  return encrypted_password;
};

export const decryptPassword = (password: string): string => {
  const removed_password = password.slice(0, password.length - 25);
  const decrypted_password = `$2b$10$${removed_password}`;
  return decrypted_password;
};

export const passwordsMatch = async (
  input_password: string,
  stored_password: string
): Promise<void> => {
  const password = decryptPassword(stored_password);
  if (!bcrypt.compareSync(input_password, password))
    throw new RequestError(400, "Bad Request!!!", "Password doesn't match");
  return;
};
