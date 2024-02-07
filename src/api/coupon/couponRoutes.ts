import { Router } from "express";
import { verifyToken } from "../../middleware/tokenMiddleware";
import {
  CreateCouponSchema,
  GetCouponSchemaByStoreId,
  PatchCouponSchema,
  QueryGetCouponSchemaByStoreId,
} from "./couponModel";
import {
  createCoupon,
  deleteCoupon,
  getCouponById,
  getCouponByStoreId,
  patchCoupon,
} from "./couponController";
import queryParse from "../../middleware/queryMiddleware";
import WithStoreId from "../../utils/withStoreId";
import ParamsWithId from "../../utils/params/paramsModel";
import requestValidation from "../../middleware/validationMiddleware";

const router = Router();

router.post(
  "/",
  requestValidation({ body: CreateCouponSchema }),
  verifyToken(),
  createCoupon
);

router.get(
  "/:id",
  requestValidation({
    params: ParamsWithId,
    query: WithStoreId,
  }),
  verifyToken(),
  getCouponById
);

router.get(
  "/store/:id",
  queryParse(QueryGetCouponSchemaByStoreId),
  requestValidation({
    params: ParamsWithId,
    query: GetCouponSchemaByStoreId,
  }),
  verifyToken(),
  getCouponByStoreId
);

router.patch(
  "/:id",
  requestValidation({
    params: ParamsWithId,
    body: PatchCouponSchema,
  }),
  verifyToken(),
  patchCoupon
);

router.delete(
  "/:id",
  requestValidation({
    params: ParamsWithId,
    body: WithStoreId,
  }),
  verifyToken(),
  deleteCoupon
);

export default router;
