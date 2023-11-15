import * as fs from "fs-extra";
import path from "path";
import { ObjectId } from "mongodb";
import { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { getUser } from "../user/userController";
import { getStore } from "../store/storeController";
import { RequestError } from "../../middleware/errorMiddleware";
import { EditorSchema } from "../../utils/editor/editorModel";
import { UserSchemaWithId } from "../user/userModel";
import { checkFileType, getImage } from "../../utils/image/imageController";
import { Store, StoreSchemaWithId } from "../store/storeModel";
import {
  Image,
  ImageSchema,
  ImageSchemaWithId,
} from "../../utils/image/imageModel";
import {
  CreateProductSchema,
  GetProductSchemaByStoreId,
  PatchProductSchema,
  PatchStockProductSchema,
  Product,
  ProductImage,
  ProductSchema,
  ProductSchemaWithId,
} from "./productModel";
import createEditor from "../../utils/editor/editorController";
import ResponseData from "../../utils/responseHandler";
import verifyCookies from "../../utils/cookiesHandler";
import BodyWithStoreId from "../../utils/body/BodyWithStoreId";
import checkForIdMismatch from "../../utils/CheckId";
import checkUserWorkAtStore from "../../utils/checkWorkAt";

const checkStoreHasProduct = (
  product: ProductSchemaWithId,
  store: StoreSchemaWithId
): void => {
  const stores = store.products.map((id) => {
    return id.toString();
  });
  const product_id = product._id.toString();

  if (!stores.includes(product_id))
    throw new RequestError(
      404,
      "Not Found!!!",
      "Product not available in the store"
    );

  return;
};

export const getProduct = async (
  product_id: string
): Promise<ProductSchemaWithId> => {
  const product = await Product.findOne({
    _id: new ObjectId(product_id),
  }).then((value) => {
    if (value === null)
      throw new RequestError(404, "Not Found!!!", "Product not found");
    return value;
  });
  return product;
};

export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const product_data: CreateProductSchema =
      await CreateProductSchema.parseAsync(req.body);
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(product_data.store_id);

    checkUserWorkAtStore(user, store._id);

    const editor: EditorSchema = await createEditor(user._id.toString());

    let product: ProductSchema | ProductSchemaWithId =
      await ProductSchema.parseAsync({
        ...product_data,
        slug: product_data.name.split(" ").join("-"),
        created: editor,
        updated: editor,
      });

    await Product.insertOne(product).then(async (value) => {
      if (!value.acknowledged) throw new Error();

      store = await Store.findOneAndUpdate(
        { _id: store._id },
        { $push: { products: value.insertedId }, $set: { updated: editor } },
        { returnDocument: "after" }
      ).then((value) => {
        if (value === null)
          throw new RequestError(404, "Not Found!!!", "Store not found");
        return value;
      });
    });

    const { created, updated, ...metadata } = product;
    const response = new ResponseData(
      true,
      200,
      "Create product successfully!!",
      metadata
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const addProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const product_data: BodyWithStoreId = await BodyWithStoreId.parseAsync(
      req.body
    );
    const product_id = req.params.id;
    const file = req.file;
    const { auth_token } = req.body;

    if (!file) throw new RequestError(404, "Not Found!!!", "File not found");

    checkForIdMismatch(auth_token.id, cookies.id);
    checkFileType(file);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(product_data.store_id);
    let product: ProductSchemaWithId = await getProduct(product_id);
    let image: ImageSchema | ImageSchemaWithId = await ImageSchema.parseAsync({
      path: file.path,
      name: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      owner: user._id,
    });

    checkUserWorkAtStore(user, store._id);
    checkStoreHasProduct(product, store);

    if (product.image)
      throw new RequestError(
        400,
        "Bad Request!!!",
        "Product already has an image"
      );

    const editor: EditorSchema = await createEditor(user._id.toString());

    await Image.insertOne(image).then(async (value) => {
      if (!value.acknowledged) throw new Error();

      product = await Product.findOneAndUpdate(
        { _id: product._id },
        { $set: { image: value.insertedId, updated: editor } },
        { returnDocument: "after" }
      ).then((value) => {
        if (value === null)
          throw new RequestError(404, "Not Found!!!", "Product not found");
        return value;
      });
    });

    const { created, updated, ...metadata } = product;
    const response = new ResponseData(
      true,
      200,
      "Add product image successfully!!",
      metadata
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const getProductById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const product_data: BodyWithStoreId = await BodyWithStoreId.parseAsync(
      req.body
    );
    const product_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(product_data.store_id);
    let product: ProductSchemaWithId = await Product.findOne({
      _id: new ObjectId(product_id),
    }).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "Product not found");
      return value;
    });

    checkUserWorkAtStore(user, store._id);
    checkStoreHasProduct(product, store);

    const { created, updated, ...metadata } = product;
    const response = new ResponseData(
      true,
      200,
      "Get product by id successfully!!",
      metadata
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const getProductByStoreId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const products: Array<ProductSchemaWithId> = [];
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const product_data: GetProductSchemaByStoreId =
      await GetProductSchemaByStoreId.parseAsync(req.body);
    const store_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(store_id);

    checkUserWorkAtStore(user, store._id);

    for (const product_id of store.products) {
      let product: ProductSchemaWithId = await Product.findOne({
        _id: new ObjectId(product_id),
      }).then((value) => {
        if (value === null)
          throw new RequestError(404, "Not Found!!!", "Product not found");
        return value;
      });
      products.push(product);
    }

    const response = new ResponseData(
      true,
      200,
      "Get product by store id successfully!!",
      products.map((product) => {
        const { created, updated, ...data } = product;
        return data;
      })
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const getProductBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const slug = req.params.slug;

    let user: UserSchemaWithId = await getUser(cookies.id);
    let product: ProductSchemaWithId = await Product.findOne({
      slug: slug,
    }).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "Product not found");
      return value;
    });

    const { _id, image, name, price, stock } = product;
    const response = new ResponseData(
      true,
      200,
      "Get product by slug successfully!!",
      { _id, image, name, price, stock }
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const getProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const product_data: ProductImage = await ProductImage.parseAsync(req.body);
    const product_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(product_data.store_id);
    let product: ProductSchemaWithId = await getProduct(product_id);
    let image: ImageSchemaWithId = await getImage(product_data.image_id);
    const store_employees_mapping = store.employees.map((value) =>
      value.user.toString()
    );
    store_employees_mapping.push(store.owner.toString());

    checkUserWorkAtStore(user, store._id);
    checkStoreHasProduct(product, store);

    if (!store_employees_mapping.includes(image.owner.toString()))
      throw new RequestError(
        403,
        "Forbidden!!!",
        "You do not have access rights to this image"
      );
    if (product.image.toString() !== image._id.toString())
      throw new RequestError(
        400,
        "Bad Request!!!",
        "Mismatch between `product_image_id` and `image_id`"
      );

    res.sendFile(
      image.name,
      {
        root: path.resolve("public/images"),
        dotfiles: "deny",
      },
      (err) => {
        if (err && err.name === "NotFoundError")
          err = new RequestError(
            404,
            `${err.message}!!!`,
            "Image path not found"
          );

        next(err);
      }
    );
    return res.status(200);
  } catch (error: any) {
    next(error);
  }
};

export const patchProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const product_data: PatchProductSchema =
      await PatchProductSchema.parseAsync(req.body);
    const product_id = req.params.id;
    const { auth_token } = req.body;
    const { store_id, ...update_data } = product_data;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(store_id);
    let product: ProductSchemaWithId = await getProduct(product_id);

    checkUserWorkAtStore(user, store._id);
    checkStoreHasProduct(product, store);

    const editor: EditorSchema = await createEditor(user._id.toString());
    const description = update_data.description
      ? update_data.description
      : product.description;

    product = await Product.findOneAndUpdate(
      { _id: product._id },
      {
        $set: {
          slug: update_data.slug ?? product.slug,
          name: update_data.name ?? product.name,
          price: update_data.price ?? product.price,
          isFavorite: update_data.isFavorite ?? product.isFavorite,
          weight: update_data.weight ?? product.weight,
          description: description ?? "",
          "dimensions.width":
            update_data.dimensions?.width ?? product.dimensions.width,
          "dimensions.height":
            update_data.dimensions?.height ?? product.dimensions.height,
          "dimensions.length":
            update_data.dimensions?.length ?? product.dimensions.length,
          "dimensions.unit":
            update_data.dimensions?.unit ?? product.dimensions.unit,
          updated: editor,
        },
      },
      { returnDocument: "after" }
    ).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "Product not found");
      return value;
    });
    store = await Store.findOneAndUpdate(
      { _id: store._id },
      { $set: { updated: editor } },
      { returnDocument: "after" }
    ).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "Store not found");
      return value;
    });

    const { created, updated, ...metadata } = product;
    const response = new ResponseData(
      true,
      200,
      "Patch product successfully!!",
      metadata
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const patchProductStock = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const product_data: PatchStockProductSchema =
      await PatchStockProductSchema.parseAsync(req.body);
    const product_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(product_data.store_id);
    let product: ProductSchemaWithId = await getProduct(product_id);

    checkUserWorkAtStore(user, store._id);
    checkStoreHasProduct(product, store);

    if (product.stock !== product_data.before)
      throw new RequestError(
        400,
        "Bad Request!!!",
        "Requested stock does not match the current product stock"
      );

    const editor: EditorSchema = await createEditor(user._id.toString());

    product = await Product.findOneAndUpdate(
      { _id: product._id },
      {
        $set: {
          stock: product_data.after,
          updated: editor,
        },
      },
      { returnDocument: "after" }
    ).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "Product not found");
      return value;
    });
    store = await Store.findOneAndUpdate(
      { _id: store._id },
      { $set: { updated: editor } },
      { returnDocument: "after" }
    ).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "Store not found");
      return value;
    });

    const { created, updated, ...metadata } = product;
    const response = new ResponseData(
      true,
      200,
      "Patch product successfully!!",
      metadata
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const deleteProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const product_data: ProductImage = await ProductImage.parseAsync(req.body);
    const product_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(product_data.store_id);
    let product: ProductSchemaWithId = await getProduct(product_id);
    let image: ImageSchemaWithId = await getImage(product_data.image_id);

    const store_employees_mapping: Array<string> = store.employees.map(
      (value) => value.user.toString()
    );
    store_employees_mapping.push(store.owner.toString());

    checkUserWorkAtStore(user, store._id);
    checkStoreHasProduct(product, store);

    if (!store_employees_mapping.includes(image.owner.toString()))
      throw new RequestError(
        403,
        "Forbidden!!!",
        "You do not have access rights to this image"
      );
    if (product.image.toString() !== image._id.toString())
      throw new RequestError(
        400,
        "Bad Request!!!",
        "Mismatch between `product_image_id` and `image_id`"
      );

    const editor: EditorSchema = await createEditor(user._id.toString());

    fs.removeSync(image.path);
    await Image.deleteOne({ _id: image._id }).then(async (value) => {
      if (!value.acknowledged && value.deletedCount === 0) throw new Error();

      product = await Product.findOneAndUpdate(
        { _id: product._id },
        { $set: { image: "", updated: editor } },
        { returnDocument: "after" }
      ).then((value) => {
        if (value === null)
          throw new RequestError(404, "Not Found!!!", "Product not found");
        return value;
      });
      store = await Store.findOneAndUpdate(
        { _id: store._id },
        { $set: { updated: editor } },
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
      "Delete product image successfully!!",
      {}
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const product_data: BodyWithStoreId = await BodyWithStoreId.parseAsync(
      req.body
    );
    const product_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(product_data.store_id);
    let product: ProductSchemaWithId = await getProduct(product_id);

    checkUserWorkAtStore(user, store._id);
    checkStoreHasProduct(product, store);

    if (product.image) {
      let image: ImageSchemaWithId = await getImage(product.image.toString());

      fs.removeSync(image.path);
      await Image.deleteOne({ _id: image._id }).then((value) => {
        if (!value.acknowledged && value.deletedCount === 0) throw new Error();
      });
    }

    const editor: EditorSchema = await createEditor(user._id.toString());
    const remaining_products = store.products.filter(
      (value) => value.toString() !== product._id.toString()
    );

    await Product.deleteOne({ _id: product._id }).then(async (value) => {
      if (!value.acknowledged && value.deletedCount === 0) throw new Error();

      store = await Store.findOneAndUpdate(
        { _id: store._id },
        {
          $set: {
            updated: editor,
            products: remaining_products,
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
      "Delete product successfully!!",
      {}
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};
