import { Router } from "express";
import { verifyToken } from "../../middleware/tokenMiddleware";
import {
  CreateCategorySchema,
  GetCategorySchemaByStoreId,
  ProductToCategorySchema,
} from "./categoryModel";
import {
  AddToCategory,
  createCategory,
  deleteCategory,
  getCategoryById,
  getCategoryByStoreId,
  removeProductFromCategory,
} from "./categoryController";
import ParamsWithId from "../../utils/params/paramsModel";
import BodyWithStoreId from "../../utils/body/BodyWithStoreId";
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
    body: BodyWithStoreId,
  }),
  verifyToken(),
  getCategoryById
);

router.get(
  "/store/:id",
  requestValidation({ params: ParamsWithId, body: GetCategorySchemaByStoreId }),
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
  requestValidation({ params: ParamsWithId, body: BodyWithStoreId }),
  verifyToken(),
  deleteCategory
);

export default router;
