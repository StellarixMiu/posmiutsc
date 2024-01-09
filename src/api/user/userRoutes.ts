import { Router } from "express";
import { verifyToken } from "../../middleware/tokenMiddleware";
import { PatchUserSchema } from "./userModel";
import {
  addUserImage,
  deleteUserById,
  getUserById,
  patchUserById,
  patchUserImage,
  requestAccess,
} from "./userController";
import upload from "../../middleware/imageMiddleware";
import ParamsWithId from "../../utils/params/paramsModel";
import requestValidation from "../../middleware/validationMiddleware";

const router = Router();

router.post(
  "/:id/image",
  upload.single("image"),
  requestValidation({
    params: ParamsWithId,
  }),
  verifyToken(),
  addUserImage
);

router.get(
  "/:id/token",
  requestValidation({
    params: ParamsWithId,
  }),
  requestAccess
);

router.get(
  "/:id",
  requestValidation({
    params: ParamsWithId,
  }),
  verifyToken(),
  getUserById
);

router.patch(
  "/:id",
  requestValidation({
    params: ParamsWithId,
    body: PatchUserSchema,
  }),
  verifyToken(),
  patchUserById
);

router.patch(
  "/:id/image",
  upload.single("image"),
  requestValidation({
    params: ParamsWithId,
  }),
  verifyToken(),
  patchUserImage
);

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
