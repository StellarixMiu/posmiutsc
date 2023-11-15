import app from "../../app";
import supertest from "supertest";
import { ObjectId } from "mongodb";
import { Coupon, CouponSchemaWithId } from "./couponModel";
import createTest from "../../test/createTest";

let coupon: CouponSchemaWithId;

let user: any;
let store: any;

let second_user: any;
let r: any;

let lost_user: any;
let lost_store: any;

const invalid_params = "84FbJhCnPA5Eu2fNE0AP2fNJ";
const invalid_bearer = "Bearer 6510f40adeb51c904347309d";
const invalid_store_id = "76hM3gvP0lPAG0TYyJYaLpf8";

beforeAll(async () => {
  const users = await createTest();
  user = users[0];
  store = user.store;

  second_user = users[1];
  r = second_user.store;

  lost_user = users[2];
  lost_store = lost_user.store;
});

describe("POST: `/api/coupons/`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      name: "winter sale",
      description: "winter fest sale coupon",
      type: "PRICE",
      discount: 25999,
      code: "winter23sale",
      starts_date: new Date(),
      ends_date: new Date(2023, 12, 20),
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post("/api/coupons/")
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);
    coupon = body.data;

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        code: "WINTER23SALE",
        description: "winter fest sale coupon",
        discount: 25999,
        ends_date: expect.any(String),
        isActive: true,
        name: "winter sale",
        starts_date: expect.any(String),
        type: "PRICE",
      },
      message: "Create coupon successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong body data type", () => {
    it("Should return 422 (wrong  data type)", async () => {
      const payload = {
        name: "ws",
        description: "ws",
        type: "percentage",
        discount: "25999",
        code: "winter-23-sale",
        starts_date: "30-11-2023",
        ends_date: "20-12-2023",
        store_id: invalid_store_id,
      };
      const { status, body } = await supertest(app)
        .post("/api/coupons/")
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

    it("Should return 422 (wrong 'date' data type)", async () => {
      const payload = {
        name: "winter sale",
        description: "winter fest sale coupon",
        type: "PRICE",
        discount: 25999,
        code: "winter23sale",
        starts_date: "30-11-2023",
        ends_date: "20-12-2023",
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .post("/api/coupons/")
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

    it("Should return 422 (wrong 'code' data type)", async () => {
      const payload = {
        name: "winter sale",
        description: "winter fest sale coupon",
        type: "PRICE",
        discount: 25999,
        code: "winter/23-sale",
        starts_date: new Date(),
        ends_date: new Date(2023, 12, 20),
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .post("/api/coupons/")
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

    it("Should return 422 (wrong 'type' data type)", async () => {
      const payload = {
        name: "winter sale",
        description: "winter fest sale coupon",
        type: "Percentage",
        discount: 25999,
        code: "winter23sale",
        starts_date: new Date(),
        ends_date: new Date(2023, 12, 20),
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .post("/api/coupons/")
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
        name: "ws",
        description: "ws",
        type: "PRICE",
        discount: 25999,
        code: "winter23sale",
        starts_date: new Date(),
        ends_date: new Date(2023, 12, 20),
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .post("/api/coupons/")
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
        name: "winter sale",
        description: "winter fest sale coupon",
        type: "PRICE",
        discount: 25999,
        code: "winter23sale",
        starts_date: new Date(),
        ends_date: new Date(2023, 12, 20),
        store_id: invalid_store_id,
      };
      const { status, body } = await supertest(app)
        .post("/api/coupons/")
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
      name: "winter sale",
      description: "winter fest sale coupon",
      type: "PRICE",
      discount: 25999,
      code: "winter23sale",
      starts_date: new Date(),
      ends_date: new Date(2023, 12, 20),
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post("/api/coupons/")
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
      name: "winter sale",
      description: "winter fest sale coupon",
      type: "PRICE",
      discount: 25999,
      code: "winter23sale",
      starts_date: new Date(),
      ends_date: new Date(2023, 12, 20),
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post("/api/coupons/")
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
      name: "winter sale",
      description: "winter fest sale coupon",
      type: "PRICE",
      discount: 25999,
      code: "winter23sale",
      starts_date: new Date(),
      ends_date: new Date(2023, 12, 20),
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post("/api/coupons/")
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
      name: "winter sale",
      description: "winter fest sale coupon",
      type: "PRICE",
      discount: 25999,
      code: "winter23sale",
      starts_date: new Date(),
      ends_date: new Date(2023, 12, 20),
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post("/api/coupons/")
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
      name: "winter sale",
      description: "winter fest sale coupon",
      type: "PRICE",
      discount: 25999,
      code: "winter23sale",
      starts_date: new Date(),
      ends_date: new Date(2023, 12, 20),
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post("/api/coupons/")
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
      name: "spring deal",
      description: "Spring deal coupons",
      type: "PRICE",
      discount: 10000,
      code: "Cl5z6",
      starts_date: new Date(),
      ends_date: new Date(2024, 5, 24),
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post("/api/coupons/")
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

  it("Should return 400 (end date should be later than the start)", async () => {
    const payload = {
      name: "winter sale",
      description: "winter fest sale coupon",
      type: "PRICE",
      discount: 25999,
      code: "winter23sale",
      starts_date: new Date(),
      ends_date: new Date(2022, 12, 20),
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post("/api/coupons/")
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(400);
    expect(body).toEqual({
      data: "End date should be later than the start date",
      message: "Bad Request!!!",
      status: 400,
      success: false,
    });
  });

  it("Should return 400 (discount percentage cannot more than 100%)", async () => {
    const payload = {
      name: "winter sale",
      description: "winter fest sale coupon",
      type: "PERCENT",
      discount: 15000,
      code: "winter23sale",
      starts_date: new Date(),
      ends_date: new Date(2024, 12, 20),
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .post("/api/coupons/")
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(400);
    expect(body).toEqual({
      data: "Discount percentage cannot more than 100%",
      message: "Bad Request!!!",
      status: 400,
      success: false,
    });
  });

  describe("'SOMETHING' not found", () => {
    it("Should return 404 ('User' not found)", async () => {
      const payload = {
        name: "new year sale",
        description: "new year sale coupon",
        type: "PRICE",
        discount: 25999,
        code: "newYear23",
        starts_date: new Date(),
        ends_date: new Date(2024, 1, 10),
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .post("/api/coupons/")
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
        name: "new year sale",
        description: "new year sale coupon",
        type: "PRICE",
        discount: 25999,
        code: "newYear23",
        starts_date: new Date(),
        ends_date: new Date(2024, 1, 10),
        store_id: lost_store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .post("/api/coupons/")
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

describe("GET: `/api/coupons/:id", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .get(`/api/coupons/${coupon._id}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        code: "WINTER23SALE",
        description: "winter fest sale coupon",
        discount: 25999,
        ends_date: expect.any(String),
        isActive: true,
        name: "winter sale",
        starts_date: expect.any(String),
        type: "PRICE",
      },
      message: "Get coupon by id successfully!!",
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
        .get(`/api/coupons/${invalid_params}`)
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
        .get(`/api/coupons/${coupon._id}`)
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
      .get(`/api/coupons/${coupon._id}`)
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
      .get(`/api/coupons/${coupon._id}`)
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
      .get(`/api/coupons/${coupon._id}`)
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
      .get(`/api/coupons/${coupon._id}`)
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
      .get(`/api/coupons/${coupon._id}`)
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
        .get(`/api/coupons/${coupon._id}`)
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
        .get(`/api/coupons/${coupon._id}`)
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

    it("Should return 404 ('Coupon' not found)", async () => {
      const payload = {
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .get(`/api/coupons/${lost_user.coupon._id}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Coupon not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Coupon' not found in the store)", async () => {
      const payload = {
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .get(`/api/coupons/${second_user.coupon._id}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Coupon not available in the store",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});

describe("GET: `/api/coupons/store/:id", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      limit: 10,
    };
    const { status, body } = await supertest(app)
      .get(`/api/coupons/store/${store._id}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: [
        {
          _id: expect.any(String),
          code: "TMMJY",
          discount: 15000,
          ends_date: expect.any(String),
          isActive: true,
          name: "no tricks",
          starts_date: expect.any(String),
          type: "PRICE",
        },
        {
          _id: expect.any(String),
          code: "WINTER23SALE",
          description: "winter fest sale coupon",
          discount: 25999,
          ends_date: expect.any(String),
          isActive: true,
          name: "winter sale",
          starts_date: expect.any(String),
          type: "PRICE",
        },
      ],
      message: "Get coupon by store id successfully!!",
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
        .get(`/api/coupons/store/${invalid_params}`)
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
        limit: -1,
      };
      const { status, body } = await supertest(app)
        .get(`/api/coupons/store/${store._id}`)
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
      .get(`/api/coupons/store/${store._id}`)
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
      limit: 10,
    };
    const { status, body } = await supertest(app)
      .get(`/api/coupons/store/${store._id}`)
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
      .get(`/api/coupons/store/${store._id}`)
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
      .get(`/api/coupons/store/${store._id}`)
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
      .get(`/api/coupons/store/${store._id}`)
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
        .get(`/api/coupons/store/${store._id}`)
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
        .get(`/api/coupons/store/${lost_store._id}`)
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

    it.skip("Should return 404 ('Coupon' not found)", async () => {
      const payload = {
        limit: 10,
      };
      const { status, body } = await supertest(app)
        .get(`/api/coupons/store/${store._id}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Coupon not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});

describe("PATCH: `/api/coupons/:id", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      name: `${coupon.name} new`,
      description: `new coupon for ${coupon.name}`,
      type: "PRICE",
      discount: 14999,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/coupons/${coupon._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        code: "WINTER23SALE",
        description: "new coupon for winter sale",
        discount: 14999,
        ends_date: expect.any(String),
        isActive: true,
        name: "winter sale new",
        starts_date: expect.any(String),
        type: "PRICE",
      },
      message: "Patch coupon successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const payload = {
        name: `${coupon.name} new`,
        description: `new coupon for ${coupon.name}`,
        type: "PRICE",
        discount: 14999,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/coupons/${invalid_params}`)
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
        name: "ws",
        description: "ws",
        type: "percentage",
        discount: "25999",
        store_id: invalid_store_id,
      };
      const { status, body } = await supertest(app)
        .patch(`/api/coupons/${coupon._id.toString()}`)
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
        name: "wt",
        description: `new coupon for ${coupon.name}`,
        type: "PRICE",
        discount: 14999,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/coupons/${coupon._id.toString()}`)
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

    it("Should return 422 (wrong 'discount' type)", async () => {
      const payload = {
        name: `${coupon.name} new`,
        description: `new coupon for ${coupon.name}`,
        type: "PRICE",
        discount: -1,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/coupons/${coupon._id.toString()}`)
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

    it("Should return 422 (wrong 'type' type)", async () => {
      const payload = {
        name: `${coupon.name} new`,
        description: `new coupon for ${coupon.name}`,
        type: "Percentage",
        discount: 14999,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/coupons/${coupon._id.toString()}`)
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
        name: `${coupon.name} new`,
        description: `new coupon for ${coupon.name}`,
        type: "PRICE",
        discount: 14999,
        store_id: invalid_store_id,
      };
      const { status, body } = await supertest(app)
        .patch(`/api/coupons/${coupon._id.toString()}`)
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
      name: `${coupon.name} new`,
      description: `new coupon for ${coupon.name}`,
      type: "PRICE",
      discount: 14999,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/coupons/${coupon._id.toString()}`)
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
      name: `${coupon.name} new`,
      description: `new coupon for ${coupon.name}`,
      type: "PRICE",
      discount: 14999,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/coupons/${coupon._id.toString()}`)
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
      name: `${coupon.name} new`,
      description: `new coupon for ${coupon.name}`,
      type: "PRICE",
      discount: 14999,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/coupons/${coupon._id.toString()}`)
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
      name: `${coupon.name} new`,
      description: `new coupon for ${coupon.name}`,
      type: "PRICE",
      discount: 14999,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/coupons/${coupon._id.toString()}`)
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
      name: `${coupon.name} new`,
      description: `new coupon for ${coupon.name}`,
      type: "PRICE",
      discount: 14999,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/coupons/${coupon._id.toString()}`)
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

  it("Should return 400 (discount percentage cannot more than 100%)", async () => {
    const payload = {
      name: `${coupon.name} new`,
      description: `new coupon for ${coupon.name}`,
      type: "PERCENT",
      discount: 14999,
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/coupons/${coupon._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(400);
    expect(body).toEqual({
      data: "Discount percentage cannot more than 100%",
      message: "Bad Request!!!",
      status: 400,
      success: false,
    });
  });

  describe("'SOMETHING' not found", () => {
    it("Should return 404 ('User' not found)", async () => {
      const payload = {
        name: `${coupon.name} new`,
        description: `new coupon for ${coupon.name}`,
        type: "PRICE",
        discount: 14999,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/coupons/${coupon._id.toString()}`)
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
        name: `${coupon.name} new`,
        description: `new coupon for ${coupon.name}`,
        type: "PRICE",
        discount: 14999,
        store_id: lost_store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/coupons/${coupon._id.toString()}`)
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

    it("Should return 404 ('Coupon' not found)", async () => {
      const payload = {
        name: `${coupon.name} new`,
        description: `new coupon for ${coupon.name}`,
        type: "PRICE",
        discount: 14999,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/coupons/${lost_user.coupon._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Coupon not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Coupon' not found in the store)", async () => {
      const payload = {
        name: `${coupon.name} new`,
        description: `new coupon for ${coupon.name}`,
        type: "PRICE",
        discount: 14999,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/coupons/${second_user.coupon._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Coupon not available in the store",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});

describe("DELETE: `/api/coupons/:id", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .delete(`/api/coupons/${coupon._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {},
      message: "Delete coupon successfully!!",
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
        .delete(`/api/coupons/${invalid_params}`)
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
        .delete(`/api/coupons/${user.coupon._id.toString()}`)
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
      .delete(`/api/coupons/${user.coupon._id.toString()}`)
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
      .delete(`/api/coupons/${user.coupon._id.toString()}`)
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
      .delete(`/api/coupons/${user.coupon._id.toString()}`)
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
      .delete(`/api/coupons/${user.coupon._id.toString()}`)
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
      .delete(`/api/coupons/${user.coupon._id.toString()}`)
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
        .delete(`/api/coupons/${user.coupon._id.toString()}`)
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
        .delete(`/api/coupons/${user.coupon._id.toString()}`)
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

    it("Should return 404 ('Coupon' not found)", async () => {
      const payload = {
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .delete(`/api/coupons/${lost_user.coupon._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Coupon not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Coupon' not found in the store)", async () => {
      const payload = {
        store_id: r._id.toString(),
      };
      const { status, body } = await supertest(app)
        .delete(`/api/coupons/${user.coupon._id.toString()}`)
        .set("Cookie", second_user.cookies)
        .set("Authorization", second_user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Coupon not available in the store",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});
