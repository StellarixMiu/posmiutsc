import { ObjectId } from "mongodb";
import { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { getUser } from "../user/userController";
import { getStore } from "../store/storeController";
import { getProduct } from "../product/productController";
import { RequestError } from "../../middleware/errorMiddleware";
import { EditorSchema } from "../../utils/editor/editorModel";
import { UserSchemaWithId } from "../user/userModel";
import { Product, ProductSchemaWithId } from "../product/productModel";
import { Store, StoreSchemaWithId } from "../store/storeModel";
import {
  Category,
  CategorySchemaWithId,
  CreateCategorySchema,
  ProductToCategorySchema,
} from "./categoryModel";
import ResponseData from "../../utils/responseHandler";
import createEditor from "../../utils/editor/editorController";
import verifyCookies from "../../utils/cookiesHandler";
import BodyWithStoreId from "../../utils/body/BodyWithStoreId";
import checkForIdMismatch from "../../utils/CheckId";
import checkUserWorkAtStore from "../../utils/checkWorkAt";

const checkStoreHasCategory = (
  category: CategorySchemaWithId,
  store: StoreSchemaWithId
): void => {
  const stores = category.stores.map((val) => {
    return val.id.toString();
  });
  const store_id = store._id.toString();

  if (!stores.includes(store_id))
    throw new RequestError(
      404,
      "Not Found!!!",
      "Category not available in the store"
    );

  return;
};

export const getCategory = async (category_id: string) => {
  const category = await Category.findOne({
    _id: new ObjectId(category_id),
  }).then((value) => {
    if (value === null)
      throw new RequestError(404, "Not Found!!!", "Category not found");
    return value;
  });
  return category;
};

export const createCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const products: Array<string | ObjectId> = [];
    const category_data: CreateCategorySchema =
      await CreateCategorySchema.parseAsync(req.body);
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(category_data.store_id);

    checkUserWorkAtStore(user, store._id);

    if (category_data.products.length !== 0) {
      for (let i = 0; i < category_data.products.length; i++) {
        const product_id = category_data.products[i];
        const product: ProductSchemaWithId = await Product.findOne(
          new ObjectId(product_id)
        ).then((value) => {
          if (value === null)
            throw new RequestError(404, "Not Found!!!", "Product not found");
          if (!store.products.includes(value._id))
            throw new RequestError(
              404,
              "Not Found!!!",
              "Product is not available in store"
            );
          return value;
        });
        products.push(product._id);
      }
    }

    const editor: EditorSchema = await createEditor(user._id.toString());
    let category: CategorySchemaWithId = await Category.findOneAndUpdate(
      { name: category_data.name },
      {
        $push: {
          stores: {
            id: category_data.store_id,
            products: products || [],
          },
        },
      },
      { returnDocument: "after" }
    ).then(async (value) => {
      if (value !== null)
        throw new RequestError(
          400,
          "Bad Request!!!",
          "Store already has the category"
        );

      const created_category = await Category.insertOne({
        name: category_data.name,
        stores: [{ id: store._id, products: [] }],
      });
      const new_value = await Category.findOne({
        _id: new ObjectId(created_category.insertedId),
      }).then((new_created) => {
        if (new_created === null)
          throw new RequestError(404, "Not Found!!!", "Category not found");
        return new_created;
      });

      value = new_value;
      return value;
    });

    store = await Store.findOneAndUpdate(
      { _id: store._id },
      { $push: { categories: category._id }, $set: { updated: editor } },
      { returnDocument: "after" }
    ).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "Store not found");
      return value;
    });

    const { stores, ...metadata } = category;
    const response = new ResponseData(
      true,
      200,
      "Create category successfully!!",
      {
        ...metadata,
        store: { id: store._id, products: [] },
      }
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const AddToCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const products: Array<String | ObjectId> = [];
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const category_data: ProductToCategorySchema =
      await ProductToCategorySchema.parseAsync(req.body);
    const category_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(category_data.store_id);
    let category: CategorySchemaWithId = await getCategory(category_id);

    checkUserWorkAtStore(user, store._id);
    checkStoreHasCategory(category, store);

    const selected_store = category.stores.filter(
      (selected) => selected.id.toString() === store._id.toString()
    )[0];
    const store_products_mapping = store.products.map((value) =>
      value.toString()
    );
    const selected_product_mapping = selected_store.products.map((value) =>
      value.toString()
    );

    for (const product_id of category_data.products) {
      let product: ProductSchemaWithId = await getProduct(
        product_id.toString()
      );

      if (!store_products_mapping.includes(product._id.toString()))
        throw new RequestError(
          404,
          "Not Found!!!",
          "Product not available in the store"
        );
      if (selected_product_mapping.includes(product._id.toString()))
        throw new RequestError(
          400,
          "Bad Request!!!",
          "Product already exist in the category"
        );

      products.push(product._id);
    }

    category = await Category.findOneAndUpdate(
      { _id: category._id },
      {
        $set: {
          "stores.$[store].products": products.concat(selected_store.products),
        },
      },
      { arrayFilters: [{ "store.id": store._id }], returnDocument: "after" }
    ).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "Category not found");
      return value;
    });

    const { stores, ...metadata } = category;
    const response = new ResponseData(
      true,
      200,
      "Add products to category successfully!!",
      {
        ...metadata,
        store: stores.filter(
          (selected) => selected.id.toString() === store._id.toString()
        )[0],
      }
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const getCategoryById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const category_data: BodyWithStoreId = await BodyWithStoreId.parseAsync(
      req.body
    );
    const category_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(category_data.store_id);
    let category: CategorySchemaWithId = await Category.findOne({
      _id: new ObjectId(category_id),
    }).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "Category not found");
      return value;
    });

    checkUserWorkAtStore(user, store._id);
    checkStoreHasCategory(category, store);

    const { stores, ...metadata } = category;
    const response = new ResponseData(
      true,
      200,
      "Get category by id successfully!!",
      {
        ...metadata,
        store: stores.filter(
          (selected) => selected.id.toString() === store._id.toString()
        )[0],
      }
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const getCategoryByStoreId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const categories: Array<Object> = [];
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const store_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(store_id);

    checkUserWorkAtStore(user, store._id);

    for (const category_id of store.categories) {
      let category: CategorySchemaWithId = await Category.findOne({
        _id: new ObjectId(category_id.toString()),
      }).then((value) => {
        if (value === null)
          throw new RequestError(404, "Not Found!!!", "Category not found");
        return value;
      });

      checkStoreHasCategory(category, store);

      const { stores, ...metadata } = category;

      categories.push({
        ...metadata,
        store: stores.filter(
          (selected) => selected.id.toString() === store._id.toString()
        )[0],
      });
    }

    const response = new ResponseData(
      true,
      200,
      "Get category by store id successfully!!",
      categories
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};
// TODO line 181

export const removeProductFromCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const category_data: ProductToCategorySchema =
      await ProductToCategorySchema.parseAsync(req.body);
    const category_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(category_data.store_id);
    let category: CategorySchemaWithId = await getCategory(category_id);

    checkUserWorkAtStore(user, store._id);
    checkStoreHasCategory(category, store);

    const selected_store = category.stores.filter(
      (selected) => selected.id.toString() === store._id.toString()
    )[0];
    const store_products_mapping = store.products.map((value) =>
      value.toString()
    );
    const selected_product_mapping = selected_store.products.map((value) =>
      value.toString()
    );
    let category_products_mapping = selected_store.products.map((value) =>
      value.toString()
    );

    for (let i = 0; i < category_data.products.length; i++) {
      const product_id = category_data.products[i];
      let product: ProductSchemaWithId = await getProduct(
        product_id.toString()
      );

      if (!store_products_mapping.includes(product._id.toString()))
        throw new RequestError(
          404,
          "Not Found!!!",
          "Product not available in the store"
        );
      if (!selected_product_mapping.includes(product._id.toString()))
        throw new RequestError(
          404,
          "Not Found!!!",
          "Product not available in the category"
        );

      category_products_mapping = category_products_mapping.filter(
        (val) => val !== product._id.toString()
      );
    }

    category = await Category.findOneAndUpdate(
      { _id: category._id },
      {
        $set: {
          "stores.$[store].products": category_products_mapping.map(
            (value) => new ObjectId(value)
          ),
        },
      },
      { arrayFilters: [{ "store.id": store._id }], returnDocument: "after" }
    ).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "Category not found");
      return value;
    });

    const { stores, ...metadata } = category;
    const response = new ResponseData(
      true,
      200,
      "Remove products from category successfully!!",
      {
        ...metadata,
        store: stores.filter(
          (selected) => selected.id.toString() === store._id.toString()
        )[0],
      }
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const category_data: BodyWithStoreId = await BodyWithStoreId.parseAsync(
      req.body
    );
    const category_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(category_data.store_id);
    let category: CategorySchemaWithId = await getCategory(category_id);

    checkUserWorkAtStore(user, store._id);
    checkStoreHasCategory(category, store);

    const category_stores_mapping = category.stores.map((value) => {
      return { id: value.id.toString(), products: value.products };
    });
    const remaining_category_store = category_stores_mapping.filter(
      (selected) => selected.id !== store._id.toString()
    );
    const remaining_categories = store.categories.filter(
      (id) => id.toString() !== category._id.toString()
    );
    const editor: EditorSchema = await createEditor(user._id.toString());

    category = await Category.findOneAndUpdate(
      { _id: category._id },
      {
        $set: {
          name: category.name,
          stores: remaining_category_store.map((value) => {
            return { id: new ObjectId(value.id), products: value.products };
          }),
        },
      },
      { returnDocument: "after" }
    ).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "Category not found");
      return value;
    });

    store = await Store.findOneAndUpdate(
      { _id: store._id },
      {
        $set: {
          categories: remaining_categories,
          updated: editor,
        },
      },
      { returnDocument: "after" }
    ).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "Store not found");
      return value;
    });

    const response = new ResponseData(
      true,
      200,
      "Delete category successfully!!",
      {}
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};
