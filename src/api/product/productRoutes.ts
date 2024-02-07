import { Router } from "express";
import { verifyToken } from "../../middleware/tokenMiddleware";
import {
  CreateProductSchema,
  GetProductSchemaBySlug,
  GetProductSchemaByStoreId,
  PatchProductSchema,
  PatchStockProductSchema,
  QueryGetProductSchemaByStoreId,
} from "./productModel";
import {
  createProduct,
  getProductById,
  getProductByStoreId,
  getProductBySlug,
  patchProduct,
  addProductImage,
  deleteProduct,
  patchProductStock,
  patchProductImage,
} from "./productController";
import upload from "../../middleware/imageMiddleware";
import queryParse from "../../middleware/queryMiddleware";
import WithStoreId from "../../utils/withStoreId";
import ParamsWithId from "../../utils/params/paramsModel";
import requestValidation from "../../middleware/validationMiddleware";

const router = Router();

router.post(
  "/",
  requestValidation({
    body: CreateProductSchema,
  }),
  verifyToken(),
  createProduct
);

router.post(
  "/:id/images",
  upload.single("image"),
  requestValidation({
    params: ParamsWithId,
    body: WithStoreId,
  }),
  verifyToken(),
  addProductImage
);

router.get(
  "/:id",
  requestValidation({
    params: ParamsWithId,
    query: WithStoreId,
  }),
  verifyToken(),
  getProductById
);

router.get(
  "/store/:id",
  queryParse(QueryGetProductSchemaByStoreId),
  requestValidation({
    params: ParamsWithId,
    query: GetProductSchemaByStoreId,
  }),
  verifyToken(),
  getProductByStoreId
);

router.get(
  "/slug/:slug",
  requestValidation({
    params: GetProductSchemaBySlug,
  }),
  getProductBySlug
);

router.patch(
  "/:id",
  requestValidation({
    params: ParamsWithId,
    body: PatchProductSchema,
  }),
  verifyToken(),
  patchProduct
);

router.patch(
  "/:id/images",
  upload.single("image"),
  requestValidation({
    params: ParamsWithId,
    body: WithStoreId,
  }),
  verifyToken(),
  patchProductImage
);

router.patch(
  "/:id/stocks/",
  requestValidation({
    params: ParamsWithId,
    body: PatchStockProductSchema,
  }),
  verifyToken(),
  patchProductStock
);

router.delete(
  "/:id",
  requestValidation({
    params: ParamsWithId,
    body: WithStoreId,
  }),
  verifyToken(),
  deleteProduct
);

export default router;
