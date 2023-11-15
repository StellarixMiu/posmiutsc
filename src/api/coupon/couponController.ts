import { ObjectId } from "mongodb";
import { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { getUser } from "../user/userController";
import { getStore } from "../store/storeController";
import { EditorSchema } from "../../utils/editor/editorModel";
import { RequestError } from "../../middleware/errorMiddleware";
import { UserSchemaWithId } from "../user/userModel";
import { Store, StoreSchemaWithId } from "../store/storeModel";
import {
  Coupon,
  CouponSchema,
  CouponSchemaWithId,
  CouponTypeEnum,
  CreateCouponSchema,
  GetCouponSchemaById,
  GetCouponSchemaByStoreId,
  PatchCouponSchema,
} from "./couponModel";
import createEditor from "../../utils/editor/editorController";
import ResponseData from "../../utils/responseHandler";
import verifyCookies from "../../utils/cookiesHandler";
import BodyWithStoreId from "../../utils/body/BodyWithStoreId";
import checkForIdMismatch from "../../utils/CheckId";
import checkUserWorkAtStore from "../../utils/checkWorkAt";

const checkCouponType = (
  coupon: CreateCouponSchema | PatchCouponSchema
): void => {
  const { type, discount } = coupon;
  if (type !== CouponTypeEnum.PERCENT) return;
  if (discount <= 100) return;

  throw new RequestError(
    400,
    "Bad Request!!!",
    "Discount percentage cannot more than 100%"
  );
};

export const checkCouponDate = (coupon: CreateCouponSchema): void => {
  const { starts_date, ends_date } = coupon;
  if (starts_date > ends_date)
    throw new RequestError(
      400,
      "Bad Request!!!",
      "End date should be later than the start date"
    );
};

export const checkStoreHasCoupon = (
  coupon: CouponSchemaWithId,
  store: StoreSchemaWithId
): void => {
  const stores = store.coupons.map((id) => {
    return id.toString();
  });
  const coupon_id = coupon._id.toString();

  if (!stores.includes(coupon_id))
    throw new RequestError(
      404,
      "Not Found!!!",
      "Coupon not available in the store"
    );

  return;
};

export const validateCoupon = (coupon: CouponSchemaWithId): void => {
  const date = new Date();
  if (!coupon.isActive)
    throw new RequestError(
      400,
      "Bad Request!!!",
      "Coupon is inactive and cannot be used for this transaction"
    );
  if (coupon.starts_date > date.toISOString())
    throw new RequestError(
      400,
      "Bad Request!!!",
      "Invalid coupon date and cannot be used for this transaction"
    );
  if (coupon.ends_date < date.toISOString())
    throw new RequestError(
      400,
      "Bad Request!!!",
      "Coupon has expired and cannot be used for this transaction"
    );

  return;
};

export const getCoupon = async (
  coupon_id: string
): Promise<CouponSchemaWithId> => {
  const coupon = await Coupon.findOne({
    _id: new ObjectId(coupon_id),
  }).then((value) => {
    if (value === null)
      throw new RequestError(404, "Not Found!!!", "Coupon not found");
    return value;
  });
  return coupon;
};

export const createCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const coupon_data: CreateCouponSchema = await CreateCouponSchema.parseAsync(
      req.body
    );
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(coupon_data.store_id);

    checkUserWorkAtStore(user, store._id);
    checkCouponType(coupon_data);
    checkCouponDate(coupon_data);

    const editor: EditorSchema = await createEditor(user._id.toString());
    const coupon: CouponSchema | CouponSchemaWithId =
      await CouponSchema.parseAsync({
        ...coupon_data,
        created: editor,
        updated: editor,
      });

    await Coupon.insertOne(coupon).then(async (value) => {
      if (value.acknowledged) {
        store = await Store.findOneAndUpdate(
          { _id: store._id },
          {
            $push: { coupons: value.insertedId },
            $set: { updated: editor },
          },
          { returnDocument: "after" }
        ).then((value) => {
          if (value === null)
            throw new RequestError(404, "Not Found!!!", "Coupon not found");
          return value;
        });
      }
    });

    const { created, updated, ...metadata } = coupon;
    const response = new ResponseData(
      true,
      200,
      "Create coupon successfully!!",
      metadata
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const getCouponById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const coupon_data: GetCouponSchemaById =
      await GetCouponSchemaById.parseAsync(req.body);
    const coupon_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(coupon_data.store_id);
    let coupon: CouponSchemaWithId = await Coupon.findOne({
      _id: new ObjectId(coupon_id),
    }).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "Coupon not found");
      return value;
    });

    checkUserWorkAtStore(user, store._id);
    checkStoreHasCoupon(coupon, store);

    const { created, updated, ...metadata } = coupon;
    const response = new ResponseData(
      true,
      200,
      "Get coupon by id successfully!!",
      metadata
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const getCouponByStoreId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const coupons: Array<CouponSchemaWithId> = [];
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const coupon_data = await GetCouponSchemaByStoreId.parseAsync(req.body); // TODO  using limit
    const store_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(store_id);

    checkUserWorkAtStore(user, store._id);

    for (const id of store.coupons) {
      const coupon: CouponSchemaWithId = await Coupon.findOne({
        _id: new ObjectId(id),
      }).then((value) => {
        if (value === null)
          throw new RequestError(404, "Not Found!!!", "Coupon not found");
        return value;
      });
      coupons.push(coupon);
    }

    const response = new ResponseData(
      true,
      200,
      "Get coupon by store id successfully!!",
      coupons.map((coupon) => {
        const { created, updated, ...data } = coupon;
        return data;
      })
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const patchCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const coupon_data: PatchCouponSchema = await PatchCouponSchema.parseAsync(
      req.body
    );
    const coupon_id = req.params.id;
    const { auth_token } = req.body;
    const { store_id, ...update_data } = coupon_data;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(coupon_data.store_id);
    let coupon: CouponSchemaWithId = await getCoupon(coupon_id);

    checkUserWorkAtStore(user, store._id);
    checkStoreHasCoupon(coupon, store);
    checkCouponType(coupon_data);

    const editor: EditorSchema = await createEditor(user._id.toString());

    if (!update_data.name) update_data.name = coupon.name;
    if (!update_data.type) update_data.type = coupon.type;
    if (!update_data.discount) update_data.discount = coupon.discount;
    if (!update_data.description) update_data.description = coupon.description;

    coupon = await Coupon.findOneAndUpdate(
      { _id: coupon._id },
      {
        $set: {
          ...update_data,
          updated: editor,
        },
      },
      { returnDocument: "after" }
    ).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "Coupon not found");
      return value;
    });

    const { created, updated, ...metadata } = coupon;
    const response = new ResponseData(
      true,
      200,
      "Patch coupon successfully!!",
      metadata
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const deleteCoupon = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const coupon_data: BodyWithStoreId = await BodyWithStoreId.parseAsync(
      req.body
    );
    const coupon_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(coupon_data.store_id);
    let coupon: CouponSchemaWithId = await getCoupon(coupon_id);

    checkUserWorkAtStore(user, store._id);
    checkStoreHasCoupon(coupon, store);

    const editor: EditorSchema = await createEditor(user._id.toString());
    const remaining_coupons = store.coupons.filter(
      (value) => value.toString() !== coupon._id.toString()
    );

    await Coupon.deleteOne({ _id: coupon._id }).then(async (value) => {
      if (!value.acknowledged && value.deletedCount === 0) throw new Error();

      store = await Store.findOneAndUpdate(
        { _id: store._id },
        {
          $set: {
            coupons: remaining_coupons,
            updated: editor,
          },
        },
        { returnDocument: "after" }
      ).then((value) => {
        if (value === null)
          throw new RequestError(404, "Not Found!!!", "Store not found");
        return value;
      });
    });

    const response = new ResponseData(
      true,
      200,
      "Delete coupon successfully!!",
      {}
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};
