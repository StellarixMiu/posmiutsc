import { Router } from "express";
import { verifyToken } from "../../middleware/tokenMiddleware";
import {
  CreateCouponSchema,
  GetCouponSchemaById,
  GetCouponSchemaByStoreId,
  PatchCouponSchema,
} from "./couponModel";
import {
  createCoupon,
  deleteCoupon,
  getCouponById,
  getCouponByStoreId,
  patchCoupon,
} from "./couponController";
import ParamsWithId from "../../utils/params/paramsModel";
import requestValidation from "../../middleware/validationMiddleware";
import BodyWithStoreId from "../../utils/body/BodyWithStoreId";

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
    body: GetCouponSchemaById,
  }),
  verifyToken(),
  getCouponById
);

router.get(
  "/store/:id",
  requestValidation({
    params: ParamsWithId,
    body: GetCouponSchemaByStoreId,
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
    body: BodyWithStoreId,
  }),
  verifyToken(),
  deleteCoupon
);

export default router;
