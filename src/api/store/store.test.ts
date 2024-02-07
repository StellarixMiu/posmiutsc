import supertest from "supertest";
import { ObjectId } from "mongodb";
import { deleteR2Image } from "../../utils/image/imageController";
import { Image, ImageSchemaWithId } from "../../utils/image/imageModel";
import { Store, StoreSchemaWithId } from "./storeModel";
import app from "../../app";
import createTest from "../../test/createTest";

let store: StoreSchemaWithId;
let image_id: string;

let user: any;

let second_user: any;
let second_store: any;

let lost_user: any;
let lost_store: any;

const invalid_params = "xsH9yCllOpLaQHPu4UoQjY24";
const invalid_bearer = "Bearer 6510f40adeb51c904347309d";

beforeAll(async () => {
  const users = await createTest();
  user = users[0];

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

describe("POST: `/api/stores/`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      name: "SGroceries",
      address: "Jl Dinoyo 42, Jawa Timur",
      email: "test0@gmail.com",
      phone_number: "6285110735634",
      type: "Grocery",
    };
    const { status, body } = await supertest(app)
      .post("/api/stores/")
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);
    store = body.data;

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        address: "Jl Dinoyo 42, Jawa Timur",
        categories: [],
        coupons: [],
        customers: [],
        email: "test0@gmail.com",
        employees: [],
        invoice: {
          isEnable: true,
        },
        logo: "",
        name: "sgroceries",
        owner: expect.any(String),
        phone_number: "6285110735634",
        products: [],
        type: "grocery",
        website: "",
      },
      message: "Create store successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong data type)", async () => {
      const payload = {
        name: "sG",
        address: "Jl Dinoyo 42, Jawa Timur",
        email: "test88@yahoo.com",
        phone_number: 62851107,
        type: "Grocery",
      };
      const { status, body } = await supertest(app)
        .post("/api/stores/")
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
        name: "SGroceries",
        address: "Jl Dinoyo 42, Jawa Timur",
        phone_number: 6285110735634,
        type: "Grocery",
      };
      const { status, body } = await supertest(app)
        .post("/api/stores/")
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
        name: "s",
        address: "Jl Dinoyo 42, Jawa Timur",
        phone_number: "6285110735634",
        type: "Grocery",
      };
      const { status, body } = await supertest(app)
        .post("/api/stores/")
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
      name: "SGroceries",
      address: "Jl Dinoyo 42, Jawa Timur",
      email: "test88@gmail.com",
      phone_number: "6285110735634",
      type: "Grocery",
    };
    const { status, body } = await supertest(app)
      .post("/api/stores/")
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
      name: "SGroceries",
      address: "Jl Dinoyo 42, Jawa Timur",
      email: "test88@gmail.com",
      phone_number: "6285110735634",
      type: "Grocery",
    };
    const { status, body } = await supertest(app)
      .post("/api/stores/")
      .set("Cookie", user.bearer_token)
      .send(payload);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Authorization header is needed",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no auth header)", async () => {
    const payload = {
      name: "SGroceries",
      address: "Jl Dinoyo 42, Jawa Timur",
      email: "test88@gmail.com",
      phone_number: "6285110735634",
      type: "Grocery",
    };
    const { status, body } = await supertest(app)
      .post("/api/stores/")
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
      name: "SGroceries",
      address: "Jl Dinoyo 42, Jawa Timur",
      email: "test88@gmail.com",
      phone_number: "6285110735634",
      type: "Grocery",
    };
    const { status, body } = await supertest(app)
      .post("/api/stores/")
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

  describe("Duplicate data", () => {
    it("Should return 409 (duplicate phone_number)", async () => {
      const payload = {
        name: "EZGrocery",
        address: "Jl Gombel Permai X/254, Jawa Tengah",
        email: "test88@gmail.com",
        phone_number: "628597830405",
        type: "grocery",
      };
      const { status, body } = await supertest(app)
        .post("/api/stores/")
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

    it("Should return 409 (duplicate email)", async () => {
      const payload = {
        name: "AGrocery",
        address: "Jl Gombel Permai X/254, Jawa Tengah",
        email: "test0@gmail.com",
        phone_number: "62859833029",
        type: "grocery",
      };
      const { status, body } = await supertest(app)
        .post("/api/stores/")
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
  });

  describe("'SOMETHING' not found", () => {
    it("Should return 404 ('User' not found)", async () => {
      const payload = {
        name: "SGroceries",
        address: "Jl Dinoyo 42, Jawa Timur",
        email: "test88@gmail.com",
        phone_number: "6285110735634",
        type: "Grocery",
      };
      const { status, body } = await supertest(app)
        .post("/api/stores/")
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
  });
});

describe("POST: `/api/stores/:id/logo`", () => {
  it("Should return 200 (successfully)", async () => {
    const { status, body } = await supertest(app)
      .post(`/api/stores/${store._id.toString()}/logo`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg");
    image_id = body.data.logo;

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        address: "Jl Dinoyo 42, Jawa Timur",
        categories: [],
        coupons: [],
        customers: [],
        email: "test0@gmail.com",
        employees: [],
        invoice: {
          isEnable: true,
        },
        logo: expect.any(String),
        name: "sgroceries",
        owner: expect.any(String),
        phone_number: "6285110735634",
        products: [],
        type: "grocery",
        website: "",
      },
      message: "Add store logo successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const { status, body } = await supertest(app)
        .post(`/api/stores/${invalid_params}/logo`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/0.jpg");

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong file type)", async () => {
      const { status, body } = await supertest(app)
        .post(`/api/stores/${store._id.toString()}/logo`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/test.txt");

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
    const { status, body } = await supertest(app)
      .post(`/api/stores/${store._id.toString()}/logo`)
      .set("Cookie", user.cookies)
      .set("Authorization", second_user.bearer_token)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg");

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Mismatch between `auth_id` and `cookies_id`",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no cookies)", async () => {
    const { status, body } = await supertest(app)
      .post(`/api/stores/${store._id.toString()}/logo`)
      .set("Cookie", user.bearer_token)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg");

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Authorization header is needed",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no auth header)", async () => {
    const { status, body } = await supertest(app)
      .post(`/api/stores/${store._id.toString()}/logo`)
      .set("Cookie", user.cookies)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg");

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Authorization header is needed",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 403 (invalid auth header)", async () => {
    const { status, body } = await supertest(app)
      .post(`/api/stores/${store._id.toString()}/logo`)
      .set("Cookie", user.cookies)
      .set("Authorization", invalid_bearer)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg");

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "Invalid token at authorization header",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  it("Should return 403 (no access store)", async () => {
    const { status, body } = await supertest(app)
      .post(`/api/stores/${store._id.toString()}/logo`)
      .set("Cookie", second_user.cookies)
      .set("Authorization", second_user.bearer_token)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg");

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "You do not have access rights to this store",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  it("Should return 400 (Store already has an logo)", async () => {
    const { status, body } = await supertest(app)
      .post(`/api/stores/${store._id.toString()}/logo`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg");

    expect(status).toBe(400);
    expect(body).toEqual({
      data: "Store already has a logo",
      message: "Bad Request!!!",
      status: 400,
      success: false,
    });
  });

  it.skip("Should return 500 ('Failed to upload image to Cloudflare R2')", () => {});

  describe("'SOMETHING' not found", () => {
    it("Should return 404 ('User' not found)", async () => {
      const { status, body } = await supertest(app)
        .post(`/api/stores/${store._id.toString()}/logo`)
        .set("Cookie", lost_user.cookies)
        .set("Authorization", lost_user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/0.jpg");

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "User not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Store' not found)", async () => {
      const { status, body } = await supertest(app)
        .post(`/api/stores/${lost_store._id.toString()}/logo`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/0.jpg");

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

describe("GET: `/api/stores/:id", () => {
  it("Should return 200 (successfully)", async () => {
    const { status, body } = await supertest(app)
      .get(`/api/stores/${store._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token);
    store = body.data;

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        address: "Jl Dinoyo 42, Jawa Timur",
        categories: [],
        coupons: [],
        customers: [],
        email: "test0@gmail.com",
        employees: [],
        invoice: {
          isEnable: true,
        },
        logo: expect.any(String),
        name: "sgroceries",
        owner: expect.any(String),
        phone_number: "6285110735634",
        products: [],
        type: "grocery",
        website: "",
      },
      message: "Get store by id successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const { status, body } = await supertest(app)
        .get(`/api/stores/${invalid_params}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token);

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
    const { status, body } = await supertest(app)
      .get(`/api/stores/${store._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", second_user.bearer_token);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Mismatch between `auth_id` and `cookies_id`",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no cookies)", async () => {
    const { status, body } = await supertest(app)
      .get(`/api/stores/${store._id.toString()}`)
      .set("Authorization", user.bearer_token);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Request cookies not defined",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no auth header)", async () => {
    const { status, body } = await supertest(app)
      .get(`/api/stores/${store._id.toString()}`)
      .set("Cookie", user.cookies);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Authorization header is needed",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 403 (invalid auth header)", async () => {
    const { status, body } = await supertest(app)
      .get(`/api/stores/${store._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", invalid_bearer);

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "Invalid token at authorization header",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  it("Should return 403 (no access store)", async () => {
    const { status, body } = await supertest(app)
      .get(`/api/stores/${store._id.toString()}`)
      .set("Cookie", second_user.cookies)
      .set("Authorization", second_user.bearer_token);

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
      const { status, body } = await supertest(app)
        .get(`/api/stores/${store._id.toString()}`)
        .set("Cookie", lost_user.cookies)
        .set("Authorization", lost_user.bearer_token);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "User not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Store' not found)", async () => {
      const { status, body } = await supertest(app)
        .get(`/api/stores/${lost_store._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token);

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

describe("GET: `/api/stores/user/:id", () => {
  it("Should return 200 (successfully)", async () => {
    const { status, body } = await supertest(app)
      .get(`/api/stores/user/${user._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: [
        {
          _id: expect.any(String),
          address: "Jl Keatrian V A 12, Dki Jakarta",
          categories: expect.any(Array<String>),
          coupons: expect.any(Array<String>),
          customers: expect.any(Array<String>),
          email: "test@gmail.com",
          employees: [],
          invoice: {
            isEnable: true,
          },
          logo: expect.any(String),
          name: "storely",
          owner: expect.any(String),
          phone_number: "6285741248965",
          products: [expect.any(String)],
          type: "grocery",
          website: "",
        },
        {
          _id: expect.any(String),
          address: "Jl Dinoyo 42, Jawa Timur",
          categories: [],
          coupons: [],
          customers: [],
          email: "test0@gmail.com",
          employees: [],
          invoice: {
            isEnable: true,
          },
          logo: expect.any(String),
          name: "sgroceries",
          owner: expect.any(String),
          phone_number: "6285110735634",
          products: [],
          type: "grocery",
          website: "",
        },
      ],
      message: "Get store by user id successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const { status, body } = await supertest(app)
        .get(`/api/stores/user/${invalid_params}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token);

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
    const { status, body } = await supertest(app)
      .get(`/api/stores/user/${user._id.toString()}`)
      .set("Cookie", second_user.cookies)
      .set("Authorization", user.bearer_token);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Mismatch between `auth_id` and `cookies_id`",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no cookies)", async () => {
    const { status, body } = await supertest(app)
      .get(`/api/stores/user/${user._id.toString()}`)
      .set("Authorization", user.bearer_token);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Request cookies not defined",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no auth header)", async () => {
    const { status, body } = await supertest(app)
      .get(`/api/stores/user/${user._id.toString()}`)
      .set("Cookie", user.cookies);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Authorization header is needed",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 403 (invalid auth header)", async () => {
    const { status, body } = await supertest(app)
      .get(`/api/stores/user/${user._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", invalid_bearer);

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "Invalid token at authorization header",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  describe("'SOMETHING' not found", () => {
    it("Should return 404 ('User' not found)", async () => {
      const { status, body } = await supertest(app)
        .get(`/api/stores/user/${lost_user._id.toString()}`)
        .set("Cookie", lost_user.cookies)
        .set("Authorization", lost_user.bearer_token);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "User not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Store' not found)", async () => {
      await supertest(app)
        .post("/api/stores/")
        .set("Cookie", second_user.cookies)
        .set("Authorization", second_user.bearer_token)
        .send({
          name: "The corner shop",
          address: "Jl Dinoyo 12, Jawa Timur",
          phone_number: "6285110738411",
          email: "test80@gmail.com",
          type: "Grocery",
        })
        .then(async ({ body }) => {
          await Store.deleteOne({ _id: new ObjectId(body.data._id) });
        });

      const { status, body } = await supertest(app)
        .get(`/api/stores/user/${second_user._id.toString()}`)
        .set("Cookie", second_user.cookies)
        .set("Authorization", second_user.bearer_token);

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

describe("GET: `/api/stores/:id/owner`", () => {
  it("Should return 200 (successfully)", async () => {
    const { status, body } = await supertest(app)
      .get(`/api/stores/${store._id.toString()}/owner`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        email: "n***********no11@gmail.com",
        name: "nugraha suryono",
        phone_number: "628*******684",
      },
      message: "Get store owner successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const { status, body } = await supertest(app)
        .get(`/api/stores/${invalid_params}/owner`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token);

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
    const { status, body } = await supertest(app)
      .get(`/api/stores/${store._id.toString()}/owner`)
      .set("Cookie", user.cookies)
      .set("Authorization", second_user.bearer_token);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Mismatch between `auth_id` and `cookies_id`",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no cookies)", async () => {
    const { status, body } = await supertest(app)
      .get(`/api/stores/${store._id.toString()}/owner`)
      .set("Authorization", user.bearer_token);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Request cookies not defined",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no auth header)", async () => {
    const { status, body } = await supertest(app)
      .get(`/api/stores/${store._id.toString()}/owner`)
      .set("Cookie", user.cookies);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Authorization header is needed",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 403 (invalid auth header)", async () => {
    const { status, body } = await supertest(app)
      .get(`/api/stores/${store._id.toString()}/owner`)
      .set("Cookie", user.cookies)
      .set("Authorization", invalid_bearer);

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "Invalid token at authorization header",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  it("Should return 403 (no access store)", async () => {
    const { status, body } = await supertest(app)
      .get(`/api/stores/${store._id.toString()}/owner`)
      .set("Cookie", second_user.cookies)
      .set("Authorization", second_user.bearer_token);

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
      const { status, body } = await supertest(app)
        .get(`/api/stores/${store._id.toString()}/owner`)
        .set("Cookie", lost_user.cookies)
        .set("Authorization", lost_user.bearer_token);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "User not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Store' not found)", async () => {
      const { status, body } = await supertest(app)
        .get(`/api/stores/${lost_store._id.toString()}/owner`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token);

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

describe("PATCH: `/api/stores/:id`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      name: "SGroceries",
      email: "SGroceries2@gmail.com",
      address: "Jl Dinoyo 40, Jawa Timur",
      phone_number: "6285102795413",
    };
    const { status, body } = await supertest(app)
      .patch(`/api/stores/${store._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        address: "Jl Dinoyo 40, Jawa Timur",
        categories: [],
        coupons: [],
        customers: [],
        email: "sgroceries2@gmail.com",
        employees: [],
        invoice: {
          isEnable: true,
        },
        logo: expect.any(String),
        name: "sgroceries",
        owner: expect.any(String),
        phone_number: "6285102795413",
        products: [],
        type: "grocery",
        website: "",
      },
      message: "Patch store by id successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const payload = {
        name: "SGroceries",
        email: "SGroceries2@gmail.com",
        address: "Jl Dinoyo 40, Jawa Timur",
        phone_number: "6285102795413",
      };
      const { status, body } = await supertest(app)
        .patch(`/api/stores/${invalid_params}`)
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
        name: "sG",
        email: "SGroceries2@yahoo.com",
        address: "Jl Dinoyo 40, Jawa Timur",
        phone_number: 628510279541399,
      };
      const { status, body } = await supertest(app)
        .patch(`/api/stores/${store._id.toString()}`)
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
        name: "sG",
        email: "SGroceries2@gmail.com",
        address: "Jl Dinoyo 40, Jawa Timur",
        phone_number: "6285102795413",
      };
      const { status, body } = await supertest(app)
        .patch(`/api/stores/${store._id.toString()}`)
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

    it("Should return 422 (wrong 'email' type)", async () => {
      const payload = {
        name: "SGroceries",
        email: "SGroceries2@yahoo.com",
        address: "Jl Dinoyo 40, Jawa Timur",
        phone_number: "6285102795413",
      };
      const { status, body } = await supertest(app)
        .patch(`/api/stores/${store._id.toString()}`)
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
        name: "SGroceries",
        email: "SGroceries2@gmail.com",
        address: "Jl Dinoyo 40, Jawa Timur",
        phone_number: 628510279541399,
      };
      const { status, body } = await supertest(app)
        .patch(`/api/stores/${store._id.toString()}`)
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
      name: "SGroceries",
      email: "SGroceries2@gmail.com",
      address: "Jl Dinoyo 40, Jawa Timur",
      phone_number: "6285102795413",
    };
    const { status, body } = await supertest(app)
      .patch(`/api/stores/${store._id.toString()}`)
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
      name: "SGroceries",
      email: "SGroceries2@gmail.com",
      address: "Jl Dinoyo 40, Jawa Timur",
      phone_number: "6285102795413",
    };
    const { status, body } = await supertest(app)
      .patch(`/api/stores/${store._id.toString()}`)
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
      name: "SGroceries",
      email: "SGroceries2@gmail.com",
      address: "Jl Dinoyo 40, Jawa Timur",
      phone_number: "6285102795413",
    };
    const { status, body } = await supertest(app)
      .patch(`/api/stores/${store._id.toString()}`)
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
      name: "SGroceries",
      email: "SGroceries2@gmail.com",
      address: "Jl Dinoyo 40, Jawa Timur",
      phone_number: "6285102795413",
    };
    const { status, body } = await supertest(app)
      .patch(`/api/stores/${store._id.toString()}`)
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
      name: "SGroceries",
      email: "SGroceries2@gmail.com",
      address: "Jl Dinoyo 40, Jawa Timur",
      phone_number: "6285102795413",
    };
    const { status, body } = await supertest(app)
      .patch(`/api/stores/${store._id.toString()}`)
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
        name: "SGroceries",
        email: "SGroceries2@gmail.com",
        address: "Jl Dinoyo 40, Jawa Timur",
        phone_number: "6285102795413",
      };
      const { status, body } = await supertest(app)
        .patch(`/api/stores/${store._id.toString()}`)
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
        name: "SGroceries",
        email: "SGroceries2@gmail.com",
        address: "Jl Dinoyo 40, Jawa Timur",
        phone_number: "6285102795413",
      };
      const { status, body } = await supertest(app)
        .patch(`/api/stores/${lost_store._id.toString()}`)
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

describe("PATCH: `/api/stores/:id/logo`", () => {
  it("Should return 200 (successfully)", async () => {
    const { status, body } = await supertest(app)
      .patch(`/api/stores/${store._id.toString()}/logo`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg");

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        address: "Jl Dinoyo 40, Jawa Timur",
        categories: [],
        coupons: [],
        customers: [],
        email: "sgroceries2@gmail.com",
        employees: [],
        invoice: {
          isEnable: true,
        },
        logo: expect.any(String),
        name: "sgroceries",
        owner: expect.any(String),
        phone_number: "6285102795413",
        products: [],
        type: "grocery",
        website: "",
      },
      message: "Patch store logo successfully!!",
      status: 200,
      success: true,
    });

    const image: ImageSchemaWithId | null = await Image.findOne({
      _id: new ObjectId(body.data.logo),
    });
    if (image?._id.toString().length !== 0) {
      await deleteR2Image(image?.name.split(".")[0]);
    }
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const { status, body } = await supertest(app)
        .patch(`/api/stores/${invalid_params}/logo`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/0.jpg");

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong file type)", async () => {
      const { status, body } = await supertest(app)
        .patch(`/api/stores/${store._id.toString()}/logo`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/test.txt");

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
    const { status, body } = await supertest(app)
      .patch(`/api/stores/${store._id.toString()}/logo`)
      .set("Cookie", user.cookies)
      .set("Authorization", second_user.bearer_token)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg");

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Mismatch between `auth_id` and `cookies_id`",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no cookies)", async () => {
    const { status, body } = await supertest(app)
      .patch(`/api/stores/${store._id.toString()}/logo`)
      .set("Cookie", user.bearer_token)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg");

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Authorization header is needed",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no auth header)", async () => {
    const { status, body } = await supertest(app)
      .patch(`/api/stores/${store._id.toString()}/logo`)
      .set("Cookie", user.cookies)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg");

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Authorization header is needed",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 403 (invalid auth header)", async () => {
    const { status, body } = await supertest(app)
      .patch(`/api/stores/${store._id.toString()}/logo`)
      .set("Cookie", user.cookies)
      .set("Authorization", invalid_bearer)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg");

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "Invalid token at authorization header",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  it("Should return 403 (no access store)", async () => {
    const { status, body } = await supertest(app)
      .patch(`/api/stores/${store._id.toString()}/logo`)
      .set("Cookie", second_user.cookies)
      .set("Authorization", second_user.bearer_token)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg");

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
      const { status, body } = await supertest(app)
        .patch(`/api/stores/${store._id.toString()}/logo`)
        .set("Cookie", lost_user.cookies)
        .set("Authorization", lost_user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/0.jpg");

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "User not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Store' not found)", async () => {
      const { status, body } = await supertest(app)
        .patch(`/api/stores/${lost_store._id.toString()}/logo`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/0.jpg");

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Store not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 400 ('Store logo' not found)", async () => {
      const { status, body } = await supertest(app)
        .patch(`/api/stores/${second_store._id.toString()}/logo`)
        .set("Cookie", second_user.cookies)
        .set("Authorization", second_user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/0.jpg");

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "Store logo not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});

describe("DELETE: `/api/stores/:id`", () => {
  it("Should return 200 (successfully)", async () => {
    const { status, body } = await supertest(app)
      .delete(`/api/stores/${store._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {},
      message: "Delete store successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const { status, body } = await supertest(app)
        .delete(`/api/stores/${invalid_params}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token);

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
    const { status, body } = await supertest(app)
      .delete(`/api/stores/${user.store._id.toString()}`)
      .set("Cookie", second_user.cookies)
      .set("Authorization", user.bearer_token);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Mismatch between `auth_id` and `cookies_id`",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no cookies)", async () => {
    const { status, body } = await supertest(app)
      .delete(`/api/stores/${user.store._id.toString()}`)
      .set("Authorization", user.bearer_token);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Request cookies not defined",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no auth header)", async () => {
    const { status, body } = await supertest(app)
      .delete(`/api/stores/${user.store._id.toString()}`)
      .set("Cookie", user.cookies);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Authorization header is needed",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 403 (invalid auth header)", async () => {
    const { status, body } = await supertest(app)
      .delete(`/api/stores/${user.store._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", invalid_bearer);

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "Invalid token at authorization header",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  it("Should return 403 (no access store)", async () => {
    const { status, body } = await supertest(app)
      .delete(`/api/stores/${user.store._id.toString()}`)
      .set("Cookie", second_user.cookies)
      .set("Authorization", second_user.bearer_token);

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "You do not have access rights to this store",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  it.skip("Should return 403 (not store owner)", async () => {
    const { status, body } = await supertest(app)
      .delete(`/api/stores/${user.store._id.toString()}`)
      .set("Cookie", second_user.cookies)
      .set("Authorization", second_user.bearer_token);

    expect(status).toBe(403);
    expect(body).toEqual({
      data: "You do not have the necessary permissions to delete this store",
      message: "Forbidden!!!",
      status: 403,
      success: false,
    });
  });

  describe("'SOMETHING' not found", () => {
    it("Should return 404 ('User' not found)", async () => {
      const { status, body } = await supertest(app)
        .delete(`/api/stores/${store._id.toString()}`)
        .set("Cookie", lost_user.cookies)
        .set("Authorization", lost_user.bearer_token);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "User not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });

    it("Should return 404 ('Store' not found)", async () => {
      const { status, body } = await supertest(app)
        .delete(`/api/stores/${lost_store._id.toString()}`)
        .set("Cookie", user.cookies)
        .set("Authorization", user.bearer_token);

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
