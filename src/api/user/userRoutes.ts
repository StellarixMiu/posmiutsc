import { Router } from "express";
import { verifyToken } from "../../middleware/tokenMiddleware";
import { PatchUserSchema } from "./userModel";
import {
  deleteUserById,
  getUserByToken,
  getUserById,
  patchUserById,
  requestAccess,
} from "./userController";
import ParamsWithId from "../../utils/params/paramsModel";
import requestValidation from "../../middleware/validationMiddleware";

const router = Router();

router.get(
  "/:id/token",
  requestValidation({
    params: ParamsWithId,
  }),
  requestAccess
);

router.get("/", verifyToken(), getUserByToken);

router.get(
  "/:id",
  requestValidation({
    params: ParamsWithId,
  }),
  verifyToken(),
  getUserById
);

// router.patch(
//   "/:id",
//   requestValidation({
//     params: ParamsWithId,
//     body: PatchUserSchema,
//   }),
//   verifyToken(),
//   patchUserById
// );

// TODO
// router.patch(
//   "/:id/password",
//   requestValidation({
//     params: ParamsWithId,
//     body: UserSchema,
//   }),
//   verifyToken(),
//   deleteUserById
// );

// router.delete(
//   "/:id",
//   requestValidation({
//     params: ParamsWithId,
//   }),
//   verifyToken(),
//   deleteUserById
// );

export default router;
