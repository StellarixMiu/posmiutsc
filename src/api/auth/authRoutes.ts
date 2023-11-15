import { Router } from "express";
import { SignupUserSchema, SinginUserSchema } from "../user/userModel";
import { signupUser, signinUser, signoutUser } from "./authController";
import requestValidation from "../../middleware/validationMiddleware";
import ParamsWithId from "../../utils/params/paramsModel";

const router = Router();

router.post(
  "/signup",
  requestValidation({
    body: SignupUserSchema,
  }),
  signupUser
);

router.post(
  "/signin",
  requestValidation({
    body: SinginUserSchema,
  }),
  signinUser
);

router.delete(
  "/signout/:id",
  requestValidation({
    params: ParamsWithId,
  }),
  signoutUser
);

export default router;
