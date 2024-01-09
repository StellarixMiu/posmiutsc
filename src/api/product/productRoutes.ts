import { Router } from "express";
import { verifyToken } from "../../middleware/tokenMiddleware";
import {
  CreateProductSchema,
  GetProductSchemaBySlug,
  GetProductSchemaByStoreId,
  PatchProductSchema,
  PatchStockProductSchema,
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
import ParamsWithId from "../../utils/params/paramsModel";
import BodyWithStoreId from "../../utils/body/BodyWithStoreId";
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
    body: BodyWithStoreId,
  }),
  verifyToken(),
  addProductImage
);

router.get(
  "/:id",
  requestValidation({
    params: ParamsWithId,
    body: BodyWithStoreId,
  }),
  verifyToken(),
  getProductById
);

router.get(
  "/store/:id",
  requestValidation({
    params: ParamsWithId,
    body: GetProductSchemaByStoreId,
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
    body: BodyWithStoreId,
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
    body: BodyWithStoreId,
  }),
  verifyToken(),
  deleteProduct
);

export default router;
