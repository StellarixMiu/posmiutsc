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
  GetCategorySchemaByStoreId,
  ProductToCategorySchema,
} from "./categoryModel";
import WithStoreId from "../../utils/withStoreId";
import ResponseData from "../../utils/responseHandler";
import createEditor from "../../utils/editor/editorController";
import verifyCookies from "../../utils/cookiesHandler";
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
    const category_data: CreateCategorySchema =
      await CreateCategorySchema.parseAsync(req.body);
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(category_data.store_id);
    let products: Array<ProductSchemaWithId> = [];

    checkUserWorkAtStore(user, store._id);

    if (category_data.products.length !== 0) {
      const req_products: Array<ObjectId> = category_data.products.map(
        (product) => new ObjectId(product)
      );
      products = await Product.find({
        _id: { $in: req_products },
      })
        .sort({ _id: -1 })
        .toArray();
      const productsHasCategories: Array<CategorySchemaWithId> =
        await Category.find({
          "stores.products": { $in: products.map((value) => value._id) },
        }).toArray();

      products.forEach((value: ProductSchemaWithId) => {
        if (
          !store.products
            .map((value) => value.toString())
            .includes(value._id.toString())
        )
          throw new RequestError(
            404,
            "Not Found!!!",
            "Product is not available in store"
          );
      });
      if (productsHasCategories.length !== 0)
        throw new RequestError(
          400,
          "Bad Request!!!",
          "Product already has a category assigned"
        );
    }

    const editor: EditorSchema = await createEditor(user._id.toString());
    let category: CategorySchemaWithId = await Category.findOneAndUpdate(
      {
        $and: [
          {
            $or: [{ name: category_data.name }],
          },
          {
            $or: [{ stores: { $elemMatch: { id: store._id } } }],
          },
        ],
      },
      {
        $push: {
          stores: {
            id: store._id,
            products: products.map((value) => value._id),
          },
        },
      },
      { returnDocument: "after" }
    ).then(async (value) => {
      if (
        value &&
        value.stores
          .map((val) => val.id.toString())
          .includes(store._id.toString())
      )
        throw new RequestError(
          400,
          "Bad Request!!!",
          "Store already has the category"
        );

      const { insertedId } = await Category.insertOne({
        name: category_data.name,
        stores: [
          {
            id: store._id,
            products: products.map((value) => value._id),
          },
        ],
      });
      return await Category.findOne({
        _id: new ObjectId(insertedId),
      }).then((value) => {
        if (value === null)
          throw new RequestError(404, "Not Found!!!", "Category not found");
        return value;
      });
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
        store: {
          id: store._id,
          products: products.map(
            ({ created, updated, ...metadata }) => metadata
          ),
        },
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
    const category_data: WithStoreId = await WithStoreId.parseAsync(req.query);
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
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const store_id = req.params.id;
    const { limit, from } = await GetCategorySchemaByStoreId.parseAsync(
      req.query
    );
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(store_id);

    checkUserWorkAtStore(user, store._id);

    const selected_categories: Array<Object> = [];
    const skip: number = from ? from : 0;
    const store_categories: Array<ObjectId> = store.categories.map(
      (category) => new ObjectId(category)
    );
    const categories: Array<CategorySchemaWithId> = await Category.find({
      _id: { $in: store_categories },
    })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    categories.forEach((category) => {
      const { stores, ...metadata } = category;
      selected_categories.push({
        ...metadata,
        store: category.stores.filter(
          (selected) => selected.id.toString() === store._id.toString()
        )[0],
      });
    });
    const response = new ResponseData(
      true,
      200,
      "Get category by store id successfully!!",
      selected_categories
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

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
    const category_data: WithStoreId = await WithStoreId.parseAsync(req.body);
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
