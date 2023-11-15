import { Router } from "express";
import { verifyToken } from "../../middleware/tokenMiddleware";
import { createTransaction, getTransactionById } from "./transactionController";
import { CreateTransactionsSchema } from "./transactionModel";
import BodyWithStoreId from "../../utils/body/BodyWithStoreId";
import ParamsWithId from "../../utils/params/paramsModel";
import requestValidation from "../../middleware/validationMiddleware";

const router = Router();

router.post(
  "/",
  requestValidation({ body: CreateTransactionsSchema }),
  verifyToken(),
  createTransaction
);

router.get(
  "/:id",
  requestValidation({ params: ParamsWithId, body: BodyWithStoreId }),
  verifyToken(),
  getTransactionById
);

export default router;
