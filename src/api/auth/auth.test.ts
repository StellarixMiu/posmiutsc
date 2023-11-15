import supertest from "supertest";
import app from "../../app";
import createTest from "../../test/createTest";
import { UserSchemaWithId, User } from "../user/userModel";

let user: UserSchemaWithId;
let users: Array<any>;
let cookies: any;

let lost_user: any;

beforeAll(async () => {
  users = await createTest();
  lost_user = users[2];
});

describe("POST: `/api/auth/signup`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      name: "stellarix miu",
      email: "stelarixmiu@gmail.com",
      phone_number: "6285110735634",
      password: "P7Imh2rvs0bx9Qq",
    };
    const { status, body } = await supertest(app)
      .post("/api/auth/signup")
      .send(payload);

    user = body.data;
    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        account_type: "FREE",
        email: "stelarixmiu@gmail.com",
        image: "",
        isVerified: false,
        name: "stellarix miu",
        phone_number: "6285110735634",
        work_at: [],
      },
      message: "Sign up user successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong body data type", () => {
    it("Should return 422 (wrong data type)", async () => {
      const payload = {
        name: "stellarix miu",
        email: "stelarixmiu@yahoo.com",
        phone_number: 62851107,
        password: "dH6ZEz",
      };
      const { status, body } = await supertest(app)
        .post("/api/auth/signup")
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
        name: "stellarix miu",
        email: "stelarixmiu@yahoo.com",
        phone_number: "6285110735634",
        password: "dH6ZECx84d5",
      };
      const { status, body } = await supertest(app)
        .post("/api/auth/signup")
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
        name: "stellarix miu",
        email: "stelarixmiu@gmail.com",
        phone_number: 6285110735634,
        password: "dH6ZECx84d5",
      };
      const { status, body } = await supertest(app)
        .post("/api/auth/signup")
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it.todo("Should return 422 (wrong 'password' type)");
  });

  it("Should return 409 (duplicate data)", async () => {
    const payload = {
      name: users[1].name,
      email: users[1].email,
      phone_number: users[1].phone_number,
      password: users[1].password,
    };
    const { status, body } = await supertest(app)
      .post("/api/auth/signup")
      .send(payload);

    expect(status).toBe(409);
    expect(body).toEqual({
      data: 'E11000 duplicate key error collection: pos_test.Users index: phone_number_1 dup key: { phone_number: "6280301095501" }',
      message: "Bad Request!!!",
      status: 409,
      success: false,
    });
  });
});

describe("POST: `/api/auth/signin`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      email: user.email,
      password: "P7Imh2rvs0bx9Qq",
    };
    const { body, status, headers } = await supertest(app)
      .post("/api/auth/signin")
      .send(payload);
    cookies = headers["set-cookie"];

    expect(status).toBe(200);
    expect(headers["set-cookie"]).toHaveLength(1);
    expect(body).toEqual({
      message: "Sign in user successfully!!",
      status: 200,
      success: true,
      data: {
        access_token: expect.any(String),
      },
    });
  });

  describe("wrong body data type", () => {
    it("Should return 422 (wrong data type)", async () => {
      const payload = {
        email: "stelarixmiu@yahoo.com",
        password: 485,
      };
      const { body, status } = await supertest(app)
        .post("/api/auth/signin")
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong 'email' data type)", async () => {
      const payload = {
        email: "stelarixmiu@yahoo.com",
        password: "P7Imh2rvs0bx9Qq",
      };
      const { body, status } = await supertest(app)
        .post("/api/auth/signin")
        .send(payload);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });

    it("Should return 422 (wrong 'password' data type)", async () => {
      const payload = {
        email: user.email,
        password: 1589,
      };
      const { body, status } = await supertest(app)
        .post("/api/auth/signin")
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

  it("Should return 400 (wrong credentials)", async () => {
    const payload = {
      email: user.email,
      password: "fQAj7i75IP0M6XO",
    };
    const { body, status } = await supertest(app)
      .post("/api/auth/signin")
      .send(payload);

    expect(status).toBe(400);
    expect(body).toEqual({
      data: "Password doesn't match",
      message: "Bad Request!!!",
      status: 400,
      success: false,
    });
  });

  describe("'SOMETHING' Not Found", () => {
    it("Should return 404 (User not found)", async () => {
      const payload = {
        email: "miustellar@gmail.com",
        password: "P7Imh2rvs0bx9Qq",
      };
      const { body, status } = await supertest(app)
        .post("/api/auth/signin")
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

describe("DELETE: `/api/auth/signout/:id`", () => {
  it("Should return 200 (successfully)", async () => {
    const { body, status } = await supertest(app)
      .delete(`/api/auth/signout/${user._id}`)
      .set("Cookie", cookies);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {},
      message: "Sign out user successfully!!",
      status: 200,
      success: true,
    });
  });

  it("Should return 401 (different auth id)", async () => {
    const { body, status } = await supertest(app)
      .delete(`/api/auth/signout/${users[1]._id}`)
      .set("Cookie", cookies);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Mismatch between `auth_id` and `cookies_id`",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (no cookies)", async () => {
    const { body, status } = await supertest(app).delete(
      `/api/auth/signout/${users[1]._id}`
    );

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Request cookies not defined",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  describe("wrong params type", () => {
    it("Should return 422 (wrong id type)", async () => {
      const { body, status } = await supertest(app)
        .delete("/api/auth/signout/t5T5ADAkTzQPtBJEkI8v8E55")
        .set("Cookie", cookies);

      expect(status).toBe(422);
      expect(body).toEqual({
        data: expect.any(Array),
        message: "ZodError!!!",
        status: 422,
        success: false,
      });
    });
  });

  describe("'SOMETHING' Not Found", () => {
    it("Should return 404 (User not found)", async () => {
      const { body, status } = await supertest(app)
        .delete(`/api/auth/signout/${lost_user._id}`)
        .set("Cookie", lost_user.cookies);

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
