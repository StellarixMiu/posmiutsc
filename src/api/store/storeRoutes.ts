import { Router } from "express";
import { verifyToken } from "../../middleware/tokenMiddleware";
import {
  CreateStoreSchema,
  GetStoreSchemaByUserId,
  PatchStoreSchema,
  StoreLogoSchema,
} from "./storeModel";
import {
  addStoreLogo,
  createStore,
  deleteStore,
  deleteStoreLogo,
  getStoreById,
  getStoreByUserId,
  getStoreLogo,
  patchStore,
} from "./storeController";
import upload from "../../middleware/imageMiddleware";
import ParamsWithId from "../../utils/params/paramsModel";
import requestValidation from "../../middleware/validationMiddleware";

const router = Router();

router.post(
  "/",
  requestValidation({
    body: CreateStoreSchema,
  }),
  verifyToken(),
  createStore
);

router.post(
  "/:id/logos",
  upload.single("image"),
  requestValidation({
    params: ParamsWithId,
  }),
  verifyToken(),
  addStoreLogo
);

// TODO EMPLOYEE
router.post(
  "/:id/employees/",
  requestValidation({ params: ParamsWithId }),
  verifyToken()
);

router.get(
  "/:id",
  requestValidation({
    params: ParamsWithId,
  }),
  verifyToken(),
  getStoreById
);

router.get(
  "/user/:id",
  requestValidation({
    params: ParamsWithId,
    body: GetStoreSchemaByUserId,
  }),
  verifyToken(),
  getStoreByUserId
);

router.get(
  "/:id/logos",
  requestValidation({
    params: ParamsWithId,
    body: StoreLogoSchema,
  }),
  verifyToken(),
  getStoreLogo
);

router.patch(
  "/:id",
  requestValidation({
    params: ParamsWithId,
    body: PatchStoreSchema,
  }),
  verifyToken(),
  patchStore
);

router.delete(
  "/:id/logos",
  requestValidation({
    params: ParamsWithId,
    body: StoreLogoSchema,
  }),
  verifyToken(),
  deleteStoreLogo
);

router.delete(
  "/:id",
  requestValidation({
    params: ParamsWithId,
  }),
  verifyToken(),
  deleteStore
);

export default router;
