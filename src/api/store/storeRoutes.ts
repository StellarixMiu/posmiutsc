import { Router } from "express";
import { verifyToken } from "../../middleware/tokenMiddleware";
import {
  CreateStoreSchema,
  GetStoreSchemaByUserId,
  PatchStoreSchema,
  QueryGetStoreSchemaByUserId,
} from "./storeModel";
import {
  addStoreLogo,
  createStore,
  deleteStore,
  getStoreById,
  getStoreByUserId,
  getStoreOwner,
  patchStore,
  patchStoreLogo,
} from "./storeController";
import upload from "../../middleware/imageMiddleware";
import ParamsWithId from "../../utils/params/paramsModel";
import requestValidation from "../../middleware/validationMiddleware";
import queryParse from "../../middleware/queryMiddleware";

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
  "/:id/logo",
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
  queryParse(QueryGetStoreSchemaByUserId),
  requestValidation({
    params: ParamsWithId,
    query: GetStoreSchemaByUserId,
  }),
  verifyToken(),
  getStoreByUserId
);

router.get(
  "/:id/owner",
  requestValidation({
    params: ParamsWithId,
  }),
  verifyToken(),
  getStoreOwner
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

router.patch(
  "/:id/logo",
  upload.single("image"),
  requestValidation({
    params: ParamsWithId,
  }),
  verifyToken(),
  patchStoreLogo
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
