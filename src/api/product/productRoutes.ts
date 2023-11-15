import { Router } from "express";
import { verifyToken } from "../../middleware/tokenMiddleware";
import {
  CreateProductSchema,
  GetProductSchemaBySlug,
  GetProductSchemaByStoreId,
  PatchProductSchema,
  PatchStockProductSchema,
  ProductImage,
} from "./productModel";
import {
  createProduct,
  getProductById,
  getProductByStoreId,
  getProductBySlug,
  patchProduct,
  addProductImage,
  getProductImage,
  deleteProductImage,
  deleteProduct,
  patchProductStock,
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

router.get(
  "/:id/images",
  requestValidation({
    params: ParamsWithId,
    body: ProductImage,
  }),
  verifyToken(),
  getProductImage
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
  "/:id/stocks/",
  requestValidation({
    params: ParamsWithId,
    body: PatchStockProductSchema,
  }),
  verifyToken(),
  patchProductStock
);

router.delete(
  "/:id/images",
  requestValidation({
    params: ParamsWithId,
    body: ProductImage,
  }),
  verifyToken(),
  deleteProductImage
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
