import supertest from "supertest";
import { ObjectId } from "mongodb";
import { deleteR2Image } from "../../utils/image/imageController";
import { Image, ImageSchemaWithId } from "../../utils/image/imageModel";
import { Product, ProductSchemaWithId } from "./productModel";
import app from "../../app";
import createTest from "../../test/createTest";

let product: ProductSchemaWithId;
let image_id: string;

let user: any;
let store: any;

let second_user: any;
let second_store: any;

let lost_user: any;
let lost_store: any;

const invalid_params = "A5U8xXzRykJIO0mdBjRZD4Ym";
const invalid_bearer = "Bearer 6510f40adeb51c904347309d";
const invalid_store_id = "aSgN4FKmTp95Co12v1e9mAPp";

beforeAll(async () => {
  const users = await createTest();
  user = users[0];
  store = user.store;

  second_user = users[1];
  second_store = second_user.store;

  lost_user = users[2];
  lost_store = lost_user.store;
});

afterAll(async () => {
  const image: ImageSchemaWithId | null = await Image.findOne({
    _id: new ObjectId(image_id),
  });
  if (image?._id.toString().length !== 0) {
    await deleteR2Image(image?.name.split(".")[0]);
  }
});

describe("POST: `/api/products/`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      name: "Pizza",
      price: 49999,
      stock: 10,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post("/api/products/")
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);
    product = body.data;

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        base_price: 49999,
        description: "",
        dimensions: {
          height: 0,
          length: 0,
          unit: "MM",
          width: 0,
        },
        image: "",
        isFavorite: false,
        name: "pizza",
        price: 49999,
        sku: "",
        slug: "pizza",
        stock: 10,
        upc: "",
        weight: {
          unit: "GRAM",
          value: 0,
        },
      },
      message: "Create product successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong data type)", async () => {
      const payload = {
        name: "Ph",
        price: "49999",
        stock: -1,
        store_id: invalid_store_id,
      };
      const { status, body } = await supertest(app)
        .post("/api/products/")
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong 'stock' type)", async () => {
      const payload = {
        name: "Ice Tea",
        price: 49999,
        stock: -5,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .post("/api/products/")
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong 'price' type)", async () => {
      const payload = {
        name: "Lemon tea",
        price: "49999",
        stock: 45,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .post("/api/products/")
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong 'name' type)", async () => {
      const payload = {
        name: "Lt",
        price: 9999,
        stock: 45,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .post("/api/products/")
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong 'slug' type)", async () => {
      const payload = {
        name: "Lemon tea (Ice)",
        price: 6000,
        stock: 45,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .post("/api/products/")
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong 'store_id' type)", async () => {
      const payload = {
        name: "Lemon tea",
        price: 6000,
        stock: -5,
        store_id: invalid_store_id,
      };
      const { status, body } = await supertest(app)
        .post("/api/products/")
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });
  });

  it("Should return 401 (different auth id)", async () => {
    const payload = {
      name: "Pizza",
      price: 49999,
      stock: 10,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post("/api/products/")
      .set("Cookie", second_user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Mismatch between `auth_id` and `cookies_id`",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no cookies)", async () => {
    const payload = {
      name: "Pizza",
      price: 49999,
      stock: 10,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post("/api/products/")
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Request cookies not defined",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no auth header)", async () => {
    const payload = {
      name: "Pizza",
      price: 49999,
      stock: 10,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post("/api/products/")
      .set("Cookie", user.cookies)
      .send(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Authorization header is needed",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 403 (invalid auth header)", async () => {
    const payload = {
      name: "Pizza",
      price: 49999,
      stock: 10,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post("/api/products/")
      .set("Cookie", user.cookies)
      .set("Authorization", invalid_bearer)
      .send(payload);

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "Invalid token at authorization header",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  it("Should return 403 (no access store)", async () => {
    const payload = {
      name: "Pepperoni Pizza",
      price: 35999,
      stock: 10,
      store_id: second_store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post("/api/products/")
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "You do not have access rights to this store",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  it("Should return 409 (duplicate data)", async () => {
    const payload = {
      name: "Water Bottle",
      price: 10000,
      stock: 100,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post("/api/products/")
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(409);
    expect(body).toEqual({
      data: expect.any(String),
      message: "Bad Request!!!",
      status: 409,
      success: false,
    });
  });

  describe("'SOMETHING' not found", () => {
    it("Should return 404 ('User' not found)", async () => {
      const payload = {
        name: "Soda",
        price: 5999,
        stock: 50,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .post("/api/products/")
        .set("Cookie", lost_user.cookies)
        .set("Authorization", lost_user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "User not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 'Store' not found)", async () => {
      const payload = {
        name: "Soda",
        price: 5999,
        stock: 50,
        store_id: lost_store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .post("/api/products/")
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Store not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});

describe("POST: `/api/products/:id/images`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post(`/api/products/${product._id.toString()}/images`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg")
      .field(payload);
    image_id = body.data.image;

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        base_price: 49999,
        description: "",
        dimensions: {
          height: 0,
          length: 0,
          unit: "MM",
          width: 0,
        },
        image: expect.any(String),
        isFavorite: false,
        name: "pizza",
        price: 49999,
        sku: "",
        slug: "pizza",
        stock: 10,
        upc: "",
        weight: {
          unit: "GRAM",
          value: 0,
        },
      },
      message: "Add product image successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const payload = {
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .post(`/api/products/${invalid_params}/images`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/0.jpg")
        .field(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong 'store_id' type)", async () => {
      const payload = {
        store_id: invalid_store_id,
      };
      const { status, body } = await supertest(app)
        .post(`/api/products/${product._id.toString()}/images`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/0.jpg")
        .field(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong file type)", async () => {
      const payload = {
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .post(`/api/products/${product._id.toString()}/images`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/test.txt")
        .field(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: "Only an images are allowed",
        message: "Unprocessable Entity!!!",
        status: 422,
        success: false,
      });
    });

    it.todo("Should return 422 (file to big)");
  });

  it("Should return 401 (different auth id)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post(`/api/products/${product._id.toString()}/images`)
      .set("Cookie", second_user.cookies)
      .set("Authorization", user.bearer_token)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg")
      .field(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Mismatch between `auth_id` and `cookies_id`",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no cookies)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post(`/api/products/${product._id.toString()}/images`)
      .set("Authorization", user.bearer_token)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg")
      .field(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Request cookies not defined",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no auth header)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post(`/api/products/${product._id.toString()}/images`)
      .set("Cookie", user.cookies)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg")
      .field(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Authorization header is needed",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 403 (invalid auth header)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post(`/api/products/${product._id.toString()}/images`)
      .set("Cookie", user.cookies)
      .set("Authorization", invalid_bearer)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg")
      .field(payload);

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "Invalid token at authorization header",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  it("Should return 403 (no access store)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post(`/api/products/${product._id.toString()}/images`)
      .set("Cookie", second_user.cookies)
      .set("Authorization", second_user.bearer_token)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg")
      .field(payload);

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "You do not have access rights to this store",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  it("Should return 400 (Product already has an image)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post(`/api/products/${product._id.toString()}/images`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg")
      .field(payload);

    expect(status).toBe(400);
    expect(body).toEqual({
      data: "Product already has an image",
      message: "Bad Request!!!",
      status: 400,
      success: false,
    });
  });

  it.skip("Should return 500 ('Failed to upload image to Cloudflare R2')", () => {});

  describe("'SOMETHING' not found", () => {
    it("Should return 404 ('User' not found)", async () => {
      const payload = {
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .post(`/api/products/${product._id.toString()}/images`)
        .set("Cookie", lost_user.cookies)
        .set("Authorization", lost_user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/0.jpg")
        .field(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "User not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Store' not found)", async () => {
      const payload = {
        store_id: lost_store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .post(`/api/products/${product._id.toString()}/images`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/0.jpg")
        .field(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Store not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Product' not found)", async () => {
      const payload = {
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .post(`/api/products/${lost_user.product._id.toString()}/images`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/0.jpg")
        .field(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Product not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Product' not found in the store)", async () => {
      const payload = {
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .post(`/api/products/${second_user.product._id.toString()}/images`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/0.jpg")
        .field(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Product not available in the store",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});

describe("GET: `/api/products/:id`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .get(`/api/products/${product._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);
    product = body.data;

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        base_price: 49999,
        description: "",
        dimensions: {
          height: 0,
          length: 0,
          unit: "MM",
          width: 0,
        },
        image: expect.any(String),
        isFavorite: false,
        name: "pizza",
        price: 49999,
        sku: "",
        slug: "pizza",
        stock: 10,
        upc: "",
        weight: {
          unit: "GRAM",
          value: 0,
        },
      },
      message: "Get product by id successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const payload = {
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .get(`/api/products/${invalid_params}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong 'store_id' type)", async () => {
      const payload = {
        store_id: invalid_store_id,
      };
      const { status, body } = await supertest(app)
        .get(`/api/products/${product._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });
  });

  it("Should return 401 (different auth id)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .get(`/api/products/${product._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", second_user.bearer_token)
      .send(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Mismatch between `auth_id` and `cookies_id`",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no cookies)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .get(`/api/products/${product._id.toString()}`)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Request cookies not defined",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no auth header)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .get(`/api/products/${product._id.toString()}`)
      .set("Cookie", user.cookies)
      .send(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Authorization header is needed",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 403 (invalid auth header)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .get(`/api/products/${product._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", invalid_bearer)
      .send(payload);

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "Invalid token at authorization header",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  it("Should return 403 (no access store)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .get(`/api/products/${product._id.toString()}`)
      .set("Cookie", second_user.cookies)
      .set("Authorization", second_user.bearer_token)
      .send(payload);

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "You do not have access rights to this store",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  describe("'SOMETHING' not found", () => {
    it("Should return 404 ('User' not found)", async () => {
      const payload = {
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .get(`/api/products/${product._id.toString()}`)
        .set("Cookie", lost_user.cookies)
        .set("Authorization", lost_user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "User not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Store' not found)", async () => {
      const payload = {
        store_id: lost_store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .get(`/api/products/${product._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Store not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Product' not found)", async () => {
      let lost_id: string = "";
      await supertest(app)
        .post("/api/products/")
        .set("Cookie", second_user.cookies)
        .set("Authorization", second_user.bearer_token)
        .send({
          name: "Soda",
          price: 5999,
          stock: 50,
          store_id: second_store._id.toString(),
        })
        .then(async ({ body }) => {
          lost_id = body.data._id.toString();
          await Product.deleteOne({ _id: new ObjectId(lost_id) });
        });

      const payload = {
        store_id: second_store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .get(`/api/products/${lost_id.toString()}`)
        .set("Cookie", second_user.cookies)
        .set("Authorization", second_user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Product not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Product' not found in the store)", async () => {
      const payload = {
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .get(`/api/products/${second_user.product._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Product not available in the store",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});

describe("GET: `/api/products/store/:id`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      limit: 10,
    };
    const { status, body } = await supertest(app)
      .get(`/api/products/store/${store._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: [
        {
          _id: expect.any(String),
          base_price: 15000,
          description:
            "This Ultra Clean Toothbrush is designed to give you a superior brushing experience.",
          dimensions: {
            height: 0,
            length: 0,
            unit: "MM",
            width: 0,
          },
          image: expect.any(String),
          isFavorite: false,
          name: "toothbrush",
          price: 15000,
          sku: "",
          slug: "toothbrush",
          stock: 10,
          upc: "",
          weight: {
            unit: "GRAM",
            value: 0,
          },
        },
        {
          _id: expect.any(String),
          base_price: 49999,
          description: "",
          dimensions: {
            height: 0,
            length: 0,
            unit: "MM",
            width: 0,
          },
          image: expect.any(String),
          isFavorite: false,
          name: "pizza",
          price: 49999,
          sku: "",
          slug: "pizza",
          stock: 10,
          upc: "",
          weight: {
            unit: "GRAM",
            value: 0,
          },
        },
      ],
      message: "Get product by store id successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const payload = {
        limit: 10,
      };
      const { status, body } = await supertest(app)
        .get(`/api/products/store/${invalid_params}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong 'limit' type)", async () => {
      const payload = {
        limit: -10,
      };
      const { status, body } = await supertest(app)
        .get(`/api/products/store/${store._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });
  });

  it("Should return 401 (different auth id)", async () => {
    const payload = {
      limit: 10,
    };
    const { status, body } = await supertest(app)
      .get(`/api/products/store/${store._id.toString()}`)
      .set("Cookie", second_user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Mismatch between `auth_id` and `cookies_id`",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no cookies)", async () => {
    const payload = {
      limit: 10,
    };
    const { status, body } = await supertest(app)
      .get(`/api/products/store/${store._id.toString()}`)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Request cookies not defined",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no auth header)", async () => {
    const payload = {
      limit: 10,
    };
    const { status, body } = await supertest(app)
      .get(`/api/products/store/${store._id.toString()}`)
      .set("Cookie", user.cookies)
      .send(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Authorization header is needed",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 403 (invalid auth header)", async () => {
    const payload = {
      limit: 10,
    };
    const { status, body } = await supertest(app)
      .get(`/api/products/store/${store._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", invalid_bearer)
      .send(payload);

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "Invalid token at authorization header",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  it("Should return 403 (no access store)", async () => {
    const payload = {
      limit: 10,
    };
    const { status, body } = await supertest(app)
      .get(`/api/products/store/${store._id.toString()}`)
      .set("Cookie", second_user.cookies)
      .set("Authorization", second_user.bearer_token)
      .send(payload);

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "You do not have access rights to this store",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  describe("'SOMETHING' not found", () => {
    it("Should return 404 ('User' not found)", async () => {
      const payload = {
        limit: 10,
      };
      const { status, body } = await supertest(app)
        .get(`/api/products/store/${store._id.toString()}`)
        .set("Cookie", lost_user.cookies)
        .set("Authorization", lost_user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "User not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Store' not found)", async () => {
      const payload = {
        limit: 10,
      };
      const { status, body } = await supertest(app)
        .get(`/api/products/store/${lost_store._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Store not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Product' not found)", async () => {
      const payload = {
        limit: 10,
      };
      const { status, body } = await supertest(app)
        .get(`/api/products/store/${second_store._id.toString()}`)
        .set("Cookie", second_user.cookies)
        .set("Authorization", second_user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Product not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});

describe("GET: `/api/products/:slug`", () => {
  it("Should return 200 (successfully)", async () => {
    const { status, body } = await supertest(app)
      .get(`/api/products/slug/${product.slug}`)
      .set("Cookie", user.cookies);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        image: expect.any(String),
        name: "pizza",
        price: 49999,
        stock: 10,
      },
      message: "Get product by slug successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const { status, body } = await supertest(app)
        .get(`/api/products/slug/#${invalid_params}`)
        .set("Cookie", user.cookies);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });
  });

  describe("'SOMETHING' not found", () => {
    it("Should return 404 ('Product' not found)", async () => {
      const { status, body } = await supertest(app)
        .get(`/api/products/slug/${lost_user.product.slug}`)
        .set("Cookie", user.cookies);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Product not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});

describe("PATCH: `/api/products/:id`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      slug: "Pepperoni",
      name: "Pepperoni",
      price: 45000,
      isFavorite: true,
      weight: {
        unit: "KG",
        value: 1,
      },
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/products/${product._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        base_price: 49999,
        description: "",
        dimensions: {
          height: 0,
          length: 0,
          unit: "MM",
          width: 0,
        },
        image: expect.any(String),
        isFavorite: true,
        name: "pepperoni",
        price: 45000,
        sku: "",
        slug: "Pepperoni",
        stock: 10,
        upc: "",
        weight: {
          unit: "KG",
          value: 1,
        },
      },
      message: "Patch product successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const payload = {
        slug: "Pepperoni",
        name: "Pepperoni",
        price: 45000,
        isFavorite: true,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${invalid_params}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong data type)", async () => {
      const payload = {
        slug: "Pepperoni#",
        name: "Pepperoni",
        price: -10,
        isFavorite: 5,
        store_id: invalid_store_id,
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${product._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong 'slug' type)", async () => {
      const payload = {
        slug: "Pepperoni#2",
        name: "Pepperoni",
        price: 45000,
        isFavorite: true,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${product._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong 'name' type)", async () => {
      const payload = {
        slug: "Pepperoni",
        name: "Pe",
        price: 45000,
        isFavorite: true,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${product._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong 'price' type)", async () => {
      const payload = {
        slug: "Pepperoni",
        name: "Pepperoni",
        price: -10,
        isFavorite: true,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${product._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong 'isFavorite' type)", async () => {
      const payload = {
        slug: "Pepperoni",
        name: "Pepperoni",
        price: 45000,
        isFavorite: 5,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${product._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong 'store_id' type)", async () => {
      const payload = {
        slug: "Pepperoni",
        name: "Pepperoni",
        price: 45000,
        isFavorite: true,
        store_id: invalid_store_id,
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${product._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });
  });

  it("Should return 401 (different auth id)", async () => {
    const payload = {
      slug: "Pepperoni",
      name: "Pepperoni",
      price: 45000,
      isFavorite: true,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/products/${product._id.toString()}`)
      .set("Cookie", second_user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Mismatch between `auth_id` and `cookies_id`",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no cookies)", async () => {
    const payload = {
      slug: "Pepperoni",
      name: "Pepperoni",
      price: 45000,
      isFavorite: true,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/products/${product._id.toString()}`)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Request cookies not defined",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no auth header)", async () => {
    const payload = {
      slug: "Pepperoni",
      name: "Pepperoni",
      price: 45000,
      isFavorite: true,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/products/${product._id.toString()}`)
      .set("Cookie", user.cookies)
      .send(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Authorization header is needed",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 403 (invalid auth header)", async () => {
    const payload = {
      slug: "Pepperoni",
      name: "Pepperoni",
      price: 45000,
      isFavorite: true,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/products/${product._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", invalid_bearer)
      .send(payload);

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "Invalid token at authorization header",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  it("Should return 403 (no access store)", async () => {
    const payload = {
      slug: "Pepperoni",
      name: "Pepperoni",
      price: 45000,
      isFavorite: true,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/products/${product._id.toString()}`)
      .set("Cookie", second_user.cookies)
      .set("Authorization", second_user.bearer_token)
      .send(payload);

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "You do not have access rights to this store",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  it("Should return 409 (duplicate data)", async () => {
    const payload = {
      slug: user.product.slug,
      name: "Pepperoni",
      price: 45000,
      isFavorite: true,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/products/${product._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(409);
    expect(body).toEqual({
      data: 'Plan executor error during findAndModify :: caused by :: E11000 duplicate key error collection: pos_test.Products index: slug_1 dup key: { slug: "toothbrush" }',
      message: "Bad Request!!!",
      status: 409,
      success: false,
    });
  });

  describe("'SOMETHING' not found", () => {
    it("Should return 404 ('User' not found)", async () => {
      const payload = {
        slug: "Pepperoni",
        name: "Pepperoni",
        price: 45000,
        isFavorite: true,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${product._id.toString()}`)
        .set("Cookie", lost_user.cookies)
        .set("Authorization", lost_user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "User not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Store' not found)", async () => {
      const payload = {
        slug: "Pepperoni",
        name: "Pepperoni",
        price: 45000,
        isFavorite: true,
        store_id: lost_store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${product._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Store not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Product' not found)", async () => {
      const payload = {
        slug: "Pepperoni",
        name: "Pepperoni",
        price: 45000,
        isFavorite: true,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${lost_user.product._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Product not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Product' not found in the store)", async () => {
      const payload = {
        slug: "Pepperoni",
        name: "Pepperoni",
        price: 45000,
        isFavorite: true,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${second_user.product._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Product not available in the store",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});

describe("PATCH: `/api/products/:id/images`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/products/${product._id.toString()}/images`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg")
      .field(payload);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        description: "",
        dimensions: {
          height: 0,
          length: 0,
          unit: "CM",
          width: 0,
        },
        image: expect.any(String),
        isFavorite: true,
        name: "pepperoni",
        price: 45000,
        slug: "Pepperoni",
        stock: 10,
        weight: 0,
      },
      message: "Patch product image successfully!!",
      status: 200,
      success: true,
    });

    const image: ImageSchemaWithId | null = await Image.findOne({
      _id: new ObjectId(body.data.image),
    });
    if (image?._id.toString().length !== 0) {
      await deleteR2Image(image?.name.split(".")[0]);
    }
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const payload = {
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${invalid_params}/images`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/0.jpg")
        .field(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong 'store_id' type)", async () => {
      const payload = {
        store_id: invalid_store_id,
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${product._id.toString()}/images`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/0.jpg")
        .field(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong file type)", async () => {
      const payload = {
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${product._id.toString()}/images`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/test.txt")
        .field(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: "Only an images are allowed",
        message: "Unprocessable Entity!!!",
        status: 422,
        success: false,
      });
    });

    it.todo("Should return 422 (file to big)");
  });

  it("Should return 401 (different auth id)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/products/${product._id.toString()}/images`)
      .set("Cookie", second_user.cookies)
      .set("Authorization", user.bearer_token)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg")
      .field(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Mismatch between `auth_id` and `cookies_id`",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no cookies)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/products/${product._id.toString()}/images`)
      .set("Authorization", user.bearer_token)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg")
      .field(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Request cookies not defined",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no auth header)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/products/${product._id.toString()}/images`)
      .set("Cookie", user.cookies)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg")
      .field(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Authorization header is needed",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 403 (invalid auth header)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/products/${product._id.toString()}/images`)
      .set("Cookie", user.cookies)
      .set("Authorization", invalid_bearer)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg")
      .field(payload);

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "Invalid token at authorization header",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  it("Should return 403 (no access store)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/products/${product._id.toString()}/images`)
      .set("Cookie", second_user.cookies)
      .set("Authorization", second_user.bearer_token)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg")
      .field(payload);

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "You do not have access rights to this store",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  it.skip("Should return 500 ('Failed to upload image to Cloudflare R2')", () => {});

  describe("'SOMETHING' not found", () => {
    it("Should return 404 ('User' not found)", async () => {
      const payload = {
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${product._id.toString()}/images`)
        .set("Cookie", lost_user.cookies)
        .set("Authorization", lost_user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/0.jpg")
        .field(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "User not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Store' not found)", async () => {
      const payload = {
        store_id: lost_store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${product._id.toString()}/images`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/0.jpg")
        .field(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Store not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Product' not found)", async () => {
      const payload = {
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${lost_user.product._id.toString()}/images`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/0.jpg")
        .field(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Product not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Product' not found in the store)", async () => {
      const payload = {
        store_id: second_store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${product._id.toString()}/images`)
        .set("Cookie", second_user.cookies)
        .set("Authorization", second_user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/0.jpg")
        .field(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Product not available in the store",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Product Image' not found)", async () => {
      const payload = {
        store_id: second_store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${second_user.product._id.toString()}/images`)
        .set("Cookie", second_user.cookies)
        .set("Authorization", second_user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/0.jpg")
        .field(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Product image not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});

describe("PATCH: `/api/products/:id/stocks/`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      before: product.stock,
      after: 15,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/products/${product._id.toString()}/stocks`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        base_price: 49999,
        description: "",
        dimensions: {
          height: 0,
          length: 0,
          unit: "MM",
          width: 0,
        },
        image: expect.any(String),
        isFavorite: true,
        name: "pepperoni",
        price: 45000,
        sku: "",
        slug: "Pepperoni",
        stock: 15,
        upc: "",
        weight: {
          unit: "KG",
          value: 1,
        },
      },
      message: "Patch product successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const payload = {
        before: product.stock,
        after: 15,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${invalid_params}/stocks`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong data type)", async () => {
      const payload = {
        before: -10,
        after: -15,
        store_id: invalid_store_id,
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${product._id.toString()}/stocks`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong 'before' type)", async () => {
      const payload = {
        before: -10,
        after: 15,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${product._id.toString()}/stocks`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong 'after' type)", async () => {
      const payload = {
        before: product.stock,
        after: -15,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${product._id.toString()}/stocks`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong 'store_id' type)", async () => {
      const payload = {
        before: product.stock,
        after: 15,
        store_id: invalid_store_id,
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${product._id.toString()}/stocks`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });
  });

  it("Should return 401 (different auth id)", async () => {
    const payload = {
      before: product.stock,
      after: 15,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/products/${product._id.toString()}/stocks`)
      .set("Cookie", second_user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Mismatch between `auth_id` and `cookies_id`",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no cookies)", async () => {
    const payload = {
      before: product.stock,
      after: 15,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/products/${product._id.toString()}/stocks`)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Request cookies not defined",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no auth header)", async () => {
    const payload = {
      before: product.stock,
      after: 15,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/products/${product._id.toString()}/stocks`)
      .set("Cookie", user.cookies)
      .send(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Authorization header is needed",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 403 (invalid auth header)", async () => {
    const payload = {
      before: product.stock,
      after: 15,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/products/${product._id.toString()}/stocks`)
      .set("Cookie", user.cookies)
      .set("Authorization", invalid_bearer)
      .send(payload);

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "Invalid token at authorization header",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  it("Should return 403 (no access store)", async () => {
    const payload = {
      before: product.stock,
      after: 15,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/products/${product._id.toString()}/stocks`)
      .set("Cookie", second_user.cookies)
      .set("Authorization", second_user.bearer_token)
      .send(payload);

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "You do not have access rights to this store",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  it("Should return 400 (stock does not equal)", async () => {
    const payload = {
      before: 5,
      after: 15,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/products/${product._id.toString()}/stocks`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(400);
    expect(body).toEqual({
      data: "Requested stock does not match the current product stock",
      message: "Bad Request!!!",
      status: 400,
      success: false,
    });
  });

  describe("'SOMETHING' not found", () => {
    it("Should return 404 ('User' not found)", async () => {
      const payload = {
        before: product.stock,
        after: 15,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${product._id.toString()}/stocks`)
        .set("Cookie", lost_user.cookies)
        .set("Authorization", lost_user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "User not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Store' not found)", async () => {
      const payload = {
        before: product.stock,
        after: 15,
        store_id: lost_store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${product._id.toString()}/stocks`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Store not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Product' not found)", async () => {
      const payload = {
        before: product.stock,
        after: 15,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${lost_user.product._id.toString()}/stocks`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Product not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Product' not found in the store)", async () => {
      const payload = {
        before: product.stock,
        after: 15,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/products/${second_user.product._id.toString()}/stocks`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Product not available in the store",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});

describe("DELETE: `/api/products/:id`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .delete(`/api/products/${product._id.toString()}/`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {},
      message: "Delete product successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const payload = {
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .delete(`/api/products/${invalid_params}/`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong 'store_id' type)", async () => {
      const payload = {
        store_id: invalid_store_id,
      };
      const { status, body } = await supertest(app)
        .delete(`/api/products/${product._id.toString()}/`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });
  });

  it("Should return 401 (different auth id)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .delete(`/api/products/${user.product._id.toString()}/`)
      .set("Cookie", second_user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Mismatch between `auth_id` and `cookies_id`",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no cookies)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .delete(`/api/products/${user.product._id.toString()}/`)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Request cookies not defined",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no auth header)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .delete(`/api/products/${user.product._id.toString()}/`)
      .set("Cookie", user.cookies)
      .send(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Authorization header is needed",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 403 (invalid auth header)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .delete(`/api/products/${user.product._id.toString()}/`)
      .set("Cookie", user.cookies)
      .set("Authorization", invalid_bearer)
      .send(payload);

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "Invalid token at authorization header",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  it("Should return 403 (no access store)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .delete(`/api/products/${user.product._id.toString()}/`)
      .set("Cookie", second_user.cookies)
      .set("Authorization", second_user.bearer_token)
      .send(payload);

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "You do not have access rights to this store",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  describe("'SOMETHING' not found", () => {
    it("Should return 404 ('User' not found)", async () => {
      const payload = {
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .delete(`/api/products/${user.product._id.toString()}/`)
        .set("Cookie", lost_user.cookies)
        .set("Authorization", lost_user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "User not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Store' not found)", async () => {
      const payload = {
        store_id: lost_store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .delete(`/api/products/${user.product._id.toString()}/`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Store not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Product' not found)", async () => {
      const payload = {
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .delete(`/api/products/${lost_user.product._id.toString()}/`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Product not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Product' not found in the store)", async () => {
      const payload = {
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .delete(`/api/products/${second_user.product._id.toString()}/`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Product not available in the store",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});
