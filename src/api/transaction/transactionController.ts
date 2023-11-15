import { Request, Response, NextFunction } from "express";
import { getUser } from "../user/userController";
import { getStore } from "../store/storeController";
import {
  checkStoreHasCoupon,
  getCoupon,
  validateCoupon,
} from "../coupon/couponController";
import { getProduct } from "../product/productController";
import { getCustomer } from "../customer/customerController";
import { EditorSchema } from "../../utils/editor/editorModel";
import { RequestError } from "../../middleware/errorMiddleware";
import { UserSchemaWithId } from "../user/userModel";
import { ProductSchemaWithId } from "../product/productModel";
import { Store, StoreSchemaWithId } from "../store/storeModel";
import { Customer, CustomerSchemaWithId } from "../customer/customerModel";
import { CouponSchemaWithId, CouponTypeEnum } from "../coupon/couponModel";
import {
  CreateTransactionsSchema,
  TransactionsSchema,
  Transaction,
  TransactionsSchemaWithId,
} from "./transactionModel";
import createEditor from "../../utils/editor/editorController";
import ResponseData from "../../utils/responseHandler";
import verifyCookies from "../../utils/cookiesHandler";
import checkForIdMismatch from "../../utils/CheckId";
import checkUserWorkAtStore from "../../utils/checkWorkAt";

const checkStockAvailability = (
  product: ProductSchemaWithId,
  quantity: number
): void => {
  if (product.stock < quantity)
    throw new RequestError(
      400,
      "Bad Request!!!",
      "Insufficient stock, order cannot be processed"
    );

  return;
};

export const createTransaction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies = verifyCookies(req.cookies.refresh_token);
    const transaction_data: CreateTransactionsSchema =
      await CreateTransactionsSchema.parseAsync(req.body);
    const { auth_token } = req.body;
    const { products, applied_coupons } = transaction_data;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(transaction_data.store_id);
    let customer: CustomerSchemaWithId = await getCustomer(
      transaction_data.customer.toString()
    );
    let total_price: number = 0;
    let total_amount: number = 0;

    checkUserWorkAtStore(user, store._id);
    for (let i = 0; i < products.length; i++) {
      let product: ProductSchemaWithId = await getProduct(
        products[i].id.toString()
      );

      checkStockAvailability(product, products[i].quantity);

      total_price += product.price * products[i].quantity;
      total_amount += products[i].quantity;
    }

    if (applied_coupons.length !== 0) {
      for (let i = 0; i < applied_coupons.length; i++) {
        let coupon: CouponSchemaWithId = await getCoupon(
          applied_coupons[i].toString()
        );

        checkStoreHasCoupon(coupon, store);
        validateCoupon(coupon);

        if (coupon.type === CouponTypeEnum.PRICE) {
          total_price -= coupon.discount;
        }
        if (coupon.type === CouponTypeEnum.PERCENT) {
          const discount_price = total_price * (coupon.discount / 100);
          total_price -= discount_price;
        }
      }
    }

    const editor: EditorSchema = await createEditor(user._id.toString());

    let transaction: TransactionsSchema | TransactionsSchemaWithId =
      await TransactionsSchema.parseAsync({
        ...transaction_data,
        total_amount: products.length,
        total_price,
        created: editor,
        updated: editor,
      });

    await Transaction.insertOne(transaction).then(async (value) => {
      if (!value.acknowledged) throw new Error();

      store = await Store.findOneAndUpdate(
        { _id: store._id },
        {
          $push: { transactions: value.insertedId },
        },
        { returnDocument: "after" }
      ).then((value) => {
        if (value === null)
          throw new RequestError(404, "Not Found!!!", "Store not found");
        return value;
      });
      customer = await Customer.findOneAndUpdate(
        { _id: customer._id },
        {
          $push: { transactions: value.insertedId },
        },
        { returnDocument: "after" }
      ).then((value) => {
        if (value === null)
          throw new RequestError(404, "Not Found!!!", "Customer not found");
        return value;
      });
    });

    const { payment_details, created, updated, ...metadata } = transaction;
    const response = new ResponseData(
      true,
      200,
      "Create transaction successfully!!",
      metadata
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const getTransactionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = new ResponseData(
      true,
      200,
      "Get transaction by id successfully!!",
      "metadata"
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};
