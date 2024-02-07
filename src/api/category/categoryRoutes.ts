import { Router } from "express";
import { verifyToken } from "../../middleware/tokenMiddleware";
import {
  CreateCategorySchema,
  GetCategorySchemaByStoreId,
  ProductToCategorySchema,
  QueryGetCategorySchemaByStoreId,
} from "./categoryModel";
import {
  AddToCategory,
  createCategory,
  deleteCategory,
  getCategoryById,
  getCategoryByStoreId,
  removeProductFromCategory,
} from "./categoryController";
import queryParse from "../../middleware/queryMiddleware";
import WithStoreId from "../../utils/withStoreId";
import ParamsWithId from "../../utils/params/paramsModel";
import requestValidation from "../../middleware/validationMiddleware";

const router = Router();

router.post(
  "/",
  requestValidation({
    body: CreateCategorySchema,
  }),
  verifyToken(),
  createCategory
);

router.post(
  "/:id/products",
  requestValidation({
    params: ParamsWithId,
    body: ProductToCategorySchema,
  }),
  verifyToken(),
  AddToCategory
);

router.get(
  "/:id",
  requestValidation({
    params: ParamsWithId,
    query: WithStoreId,
  }),
  verifyToken(),
  getCategoryById
);

router.get(
  "/store/:id",
  queryParse(QueryGetCategorySchemaByStoreId),
  requestValidation({
    params: ParamsWithId,
    query: GetCategorySchemaByStoreId,
  }),
  verifyToken(),
  getCategoryByStoreId
);

router.delete(
  "/:id/products",
  requestValidation({
    params: ParamsWithId,
    body: ProductToCategorySchema,
  }),
  verifyToken(),
  removeProductFromCategory
);

router.delete(
  "/:id",
  requestValidation({ params: ParamsWithId, body: WithStoreId }),
  verifyToken(),
  deleteCategory
);

export default router;
