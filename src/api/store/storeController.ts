import * as dotenv from "dotenv";
import { ObjectId } from "mongodb";
import { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { getUser } from "../user/userController";
import { RequestError } from "../../middleware/errorMiddleware";
import { EditorSchema } from "../../utils/editor/editorModel";
import { User, UserSchemaWithId } from "../user/userModel";
import {
  checkFileType,
  deleteR2Image,
  getImage,
  postR2Image,
} from "../../utils/image/imageController";
import {
  Image,
  ImageSchema,
  ImageSchemaWithId,
} from "../../utils/image/imageModel";
import {
  CreateStoreSchema,
  GetStoreSchemaByUserId,
  PatchStoreSchema,
  Store,
  StoreSchema,
  StoreSchemaWithId,
} from "./storeModel";
import ResponseData from "../../utils/responseHandler";
import createEditor from "../../utils/editor/editorController";
import verifyCookies from "../../utils/cookiesHandler";
import checkForIdMismatch from "../../utils/CheckId";
import checkUserWorkAtStore from "../../utils/checkWorkAt";

dotenv.config({
  path: `.env.${process.env.NODE_ENV || "development"}`,
});

const r2_endpoint: string = process.env.R2_PUBLIC_ENDPOINT as string;

const censoredCredentials = (
  start: number,
  end: number,
  value: Array<string>
): string => {
  const final_value: Array<string> = [];
  value.forEach((val: string, i: number) => {
    if (i < value.length - end && i > start) {
      final_value.push("*");
    } else {
      final_value.push(val);
    }
  });
  return final_value.join("");
};

export const getStore = async (
  store_id: string
): Promise<StoreSchemaWithId> => {
  const store = await Store.findOne({
    _id: new ObjectId(store_id),
  }).then((value) => {
    if (value === null)
      throw new RequestError(404, "Not Found!!!", "Store not found");
    return value;
  });
  return store;
};

export const createStore = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const store_data: CreateStoreSchema = await CreateStoreSchema.parseAsync(
      req.body
    );
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);

    const editor: EditorSchema = await createEditor(user._id.toString());
    let store: StoreSchema | StoreSchemaWithId = await StoreSchema.parseAsync({
      ...store_data,
      owner: user._id,
      created: editor,
      updated: editor,
    });

    await Store.insertOne(store).then(async (value) => {
      if (!value.acknowledged) throw new Error();

      user = await User.findOneAndUpdate(
        { _id: user._id },
        { $push: { work_at: value.insertedId } },
        { returnDocument: "after" }
      ).then((value) => {
        if (value === null)
          throw new RequestError(404, "Not Found!!!", "User not found");
        return value;
      });
    });

    const {
      created,
      updated,
      activities,
      transactions,
      payment_methods,
      ...metadata
    } = store;
    const response = new ResponseData(
      true,
      200,
      "Create store successfully!!",
      metadata
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const addStoreLogo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const store_id = req.params.id;
    const file = req.file;
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

    if (store.logo)
      throw new RequestError(400, "Bad Request!!!", "Store already has a logo");

    const editor: EditorSchema = await createEditor(user._id.toString());

    await Image.insertOne(image).then(async (value) => {
      if (!value.acknowledged) throw new Error();

      store = await Store.findOneAndUpdate(
        { _id: store._id },
        {
          $set: {
            logo: value.insertedId,
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

    const {
      created,
      updated,
      activities,
      transactions,
      payment_methods,
      ...metadata
    } = store;
    const response = new ResponseData(
      true,
      200,
      "Add store logo successfully!!",
      metadata
    );
    return res.status(200).json(response);
  } catch (error: any) {
    await deleteR2Image(req.file?.filename.split(".")[0]);
    next(error);
  }
};

// export const addStoreEmployee = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
//     const store_id = req.params.id;
//     const { auth_token } = req.body;

//     checkForIdMismatch(auth_token.id, cookies.id);

//     let user: UserSchemaWithId = await getUser(auth_token.id);
//     let store: StoreSchemaWithId = await getStore(store_id);

//     checkUserWorkAtStore(user, store._id);

//     const response = new ResponseData(
//       true,
//       200,
//       "Add store employee successfully!!",
//       "metadata"
//     );
//     return res.status(200).json(response);
//   } catch (error: any) {
//     next(error);
//   }
// };

export const getStoreById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const store_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await Store.findOne({
      _id: new ObjectId(store_id),
    }).then(async (value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "Store not found");
      return value;
    });

    checkUserWorkAtStore(user, store._id);

    if (store.logo) {
      const logo: ImageSchemaWithId = await getImage(store.logo.toString());
      store.logo = logo.full_path;
    }

    const {
      created,
      updated,
      activities,
      transactions,
      payment_methods,
      ...metadata
    } = store;
    const response = new ResponseData(
      true,
      200,
      "Get store by id successfully!!",
      metadata
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const getStoreByUserId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const stores: Array<StoreSchemaWithId> = [];
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const store_data: GetStoreSchemaByUserId =
      await GetStoreSchemaByUserId.parseAsync(req.body);
    const user_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);
    checkForIdMismatch(auth_token.id, user_id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    for (const store_id of user.work_at) {
      let store: StoreSchemaWithId = await Store.findOne({
        _id: new ObjectId(store_id),
      }).then(async (value) => {
        if (value === null)
          throw new RequestError(404, "Not Found!!!", "Store not found");
        return value;
      });

      if (store.logo) {
        const logo: ImageSchemaWithId = await getImage(store.logo.toString());
        store.logo = logo.full_path;
      }

      stores.push(store);
    }

    const response = new ResponseData(
      true,
      200,
      "Get store by user id successfully!!",
      stores.map((store) => {
        const {
          created,
          updated,
          activities,
          transactions,
          payment_methods,
          ...data
        } = store;
        return data;
      })
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const getStoreOwner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const store_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await Store.findOne({
      _id: new ObjectId(store_id),
    }).then(async (value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "Store not found");
      return value;
    });

    checkUserWorkAtStore(user, store._id);

    let owner: UserSchemaWithId = await getUser(store.owner.toString());
    const { _id, name, email, phone_number } = owner;
    const censored_email = censoredCredentials(
      0,
      4,
      email.split("@")[0].split("")
    );
    const censored_phone_number = censoredCredentials(
      2,
      3,
      phone_number.split("")
    );
    const response = new ResponseData(
      true,
      200,
      "Get store owner successfully!!",
      {
        _id,
        name,
        email: `${censored_email}@${email.split("@")[1]}`,
        phone_number: censored_phone_number,
      }
    );

    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const patchStore = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const store_data: PatchStoreSchema = await PatchStoreSchema.parseAsync(
      req.body
    );
    const store_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(store_id);

    checkUserWorkAtStore(user, store._id);

    const email = store_data.email ? store_data.email : store.email;
    const editor = await createEditor(user._id.toString());

    store = await Store.findOneAndUpdate(
      { _id: store._id },
      {
        $set: {
          name: store_data.name || store.name,
          address: store_data.address || store.address,
          phone_number: store_data.phone_number || store.phone_number,
          email: email || "",
          type: store_data.type || store.type,
          updated: editor,
        },
      },
      { returnDocument: "after" }
    ).then(async (value) => {
      if (value === null)
        throw new RequestError(404, "Not Found!!!", "Store not found");
      return value;
    });

    const {
      created,
      updated,
      activities,
      transactions,
      payment_methods,
      ...metadata
    } = store;
    const response = new ResponseData(
      true,
      200,
      "Patch store by id successfully!!",
      metadata
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};

export const patchStoreLogo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const store_id = req.params.id;
    const file = req.file;
    const { auth_token } = req.body;

    if (!file) throw new RequestError(404, "Not Found!!!", "File not found");

    checkForIdMismatch(auth_token.id, cookies.id);
    checkFileType(file);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(store_id);

    if (!store.logo)
      throw new RequestError(404, "Not Found!!!", "Store logo not found");

    let image: ImageSchemaWithId = await getImage(store.logo.toString());

    const store_employees_mapping: Array<string> = store.employees.map(
      (value) => value.user.toString()
    );
    store_employees_mapping.push(store.owner.toString());

    checkUserWorkAtStore(user, store._id);

    if (!store_employees_mapping.includes(image.owner_id.toString()))
      throw new RequestError(
        403,
        "Forbidden!!!",
        "You do not have access rights to this image"
      );
    if (store.logo.toString() !== image._id.toString())
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

      store = await Store.findOneAndUpdate(
        { _id: store._id },
        {
          $set: {
            logo: value.insertedId,
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

    const {
      created,
      updated,
      activities,
      transactions,
      payment_methods,
      ...metadata
    } = store;
    const response = new ResponseData(
      true,
      200,
      "Patch store logo successfully!!",
      metadata
    );
    return res.status(200).json(response);
  } catch (error: any) {
    await deleteR2Image(req.file?.filename.split(".")[0]);
    next(error);
  }
};

// export const deleteStoreLogo = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
//     const store_data: StoreLogoSchema = await StoreLogoSchema.parseAsync(
//       req.body
//     );
//     const store_id = req.params.id;
//     const { auth_token } = req.body;

//     checkForIdMismatch(auth_token.id, cookies.id);

//     let user: UserSchemaWithId = await getUser(auth_token.id);
//     let store: StoreSchemaWithId = await getStore(store_id);
//     let image: ImageSchemaWithId = await getImage(store_data.image_id);

//     const store_employees_mapping = store.employees.map((value) =>
//       value.user.toString()
//     );
//     store_employees_mapping.push(store.owner.toString());

//     checkUserWorkAtStore(user, store._id);

//     if (!store_employees_mapping.includes(image.owner.toString()))
//       throw new RequestError(
//         403,
//         "Forbidden!!!",
//         "You do not have access rights to this image"
//       );
//     if (store.logo.toString() !== image._id.toString())
//       throw new RequestError(
//         400,
//         "Bad Request!!!",
//         "Mismatch between `store_logo_id` and `image_id`"
//       );

//     const editor: EditorSchema = await createEditor(user._id.toString());

//     fs.removeSync(image.path);
//     await Image.deleteOne({ _id: image._id }).then(async (value) => {
//       if (!value.acknowledged && value.deletedCount === 0) throw new Error();

//       store = await Store.findOneAndUpdate(
//         { _id: store._id },
//         {
//           $set: {
//             logo: "",
//             updated: editor,
//           },
//         },
//         { returnDocument: "after" }
//       ).then((value) => {
//         if (value === null)
//           throw new RequestError(404, "Not Found!!!", "Store not found");
//         return value;
//       });
//     });

//     const response = new ResponseData(
//       true,
//       200,
//       "Delete store image successfully!!",
//       {}
//     );
//     return res.status(200).json(response);
//   } catch (error: any) {
//     next(error);
//   }
// };

export const deleteStore = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies: JwtPayload = verifyCookies(req.cookies.refresh_token);
    const store_id = req.params.id;
    const { auth_token } = req.body;

    checkForIdMismatch(auth_token.id, cookies.id);

    let user: UserSchemaWithId = await getUser(auth_token.id);
    let store: StoreSchemaWithId = await getStore(store_id);

    checkUserWorkAtStore(user, store._id);

    if (store.owner.toString() !== user._id.toString())
      throw new RequestError(
        403,
        "Forbidden!!!",
        "You do not have the necessary permissions to delete this store"
      );

    const store_employees_mapping = store.employees.map((value) =>
      value.user.toString()
    );
    store_employees_mapping.push(store.owner.toString());

    await Store.deleteOne({ _id: store._id }).then(async (value) => {
      if (!value.acknowledged && value.deletedCount === 0) throw new Error();

      for (let i = 0; i < store_employees_mapping.length; i++) {
        let employee: UserSchemaWithId = await getUser(
          store_employees_mapping[i]
        );
        const remaining_work_at = employee.work_at.filter(
          (value) => value.toString() !== store._id.toString()
        );

        employee = await User.findOneAndUpdate(
          { _id: employee._id },
          {
            $set: { work_at: remaining_work_at },
          },
          { returnDocument: "after" }
        ).then((value) => {
          if (value === null)
            throw new RequestError(404, "Not Found!!!", "User not found");
          return value;
        });

        if (employee._id.toString() === user._id.toString()) user = employee;
      }
    });

    const response = new ResponseData(
      true,
      200,
      "Delete store successfully!!",
      {}
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};
