import supertest from "supertest";
import app from "../../app";
import createTest from "../../test/createTest";
import { Customer, CustomerSchemaWithId } from "./customerModel";
import { ObjectId } from "mongodb";

let customer: CustomerSchemaWithId;

let user: any;
let store: any;

let second_user: any;
let second_store: any;

let lost_user: any;
let lost_store: any;

const invalid_params = "8n974lkXyw87H3Tyi5HyWw3X";
const invalid_bearer = "Bearer 6510f40adeb51c904347309d";
const invalid_store_id = "64apSFzsKUn89kv0NPs81i9t";

beforeAll(async () => {
  const users = await createTest();
  user = users[0];
  store = user.store;

  second_user = users[1];
  second_store = second_user.store;

  lost_user = users[2];
  lost_store = lost_user.store;
});

describe("POST: `/api/customers/`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      name: "Lantar Santoso",
      phone_number: "6285102449638",
      address: "Jl Ciputat Raya 3 A, Dki Jakarta",
      store_id: store._id,
    };
    const { status, body } = await supertest(app)
      .post("/api/customers/")
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);
    customer = body.data;

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        address: "Jl Ciputat Raya 3 A, Dki Jakarta",
        name: "Lantar Santoso",
        phone_number: "6285102449638",
      },
      message: "Create customer successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong body data type", () => {
    it("Should return 422 (wrong data type)", async () => {
      const payload = {
        name: "LS",
        phone_number: 6155102,
        address: "Jl Ciputat Raya 3 A, Dki Jakarta",
        store_id: "54safAG8fs9700sFas",
      };
      const { status, body } = await supertest(app)
        .post("/api/customers/")
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
        name: "K",
        phone_number: "6285102449638",
        address: "Jl Ciputat Raya 3 A, Dki Jakarta",
        store_id: store._id,
      };
      const { status, body } = await supertest(app)
        .post("/api/customers/")
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

    it("Should return 422 (wrong 'phone_number' data type)", async () => {
      const payload = {
        name: "Lantar Santoso",
        phone_number: 6574124,
        store_id: store._id,
      };
      const { status, body } = await supertest(app)
        .post("/api/customers/")
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
        name: "Lantar Santoso",
        phone_number: "6285102449638",
        address: "Jl Ciputat Raya 3 A, Dki Jakarta",
        store_id: invalid_store_id,
      };
      const { status, body } = await supertest(app)
        .post("/api/customers/")
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
      name: "Lantar Santoso",
      phone_number: "6285102449638",
      address: "Jl Ciputat Raya 3 A, Dki Jakarta",
      store_id: store._id,
    };
    const { status, body } = await supertest(app)
      .post("/api/customers/")
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
      name: "Lantar Santoso",
      phone_number: "6285102449638",
      address: "Jl Ciputat Raya 3 A, Dki Jakarta",
      store_id: store._id,
    };
    const { status, body } = await supertest(app)
      .post("/api/customers/")
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
      name: "Lantar Santoso",
      phone_number: "6285102449638",
      address: "Jl Ciputat Raya 3 A, Dki Jakarta",
      store_id: store._id,
    };
    const { status, body } = await supertest(app)
      .post("/api/customers/")
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
      name: "Lantar Santoso",
      phone_number: "6285102449638",
      address: "Jl Ciputat Raya 3 A, Dki Jakarta",
      store_id: store._id,
    };
    const { status, body } = await supertest(app)
      .post("/api/customers/")
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
      name: "Lantar Santoso",
      phone_number: "6285102449638",
      address: "Jl Ciputat Raya 3 A, Dki Jakarta",
      store_id: store._id,
    };
    const { status, body } = await supertest(app)
      .post("/api/customers/")
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
        name: "Lantar Santoso",
        phone_number: "6285102449638",
        address: "Jl Ciputat Raya 3 A, Dki Jakarta",
        store_id: store._id,
      };
      const { status, body } = await supertest(app)
        .post("/api/customers/")
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
        name: "Lantar Santoso",
        phone_number: "6285102449638",
        address: "Jl Ciputat Raya 3 A, Dki Jakarta",
        store_id: lost_store._id,
      };
      const { status, body } = await supertest(app)
        .post("/api/customers/")
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

describe("GET: `/api/customers/:id`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      store_id: store._id,
    };
    const { status, body } = await supertest(app)
      .get(`/api/customers/${customer._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .query(payload);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        address: "Jl Ciputat Raya 3 A, Dki Jakarta",
        name: "Lantar Santoso",
        phone_number: "6285102449638",
        transactions: [],
      },
      message: "Get customer by id successfully!!",
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
        .get(`/api/customers/${invalid_params}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .query(payload);

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
        .get(`/api/customers/${customer._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .query(payload);

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
      .get(`/api/customers/${customer._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", second_user.bearer_token)
      .query(payload);

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
      .get(`/api/customers/${customer._id.toString()}`)
      .set("Authorization", user.bearer_token)
      .query(payload);

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
      .get(`/api/customers/${customer._id.toString()}`)
      .set("Cookie", user.cookies)
      .query(payload);

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
      .get(`/api/customers/${customer._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", invalid_bearer)
      .query(payload);

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
      store_id: second_store._id,
    };
    const { status, body } = await supertest(app)
      .get(`/api/customers/${customer._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .query(payload);

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
        store_id: store._id,
      };
      const { status, body } = await supertest(app)
        .get(`/api/customers/${customer._id.toString()}`)
        .set("Cookie", lost_user.cookies)
        .set("Authorization", lost_user.bearer_token)
        .query(payload);

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
        .get(`/api/customers/${customer._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .query(payload);

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
        store_id: store._id,
      };
      const { status, body } = await supertest(app)
        .get(`/api/customers/${lost_user.customer._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .query(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Customer not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Customer' not found in the store)", async () => {
      const payload = {
        store_id: store._id,
      };
      const { status, body } = await supertest(app)
        .get(`/api/customers/${second_user.customer._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .query(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Customer not available in the store",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});

describe("GET: `/api/customers/store/:id`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      limit: 1,
      from: 1,
    };
    const { status, body } = await supertest(app)
      .get(`/api/customers/store/${store._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .query(payload);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: [
        {
          _id: expect.any(String),
          address: "Jl Jemursari Slt VIII 3, Jawa Timur",
          name: "Keisha Purwanti",
          phone_number: "6284571263800",
          transactions: expect.any(Array<ObjectId>),
        },
      ],
      message: "Get customer by store id successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const payload = {
        limit: 1,
        from: 1,
      };
      const { status, body } = await supertest(app)
        .get(`/api/customers/store/${invalid_params}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .query(payload);

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
        from: 1,
      };
      const { status, body } = await supertest(app)
        .get(`/api/customers/store/${store._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .query(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it.todo("Should return 422 (wrong 'from' type)");
  });

  it("Should return 401 (different auth id)", async () => {
    const payload = {
      limit: 1,
      from: 1,
    };
    const { status, body } = await supertest(app)
      .get(`/api/customers/store/${store._id.toString()}`)
      .set("Cookie", second_user.cookies)
      .set("Authorization", user.bearer_token)
      .query(payload);

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
      limit: 1,
      from: 1,
    };
    const { status, body } = await supertest(app)
      .get(`/api/customers/store/${store._id.toString()}`)
      .set("Authorization", user.bearer_token)
      .query(payload);

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
      limit: 1,
      from: 1,
    };
    const { status, body } = await supertest(app)
      .get(`/api/customers/store/${store._id.toString()}`)
      .set("Cookie", user.cookies)
      .query(payload);

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
      limit: 1,
      from: 1,
    };
    const { status, body } = await supertest(app)
      .get(`/api/customers/store/${second_store._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", invalid_bearer)
      .query(payload);

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
      limit: 1,
      from: 1,
    };
    const { status, body } = await supertest(app)
      .get(`/api/customers/store/${second_store._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .query(payload);

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
        limit: 1,
        from: 1,
      };
      const { status, body } = await supertest(app)
        .get(`/api/customers/store/${store._id.toString()}`)
        .set("Cookie", lost_user.cookies)
        .set("Authorization", lost_user.bearer_token)
        .query(payload);

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
        limit: 1,
        from: 1,
      };
      const { status, body } = await supertest(app)
        .get(`/api/customers/store/${lost_store._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .query(payload);

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

describe("PATCH: `/api/customers/:id`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      name: "Bambang Santoso",
      phone_number: "62854127895",
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/customers/${customer._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        address: "Jl Ciputat Raya 3 A, Dki Jakarta",
        name: "Bambang Santoso",
        phone_number: "62854127895",
      },
      message: "Patch customer successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const payload = {
        name: "Bambang Santoso",
        phone_number: "62854127895",
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/customers/${invalid_params}`)
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
        name: "Ba",
        phone_number: 62854127895,
        store_id: invalid_store_id,
      };
      const { status, body } = await supertest(app)
        .patch(`/api/customers/${customer._id.toString()}`)
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
        name: "BS",
        phone_number: "62854127895",
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/customers/${customer._id.toString()}`)
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

    it("Should return 422 (wrong 'phone_number' type)", async () => {
      const payload = {
        name: "Bambang Santoso",
        phone_number: 62854127895,
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/customers/${customer._id.toString()}`)
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
        name: "Bambang Santoso",
        phone_number: "62854127895",
        store_id: invalid_store_id,
      };
      const { status, body } = await supertest(app)
        .patch(`/api/customers/${customer._id.toString()}`)
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
      name: "Bambang Santoso",
      phone_number: "62854127895",
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/customers/${customer._id.toString()}`)
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
      name: "Bambang Santoso",
      phone_number: "62854127895",
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/customers/${customer._id.toString()}`)
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
      name: "Bambang Santoso",
      phone_number: "62854127895",
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/customers/${customer._id.toString()}`)
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

  it("Should return 403 (invalid auth header)", async () => {
    const payload = {
      name: "Bambang Santoso",
      phone_number: "62854127895",
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/customers/${customer._id.toString()}`)
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
      name: "Bambang Santoso",
      phone_number: "62854127895",
      store_id: second_store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .patch(`/api/customers/${customer._id.toString()}`)
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

  describe("'SOMETHING' not found", () => {
    it("Should return 404 ('User' not found)", async () => {
      const payload = {
        name: "Bambang Santoso",
        phone_number: "62854127895",
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/customers/${second_user.customer._id.toString()}`)
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
        name: "Bambang Santoso",
        phone_number: "62854127895",
        store_id: lost_store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/customers/${customer._id.toString()}`)
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
        name: "Bambang Santoso",
        phone_number: "62854127895",
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/customers/${lost_user.customer._id.toString()}`)
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

    it("Should return 404 ('Customer' not found in the store)", async () => {
      const payload = {
        name: "Bambang Santoso",
        phone_number: "62854127895",
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .patch(`/api/customers/${second_user.customer._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Customer not available in the store",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});

describe("DELETE: `/api/customers/:id`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .delete(`/api/customers/${customer._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {},
      message: "Delete customer successfully!!",
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
        .delete(`/api/customers/${invalid_params}`)
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
        .delete(`/api/customers/${user.customer._id.toString()}`)
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
      .delete(`/api/customers/${user.customer._id.toString()}`)
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
      .delete(`/api/customers/${user.customer._id.toString()}`)
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
      .delete(`/api/customers/${user.customer._id.toString()}`)
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

  it("Should return 403 (invalid auth header)", async () => {
    const payload = {
      store_id: store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .delete(`/api/customers/${user.customer._id.toString()}`)
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
      store_id: second_store._id.toString(),
    };
    const { status, body } = await supertest(app)
      .delete(`/api/customers/${user.customer._id.toString()}`)
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

  describe("'SOMETHING' not found", () => {
    it("Should return 404 ('User' not found)", async () => {
      const payload = {
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .delete(`/api/customers/${customer._id.toString()}`)
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
        .delete(`/api/customers/${customer._id.toString()}`)
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
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .delete(`/api/customers/${lost_user.customer._id.toString()}`)
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

    it("Should return 404 ('Customer' not found in the store)", async () => {
      const payload = {
        store_id: store._id.toString(),
      };
      const { status, body } = await supertest(app)
        .delete(`/api/customers/${second_user.customer._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .send(payload);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Customer not available in the store",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});
