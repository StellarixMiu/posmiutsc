import { Router } from "express";
import { verifyToken } from "../../middleware/tokenMiddleware";
import {
  CreateCustomerSchema,
  GetCustomerSchemaById,
  GetCustomerSchemaByStoreId,
  PatchCustomerSchema,
} from "./customerModel";
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomerByStoreId,
  patchCustomer,
} from "./customerController";
import requestValidation from "../../middleware/validationMiddleware";
import ParamsWithId from "../../utils/params/paramsModel";
import BodyWithStoreId from "../../utils/body/BodyWithStoreId";

const router = Router();

router.post(
  "/",
  requestValidation({
    body: CreateCustomerSchema,
  }),
  verifyToken(),
  createCustomer
);

router.get(
  "/:id",
  requestValidation({
    params: ParamsWithId,
    body: GetCustomerSchemaById,
  }),
  verifyToken(),
  getCustomerById
);

router.get(
  "/store/:id",
  requestValidation({
    params: ParamsWithId,
    body: GetCustomerSchemaByStoreId,
  }),
  verifyToken(),
  getCustomerByStoreId
);

router.patch(
  "/:id",
  requestValidation({
    params: ParamsWithId,
    body: PatchCustomerSchema,
  }),
  verifyToken(),
  patchCustomer
);

router.delete(
  "/:id",
  requestValidation({
    params: ParamsWithId,
    body: BodyWithStoreId,
  }),
  verifyToken(),
  deleteCustomer
);

export default router;
