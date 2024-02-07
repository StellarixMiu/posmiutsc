import { Router } from "express";
import { verifyToken } from "../../middleware/tokenMiddleware";
import {
  CreateCustomerSchema,
  GetCustomerSchemaByStoreId,
  PatchCustomerSchema,
  QueryGetCustomerSchemaByStoreId,
} from "./customerModel";
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomerByStoreId,
  patchCustomer,
} from "./customerController";
import WithStoreId from "../../utils/withStoreId";
import ParamsWithId from "../../utils/params/paramsModel";
import requestValidation from "../../middleware/validationMiddleware";
import queryParse from "../../middleware/queryMiddleware";

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
    query: WithStoreId,
  }),
  verifyToken(),
  getCustomerById
);

router.get(
  "/store/:id",
  queryParse(QueryGetCustomerSchemaByStoreId),
  requestValidation({
    params: ParamsWithId,
    query: GetCustomerSchemaByStoreId,
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
    body: WithStoreId,
  }),
  verifyToken(),
  deleteCustomer
);

export default router;
