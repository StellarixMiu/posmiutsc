import * as dotenv from "dotenv";
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
  Image,
  ImageSchema,
  ImageSchemaWithId,
} from "../../utils/image/imageModel";
import {
  checkFileType,
  createPresignedUrl,
  deleteR2Image,
  getImage,
  postR2Image,
} from "../../utils/image/imageController";
import {
  CreateProductSchema,
  GetProductSchemaByStoreId,
  PatchProductSchema,
  PatchStockProductSchema,
  Product,
  ProductSchema,
  ProductSchemaWithId,
} from "./productModel";
import createEditor from "../../utils/editor/editorController";
import ResponseData from "../../utils/responseHandler";
import verifyCookies from "../../utils/cookiesHandler";
import BodyWithStoreId from "../../utils/body/BodyWithStoreId";
import checkForIdMismatch from "../../utils/CheckId";
import checkUserWorkAtStore from "../../utils/checkWorkAt";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

const r2_endpoint: string = process.env.R2_PUBLIC_ENDPOINT as string;

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
    const req_product: CreateProductSchema =
      await CreateProductSchema.parseAsync(req.body);
    const { sku, upc, description, base_price, weight, ...product_data } =
      req_product;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(product_data.store_id);

    checkUserWorkAtStore(user, store._id);

    const editor: EditorSchema = await createEditor(user._id.toString());
    let product: ProductSchema | ProductSchemaWithId =
      await ProductSchema.parseAsync({
        ...product_data,
        sku: sku || "",
        upc: upc || "",
        description: description || "",
        base_price: base_price || product_data.price,
        slug: product_data.name.split(" ").join("-"),
        created: editor,
        updated: editor,
      });

    await Product.insertOne(product).then(async (value) => {
      if (!value.acknowledged) throw new Error();

      store = await Store.findOneAndUpdate(
        { _id: store._id },
        {
          $push: { products: value.insertedId },
          $set: { updated: editor },
        },
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
    const product_id = req.params.id;
    const file = req.file;
    const { store_id } = await BodyWithStoreId.parseAsync(req.body);
    const { auth_token } = req.body;

    if (!file) throw new RequestError(404, "Not Found!!!", "File not found");

    const r2_data = await postR2Image(file, store_id.toString());

    if (!r2_data)
      throw new RequestError(
        500,
        "Internal Server Error!!!",
        "Failed to upload image to Cloudflare R2"
      );

    checkForIdMismatch(auth_token.id, cookies.id);
    checkFileType(file);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(store_id);
    let product: ProductSchemaWithId = await getProduct(product_id);
    let image: ImageSchema | ImageSchemaWithId = await ImageSchema.parseAsync({
      path: file.path,
      full_path: `${r2_endpoint}${file.filename.split(".")[0]}`,
      name: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      e_tag: r2_data.ETag,
      version_id: r2_data.VersionId,
      owner_id: user._id,
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
        {
          $set: {
            image: value.insertedId,
            updated: editor,
          },
        },
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
    await deleteR2Image(req.file?.filename.split(".")[0]);
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

    let image: ImageSchemaWithId;
    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(product_data.store_id);
    let product: ProductSchemaWithId = await Product.findOne({
      _id: new ObjectId(product_id),
    }).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "Product not found");
      return value;
    });

    if (product.image.toString().length !== 0) {
      image = await getImage(product.image.toString());
      product.image = image.full_path;
    }

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
    const store_id = req.params.id;
    const { limit } = await GetProductSchemaByStoreId.parseAsync(req.body);
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let image: ImageSchemaWithId;
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

      if (product.image.toString().length !== 0 || product.image) {
        image = await getImage(product.image.toString());
        product.image = image.full_path;
      }

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
    const slug = req.params.slug;
    let product: ProductSchemaWithId = await Product.findOne({
      slug: slug,
    }).then((value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "Product not found");
      return value;
    });

    if (product.image.toString().length !== 0) {
      const image: ImageSchemaWithId = await getImage(product.image.toString());
      const signed_url = await createPresignedUrl(image.name.split(".")[0]);

      if (!signed_url)
        throw new RequestError(
          500,
          "Internal Server Error!!!",
          "Failed to get image from Cloudflare R2"
        );

      product.image = signed_url;
    }

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

export const patchProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const product_id = req.params.id;
    const { store_id, ...update_data }: PatchProductSchema =
      await PatchProductSchema.parseAsync(req.body);
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(store_id);
    let product: ProductSchemaWithId = await getProduct(product_id);

    checkUserWorkAtStore(user, store._id);
    checkStoreHasProduct(product, store);

    const editor: EditorSchema = await createEditor(user._id.toString());

    product = await Product.findOneAndUpdate(
      { _id: product._id },
      {
        $set: {
          slug: update_data.slug || product.slug,
          name: update_data.name || product.name,
          price: update_data.price || product.price,
          isFavorite: update_data.isFavorite || product.isFavorite,
          weight: update_data.weight || product.weight,
          description: update_data.description || product.description,
          base_price: update_data.base_price || product.base_price,
          sku: update_data.sku || product.sku,
          upc: update_data.upc || product.upc,
          dimensions: update_data.dimensions || product.dimensions,
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
      {
        $set: {
          updated: editor,
        },
      },
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

export const patchProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const product_id = req.params.id;
    const file = req.file;
    const { store_id } = await BodyWithStoreId.parseAsync(req.body);
    const { auth_token } = req.body;

    if (!file) throw new RequestError(404, "Not Found!!!", "File not found");

    checkForIdMismatch(auth_token.id, cookies.id);
    checkFileType(file);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(store_id);
    let product: ProductSchemaWithId = await getProduct(product_id);

    if (!product.image)
      throw new RequestError(404, "Not Found!!!", "Product image not found");

    let image: ImageSchemaWithId = await getImage(product.image.toString());

    const store_employees_mapping: Array<string> = store.employees.map(
      (value) => value.user.toString()
    );
    store_employees_mapping.push(store.owner.toString());

    checkUserWorkAtStore(user, store._id);
    checkStoreHasProduct(product, store);

    if (!store_employees_mapping.includes(image.owner_id.toString()))
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

    const r2_data = await postR2Image(file, store_id.toString());

    if (!r2_data)
      throw new RequestError(
        500,
        "Internal Server Error!!!",
        "Failed to upload image to Cloudflare R2"
      );

    await deleteR2Image(image.name.split(".")[0]);

    const new_image = await ImageSchema.parseAsync({
      path: file.path,
      full_path: `${r2_endpoint}${file.filename.split(".")[0]}`,
      name: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      e_tag: r2_data.ETag,
      version_id: r2_data.VersionId,
      owner_id: user._id,
    });
    const editor: EditorSchema = await createEditor(user._id.toString());

    await Image.deleteOne({ _id: image._id });
    await Image.insertOne(new_image).then(async (value) => {
      if (!value.acknowledged) throw new Error();

      product = await Product.findOneAndUpdate(
        { _id: product._id },
        {
          $set: {
            image: value.insertedId,
            updated: editor,
          },
        },
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
      "Patch product image successfully!!",
      metadata
    );
    return res.status(200).json(response);
  } catch (error: any) {
    await deleteR2Image(req.file?.filename.split(".")[0]);
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
      {
        $set: {
          updated: editor,
        },
      },
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

    if (product.image || product.image.length !== 0) {
      let image: ImageSchemaWithId = await getImage(product.image.toString());
      await deleteR2Image(image?.name.split(".")[0]);
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
