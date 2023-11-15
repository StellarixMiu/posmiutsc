import supertest from "supertest";
import { ObjectId } from "mongodb";
import app from "../../app";
import createTest from "../../test/createTest";
import { CategorySchemaWithId, Category } from "./categoryModel";

let category: CategorySchemaWithId;

let user: any;
let store: any;

let second_user: any;
let second_store: any;

let lost_user: any;
let lost_store: any;

const invalid_params = "41A95fsaAFaFFA64ojP0w841";
const invalid_bearer = "Bearer 6510f40adeb51c904347309d";
const invalid_store_id = "92xfH2wjFEkDd7jqs76Njf1T";

beforeAll(async () => {
  const users = await createTest();
  user = users[0];
  store = user.store;

  second_user = users[1];
  second_store = second_user.store;

  lost_user = users[2];
  lost_store = lost_user.store;
});

describe("POST: `/api/categories/`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      name: "Electronics",
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post("/api/categories/")
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);
    category = body.data;

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        name: "electronics",
        store: { id: expect.any(String), products: [] },
      },
      message: "Create category successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong body data type", () => {
    it("Should return 422 (wrong data type)", async () => {
      const payload = {
        name: 11,
        store_id: invalid_store_id,
      };
      const { status, body } = await supertest(app)
        .post("/api/categories/")
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

    it("Should return 422 (wrong 'store_id' data type)", async () => {
      const payload = {
        name: "Electronics",
        store_id: invalid_store_id,
      };
      const { status, body } = await supertest(app)
        .post("/api/categories/")
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

    it("Should return 422 (wrong 'name' data type)", async () => {
      const payload = {
        name: 11,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .post("/api/categories/")
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
      name: "Electronics",
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post("/api/categories/")
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
      name: "Electronics",
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post("/api/categories/")
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
      name: "Electronics",
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post("/api/categories/")
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
      name: "Electronics",
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post("/api/categories/")
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
      name: "Electronics",
      store_id: second_store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post("/api/categories/")
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

  it("Should return 400 (store already has the category)", async () => {
    const payload = {
      name: "Fruits",
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post("/api/categories/")
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(400);
    expect(body).toEqual({
      data: "Store already has the category",
      message: "Bad Request!!!",
      status: 400,
      success: false,
    });
  });

  describe("'SOMETHING' not found", () => {
    it("Should return 404 ('User' not found)", async () => {
      const payload = {
        name: "Electronics",
        store_id: lost_store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .post("/api/categories/")
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
        name: "Electronics",
        store_id: lost_store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .post("/api/categories/")
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

describe("POST: `/api/categories/:id/products`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      store_id: store._id.toString(),
      products: [user.product._id.toString()],
    };
    const { status, body } = await supertest(app)
      .post(`/api/categories/${category._id.toString()}/products`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        name: "electronics",
        store: {
          id: expect.any(String),
          products: expect.any(Array<String>),
        },
      },
      message: "Add products to category successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const payload = {
        store_id: store._id.toString(),
        products: [user.product._id.toString()],
      };
      const { status, body } = await supertest(app)
        .post("/api/categories/hg7L8D4Y3uAjiVL39Gf8e5dbn/products")
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
        store_id: "kggMap0g86GtRzLHSEvTv3uF1",
        products: ["k8fGap0gfE4TRzLHS84GyGj01"],
      };
      const { status, body } = await supertest(app)
        .post(`/api/categories/${category._id.toString()}/products`)
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
        store_id: "kggMap0g86GtRzLHSEvTv3uF1",
        products: [user.product._id.toString()],
      };
      const { status, body } = await supertest(app)
        .post(`/api/categories/${category._id.toString()}/products`)
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

    it("Should return 422 (wrong 'products' type)", async () => {
      const payload = {
        store_id: store._id.toString(),
        products: ["k8fGap0gfE4TRzLHS84GyGj01"],
      };
      const { status, body } = await supertest(app)
        .post(`/api/categories/${category._id.toString()}/products`)
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
      products: [user.product._id.toString()],
    };
    const { status, body } = await supertest(app)
      .post(`/api/categories/${category._id.toString()}/products`)
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
      products: [user.product._id.toString()],
    };
    const { status, body } = await supertest(app)
      .post(`/api/categories/${category._id.toString()}/products`)
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
      products: [user.product._id.toString()],
    };
    const { status, body } = await supertest(app)
      .post(`/api/categories/${category._id.toString()}/products`)
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
      products: [user.product._id.toString()],
    };
    const { status, body } = await supertest(app)
      .post(`/api/categories/${category._id.toString()}/products`)
      .set("Cookie", user.cookies)
      .set("Authorization", "Bearer 6510f40adeb51c904347309d")
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
      products: [user.product._id.toString()],
    };
    const { status, body } = await supertest(app)
      .post(`/api/categories/${category._id.toString()}/products`)
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

  it("Should return 400 (Product already exist in the category)", async () => {
    const payload = {
      store_id: store._id.toString(),
      products: [user.product._id.toString()],
    };
    const { status, body } = await supertest(app)
      .post(`/api/categories/${category._id.toString()}/products`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(400);
    expect(body).toEqual({
      data: "Product already exist in the category",
      message: "Bad Request!!!",
      status: 400,
      success: false,
    });
  });

  describe("'SOMETHING' not found", () => {
    it("Should return 404 ('User' not found)", async () => {
      const payload = {
        store_id: store._id.toString(),
        products: [lost_user.product._id.toString()],
      };
      const { status, body } = await supertest(app)
        .post(`/api/categories/${category._id.toString()}/products`)
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
        products: [user.product._id.toString()],
      };
      const { status, body } = await supertest(app)
        .post(`/api/categories/${category._id.toString()}/products`)
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

    it("Should return 404 ('Category' not found)", async () => {
      const payload = {
        store_id: store._id.toString(),
        products: [user.product._id.toString()],
      };
      const { status, body } = await supertest(app)
        .post(`/api/categories/${lost_user.category._id.toString()}/products`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Category not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Category' not found in the store)", async () => {
      const payload = {
        store_id: second_store._id.toString(),
        products: [second_user.product._id.toString()],
      };
      const { status, body } = await supertest(app)
        .post(`/api/categories/${category._id.toString()}/products`)
        .set("Cookie", second_user.cookies)
        .set("Authorization", second_user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Category not available in the store",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Product' not found)", async () => {
      const payload = {
        store_id: store._id.toString(),
        products: [lost_user.product._id.toString()],
      };
      const { status, body } = await supertest(app)
        .post(`/api/categories/${category._id.toString()}/products`)
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
        store_id: second_store._id.toString(),
        products: [user.product._id.toString()],
      };
      const { status, body } = await supertest(app)
        .post(`/api/categories/${second_user.category._id.toString()}/products`)
        .set("Cookie", second_user.cookies)
        .set("Authorization", second_user.bearer_token)
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

describe("GET:`/api/categories/:id`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      store_id: store._id,
    };
    const { status, body } = await supertest(app)
      .get(`/api/categories/${category._id}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        name: "electronics",
        store: {
          id: expect.any(String),
          products: expect.any(Array<String>),
        },
      },
      message: "Get category by id successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const payload = {
        store_id: store._id,
      };
      const { status, body } = await supertest(app)
        .get(`/api/categories/${invalid_params}`)
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

    it("Should return 422 (wrong 'store_id' body type)", async () => {
      const payload = {
        store_id: invalid_store_id,
      };
      const { status, body } = await supertest(app)
        .get(`/api/categories/${category._id}`)
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
      store_id: store._id,
    };
    const { status, body } = await supertest(app)
      .get(`/api/categories/${category._id}`)
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
      store_id: store._id,
    };
    const { status, body } = await supertest(app)
      .get(`/api/categories/${category._id}`)
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
      store_id: store._id,
    };
    const { status, body } = await supertest(app)
      .get(`/api/categories/${category._id}`)
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
      store_id: store._id,
    };
    const { status, body } = await supertest(app)
      .get(`/api/categories/${category._id}`)
      .set("Cookie", second_user.cookies)
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
      store_id: store._id,
      limit: 10,
    };
    const { status, body } = await supertest(app)
      .get(`/api/categories/${category._id}`)
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
        store_id: lost_store._id,
      };
      const { status, body } = await supertest(app)
        .get(`/api/categories/${category._id}`)
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
        store_id: lost_store._id,
      };
      const { status, body } = await supertest(app)
        .get(`/api/categories/${category._id}`)
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

    it("Should return 404 ('Category' not found)", async () => {
      const payload = {
        store_id: store._id,
      };
      const { status, body } = await supertest(app)
        .get(`/api/categories/${lost_user.category._id}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Category not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Category' not found in the store)", async () => {
      const payload = {
        store_id: second_store._id,
      };
      const { status, body } = await supertest(app)
        .get(`/api/categories/${user.category._id}`)
        .set("Cookie", second_user.cookies)
        .set("Authorization", second_user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Category not available in the store",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});

describe("GET:`/api/categories/store/:id`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      limit: 10,
    };
    const { status, body } = await supertest(app)
      .get(`/api/categories/store/${store._id}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: [
        {
          _id: expect.any(String),
          name: "vegetables",
          store: {
            id: expect.any(String),
            products: expect.any(Array<String>),
          },
        },
        {
          _id: expect.any(String),
          name: "electronics",
          store: {
            id: expect.any(String),
            products: expect.any(Array<String>),
          },
        },
      ],
      message: "Get category by store id successfully!!",
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
        .get(`/api/categories/store/${invalid_params}`)
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
        limit: -5,
      };
      const { status, body } = await supertest(app)
        .get(`/api/categories/store/${store._id}`)
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
      .get(`/api/categories/store/${store._id}`)
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
      limit: 10,
    };
    const { status, body } = await supertest(app)
      .get(`/api/categories/store/${store._id}`)
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
      .get(`/api/categories/store/${store._id}`)
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
      .get(`/api/categories/store/${store._id}`)
      .set("Cookie", second_user.cookies)
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
      .get(`/api/categories/store/${store._id}`)
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
        .get(`/api/categories/store/${store._id}`)
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
        .get(`/api/categories/store/${lost_store._id}`)
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

    it.skip("Should return 404 ('Category' not found)", async () => {
      const payload = {
        limit: 10,
      };
      const { status, body } = await supertest(app)
        .get(`/api/categories/store/${store._id}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Category not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});

describe("DELETE: `/api/categories/:id/products`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      store_id: store._id.toString(),
      products: [user.product._id.toString()],
    };
    const { status, body } = await supertest(app)
      .delete(`/api/categories/${category._id.toString()}/products`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        name: "electronics",
        store: {
          id: expect.any(String),
          products: expect.any(Array<String>),
        },
      },
      message: "Remove products from category successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const payload = {
        store_id: store._id.toString(),
        products: [user.product._id.toString()],
      };
      const { status, body } = await supertest(app)
        .delete(`/api/categories/${invalid_params}/products`)
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
        store_id: invalid_store_id,
        products: ["k8fGap0gfE4TRzLHS84Gyj01"],
      };
      const { status, body } = await supertest(app)
        .delete(`/api/categories/${category._id.toString()}/products`)
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
        products: [user.product._id.toString()],
      };
      const { status, body } = await supertest(app)
        .delete(`/api/categories/${category._id.toString()}/products`)
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

    it("Should return 422 (wrong 'products' type)", async () => {
      const payload = {
        store_id: store._id.toString(),
        products: ["k8fGap0gfE4TRzLHS84Gyj01"],
      };
      const { status, body } = await supertest(app)
        .delete(`/api/categories/${category._id.toString()}/products`)
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
      products: [user.product._id.toString()],
    };
    const { status, body } = await supertest(app)
      .delete(`/api/categories/${category._id.toString()}/products`)
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
      products: [user.product._id.toString()],
    };
    const { status, body } = await supertest(app)
      .delete(`/api/categories/${category._id.toString()}/products`)
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
      products: [user.product._id.toString()],
    };
    const { status, body } = await supertest(app)
      .delete(`/api/categories/${category._id.toString()}/products`)
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
      products: [user.product._id.toString()],
    };
    const { status, body } = await supertest(app)
      .delete(`/api/categories/${category._id.toString()}/products`)
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
      products: [user.product._id.toString()],
    };
    const { status, body } = await supertest(app)
      .delete(`/api/categories/${category._id.toString()}/products`)
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
        products: [lost_user.product._id.toString()],
      };
      const { status, body } = await supertest(app)
        .delete(`/api/categories/${category._id.toString()}/products`)
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
        products: [user.product._id.toString()],
      };
      const { status, body } = await supertest(app)
        .delete(`/api/categories/${category._id.toString()}/products`)
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

    it("Should return 404 ('Category' not found)", async () => {
      const payload = {
        store_id: store._id.toString(),
        products: [user.product._id.toString()],
      };
      const { status, body } = await supertest(app)
        .delete(`/api/categories/${lost_user.category._id.toString()}/products`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Category not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Category' not found in the store)", async () => {
      const payload = {
        store_id: second_store._id.toString(),
        products: [second_user.product._id.toString()],
      };
      const { status, body } = await supertest(app)
        .delete(`/api/categories/${category._id.toString()}/products`)
        .set("Cookie", second_user.cookies)
        .set("Authorization", second_user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Category not available in the store",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Product' not found)", async () => {
      const payload = {
        store_id: store._id.toString(),
        products: [lost_user.product._id.toString()],
      };
      const { status, body } = await supertest(app)
        .delete(`/api/categories/${category._id.toString()}/products`)
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
        store_id: second_store._id.toString(),
        products: [user.product._id.toString()],
      };
      const { status, body } = await supertest(app)
        .delete(
          `/api/categories/${second_user.category._id.toString()}/products`
        )
        .set("Cookie", second_user.cookies)
        .set("Authorization", second_user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Product not available in the store",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Product' not found in the category)", async () => {
      const payload = {
        store_id: second_store._id.toString(),
        products: [second_user.product._id.toString()],
      };
      const { status, body } = await supertest(app)
        .delete(
          `/api/categories/${second_user.category._id.toString()}/products`
        )
        .set("Cookie", second_user.cookies)
        .set("Authorization", second_user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Product not available in the category",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});

describe("DELETE: `/api/categories/:id", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .delete(`/api/categories/${category._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {},
      message: "Delete category successfully!!",
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
        .delete(`/api/categories/${invalid_params}`)
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
        .delete(`/api/categories/${category._id.toString()}`)
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
      .delete(`/api/categories/${category._id.toString()}`)
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
      .delete(`/api/categories/${category._id.toString()}`)
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
      .delete(`/api/categories/${category._id.toString()}`)
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
      .delete(`/api/categories/${category._id.toString()}`)
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
      .delete(`/api/categories/${category._id.toString()}`)
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
        store_id: lost_store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .delete(`/api/categories/${category._id.toString()}`)
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
        .delete(`/api/categories/${category._id.toString()}`)
        .set("Cookie", second_user.cookies)
        .set("Authorization", second_user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Store not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Category' not found)", async () => {
      const payload = {
        store_id: second_store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .delete(`/api/categories/${lost_user.category._id.toString()}`)
        .set("Cookie", second_user.cookies)
        .set("Authorization", second_user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Category not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Category' not found in the store)", async () => {
      const payload = {
        store_id: second_store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .delete(`/api/categories/${category._id.toString()}`)
        .set("Cookie", second_user.cookies)
        .set("Authorization", second_user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Category not available in the store",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});
