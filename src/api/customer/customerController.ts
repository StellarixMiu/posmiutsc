import { ObjectId } from "mongodb";
import { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { getUser } from "../user/userController";
import { getStore } from "../store/storeController";
import { RequestError } from "../../middleware/errorMiddleware";
import { EditorSchema } from "../../utils/editor/editorModel";
import { UserSchemaWithId } from "../user/userModel";
import { Store, StoreSchemaWithId } from "../store/storeModel";
import {
  CreateCustomerSchema,
  Customer,
  CustomerSchema,
  CustomerSchemaWithId,
  GetCustomerSchemaById,
  GetCustomerSchemaByStoreId,
  PatchCustomerSchema,
} from "./customerModel";
import createEditor from "../../utils/editor/editorController";
import ResponseData from "../../utils/responseHandler";
import verifyCookies from "../../utils/cookiesHandler";
import checkForIdMismatch from "../../utils/CheckId";
import checkUserWorkAtStore from "../../utils/checkWorkAt";

export const getCustomer = async (
  customer_id: string
): Promise<CustomerSchemaWithId> => {
  const customer = await Customer.findOne({
    _id: new ObjectId(customer_id),
  }).then((value) => {
    if (value === null)
      throw new RequestError(404, "Not Found!!!", "Customer not found");
    return value;
  });
  return customer;
};

export const createCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const customer_data: CreateCustomerSchema =
      await CreateCustomerSchema.parseAsync(req.body);
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(customer_data.store_id);

    checkUserWorkAtStore(user, store._id);

    const editor: EditorSchema = await createEditor(user._id.toString());
    const customer = await CustomerSchema.parseAsync(customer_data);

    await Customer.insertOne(customer).then(async (value) => {
      if (value.acknowledged) {
        store = await Store.findOneAndUpdate(
          { _id: store._id },
          {
            $push: { customers: value.insertedId },
            $set: { updated: editor },
          },
          { returnDocument: "after" }
        ).then((value) => {
          if (value === null)
            throw new RequestError(404, "Not Found!!!", "Store not found");
          return value;
        });
      }
    });

    const { transactions, ...metadata } = customer;
    const response = new ResponseData(
      true,
      200,
      "Create customer successfully!!",
      metadata
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const getCustomerById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const customer_data: GetCustomerSchemaById =
      await GetCustomerSchemaById.parseAsync(req.body);
    const customer_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(customer_data.store_id);
    let customer: CustomerSchemaWithId = await Customer.findOne({
      _id: new ObjectId(customer_id),
    }).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "Customer not found");
      return value;
    });

    checkUserWorkAtStore(user, store._id);

    const store_customer_mapping = store.customers.map((value) =>
      value.toString()
    );

    if (!store_customer_mapping.includes(customer_id))
      throw new RequestError(
        404,
        "Not Found!!!",
        "Customer not available in the store"
      );

    const response = new ResponseData(
      true,
      200,
      "Get customer by id successfully!!",
      customer
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const getCustomerByStoreId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customers: Array<CustomerSchemaWithId> = [];
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const customer_data = await GetCustomerSchemaByStoreId.parseAsync(req.body); // TODO  using limit
    const store_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(store_id);

    checkUserWorkAtStore(user, store._id);

    for (const customer of store.customers) {
      const selected_customer: CustomerSchemaWithId = await Customer.findOne({
        _id: new ObjectId(customer),
      }).then((value) => {
        if (value === null)
          throw new RequestError(404, "Not Found!!!", "Customer not found");
        return value;
      });

      customers.push(selected_customer);
    }

    const response = new ResponseData(
      true,
      200,
      "Get customer by store id successfully!!",
      customers
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const patchCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const customer_data: PatchCustomerSchema =
      await PatchCustomerSchema.parseAsync(req.body);
    const customer_id = req.params.id;
    const { auth_token } = req.body;
    const { store_id, ...update_data } = customer_data;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(customer_data.store_id);
    let customer: CustomerSchemaWithId = await getCustomer(customer_id);

    checkUserWorkAtStore(user, store._id);

    const store_customer_mapping = store.customers.map((value) =>
      value.toString()
    );

    if (!store_customer_mapping.includes(customer._id.toString()))
      throw new RequestError(
        404,
        "Not Found!!!",
        "Customer not available in the store"
      );
    if (!update_data.name) update_data.name = customer.name;
    if (!update_data.phone_number)
      update_data.phone_number = customer.phone_number;
    if (!update_data.address) update_data.address = customer.address;

    customer = await Customer.findOneAndUpdate(
      { _id: customer._id },
      { $set: { ...update_data } },
      { returnDocument: "after" }
    ).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "Customer not found");
      return value;
    });

    const { transactions, ...metadata } = customer;
    const response = new ResponseData(
      true,
      200,
      "Patch customer successfully!!",
      metadata
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const deleteCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const customer_data: GetCustomerSchemaById =
      await GetCustomerSchemaById.parseAsync(req.body);
    const customer_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(customer_data.store_id);
    let customer: CustomerSchemaWithId = await getCustomer(customer_id);

    checkUserWorkAtStore(user, store._id);

    const editor: EditorSchema = await createEditor(user._id.toString());
    const store_customer_mapping = store.customers.map((value) =>
      value.toString()
    );
    const remaining_customer = store.customers.filter(
      (value) => value.toString() !== customer._id.toString()
    );

    if (!store_customer_mapping.includes(customer._id.toString()))
      throw new RequestError(
        404,
        "Not Found!!!",
        "Customer not available in the store"
      );

    await Customer.deleteOne({ _id: customer._id }).then(async (value) => {
      if (!value.acknowledged && value.deletedCount === 0) throw new Error();

      store = await Store.findOneAndUpdate(
        { _id: store._id },
        {
          $set: {
            updated: editor,
            customers: remaining_customer,
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
      "Delete customer successfully!!",
      {}
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};
