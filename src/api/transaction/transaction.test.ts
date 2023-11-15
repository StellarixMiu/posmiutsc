import supertest from "supertest";
import app from "../../app";
import createTest from "../../test/createTest";
import { TransactionsSchemaWithId } from "./transactionModel";

let transaction: TransactionsSchemaWithId;

let user: any;
let store: any;

let second_user: any;
let second_store: any;

let lost_user: any;
let lost_store: any;

const invalid_params = "f40aCx4C1c904aQ8PfwQjY24";
const invalid_bearer = "Bearer 6510f40adeb51c904347309d";
const invalid_store_id = "867cBvy1FF6tGCx14yQdBiCX";

beforeAll(async () => {
  const users = await createTest();
  user = users[0];
  store = user.store;

  second_user = users[1];
  second_store = second_user.store;

  lost_user = users[2];
  lost_store = lost_user.store;
});

describe("POST: `/api/transactions/`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      products: [
        {
          id: user.product._id.toString(),
          quantity: Math.floor(Math.random() * 2) + 1,
        },
      ],
      applied_coupons: [user.coupon._id],
      customer: user.customer._id,
      store_id: store._id,
    };
    const { status, body } = await supertest(app)
      .post("/api/transactions/")
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);
    transaction = body.data;

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        applied_coupons: [expect.any(String)],
        customer: expect.any(String),
        products: [
          {
            id: expect.any(String),
            quantity: expect.any(Number),
          },
        ],
        status: "PENDING",
        total_amount: expect.any(Number),
        total_price: expect.any(Number),
      },
      message: "Create transaction successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong body data type", () => {
    it("Should return 422 (wrong data type)", async () => {
      const payload = {
        products: [
          {
            id: "721d3oY0On77fJ0D4I3Gw03R",
            quantity: -5,
          },
        ],
        applied_coupons: ["12Ftx3D1mxFiBS5P95dvfCRr"],
        customer: "940zdIgt2As3HVOd7gTPWlx9",
        store_id: invalid_store_id,
      };
      const { status, body } = await supertest(app)
        .post("/api/transactions/")
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

    it('Should return 422 (wrong "customer" type)', async () => {
      const payload = {
        products: [
          {
            id: user.product._id.toString(),
            quantity: Math.floor(Math.random() * 2) + 1,
          },
        ],
        applied_coupons: [user.coupon._id],
        customer: "940zdIgt2As3HVOd7gTPWlx9",
        store_id: store._id,
      };
      const { status, body } = await supertest(app)
        .post("/api/transactions/")
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

    it('Should return 422 (wrong "products" type)', async () => {
      const payload = {
        products: [
          {
            id: "721d3oY0On77fJ0D4I3Gw03R",
            quantity: -5,
          },
        ],
        applied_coupons: [user.coupon._id],
        customer: user.customer._id,
        store_id: store._id,
      };
      const { status, body } = await supertest(app)
        .post("/api/transactions/")
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

    it('Should return 422 (wrong "applied_coupons" type)', async () => {
      const payload = {
        products: [
          {
            id: user.product._id.toString(),
            quantity: Math.floor(Math.random() * 2) + 1,
          },
        ],
        applied_coupons: [
          "12Ftx3D1mxFiBS5P95dvfCRr",
          "12Ftx3D1mxFiBS5P95dvfCRr",
          "12Ftx3D1mxFiBS5P95dvfCRr",
          "12Ftx3D1mxFiBS5P95dvfCRr",
        ],
        customer: user.customer._id,
        store_id: store._id,
      };
      const { status, body } = await supertest(app)
        .post("/api/transactions/")
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

    it('Should return 422 (wrong "store_id" type)', async () => {
      const payload = {
        products: [
          {
            id: user.product._id.toString(),
            quantity: Math.floor(Math.random() * 2) + 1,
          },
        ],
        applied_coupons: [user.coupon._id],
        customer: user.customer._id,
        store_id: invalid_store_id,
      };
      const { status, body } = await supertest(app)
        .post("/api/transactions/")
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
      products: [
        {
          id: user.product._id.toString(),
          quantity: Math.floor(Math.random() * 2) + 1,
        },
      ],
      customer: user.customer._id,
      store_id: store._id,
    };
    const { status, body } = await supertest(app)
      .post("/api/transactions/")
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
      products: [
        {
          id: user.product._id.toString(),
          quantity: Math.floor(Math.random() * 2) + 1,
        },
      ],
      customer: user.customer._id,
      store_id: store._id,
    };
    const { status, body } = await supertest(app)
      .post("/api/transactions/")
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
      products: [
        {
          id: user.product._id.toString(),
          quantity: Math.floor(Math.random() * 2) + 1,
        },
      ],
      customer: user.customer._id,
      store_id: store._id,
    };
    const { status, body } = await supertest(app)
      .post("/api/transactions/")
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
      products: [
        {
          id: user.product._id.toString(),
          quantity: Math.floor(Math.random() * 2) + 1,
        },
      ],
      customer: user.customer._id,
      store_id: store._id,
    };
    const { status, body } = await supertest(app)
      .post("/api/transactions/")
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
      products: [
        {
          id: user.product._id.toString(),
          quantity: Math.floor(Math.random() * 2) + 1,
        },
      ],
      customer: user.customer._id,
      store_id: second_store._id,
    };
    const { status, body } = await supertest(app)
      .post("/api/transactions/")
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

  it.todo("Should return 400 (Coupon is inactive)");

  it.todo("Should return 400 (Coupon date is invalid)");

  it.todo("Should return 400 (Coupon is expired)");

  describe("'SOMETHING' not found", () => {
    it("Should return 404 ('User' not found)", async () => {
      const payload = {
        products: [
          {
            id: user.product._id.toString(),
            quantity: Math.floor(Math.random() * 2) + 1,
          },
        ],
        customer: user.customer._id,
        store_id: store._id,
      };
      const { status, body } = await supertest(app)
        .post("/api/transactions/")
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
        products: [
          {
            id: user.product._id.toString(),
            quantity: Math.floor(Math.random() * 2) + 1,
          },
        ],
        customer: user.customer._id,
        store_id: lost_store._id,
      };
      const { status, body } = await supertest(app)
        .post("/api/transactions/")
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

    it("Should return 404 ('Customer' not found)", async () => {
      const payload = {
        products: [
          {
            id: user.product._id.toString(),
            quantity: Math.floor(Math.random() * 2) + 1,
          },
        ],
        customer: lost_user.customer._id,
        store_id: store._id,
      };
      const { status, body } = await supertest(app)
        .post("/api/transactions/")
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Customer not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it.todo("Should return 404 ('Coupon' not found)");

    it.todo("Should return 404 ('Coupon' not found in the store)");
  });
});
