import supertest from "supertest";
import app from "../../app";
import createTest from "../../test/createTest";
import { ObjectId } from "mongodb";

let user: any;

let second_user: any;
let second_store: any;

let lost_user: any;
let lost_store: any;

beforeAll(async () => {
  const users = await createTest();
  user = users[0];

  second_user = users[1];
  second_store = second_user.store;

  lost_user = users[2];
  lost_store = lost_user.store;
});

describe("GET: `/api/users/:id/token`", () => {
  it("Should return 200 (successfully)", async () => {
    const { status, body } = await supertest(app)
      .get(`/api/users/${user._id.toString()}/token`)
      .set("Cookie", user.cookies);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        access_token: expect.any(String),
      },
      message: "Get access token successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const { status, body } = await supertest(app)
        .get("/api/users/BU51Rd844IOrX5F9hdBVGkZm5/token")
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

  it("Should return 401 (no cookies)", async () => {
    const { status, body } = await supertest(app).get(
      `/api/users/${user._id.toString()}/token`
    );

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Request cookies not defined",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  it("Should return 401 (different auth id)", async () => {
    const { status, body } = await supertest(app)
      .get(`/api/users/${user._id.toString()}/token`)
      .set("Cookie", second_user.cookies);

    expect(status).toBe(401);
    expect(body).toEqual({
      data: "Mismatch between `auth_id` and `cookies_id`",
      message: "Unauthorized!!!",
      status: 401,
      success: false,
    });
  });

  describe("'SOMETHING' not found", () => {
    it("Should return 404 ('User' not found)", async () => {
      const { status, body } = await supertest(app)
        .get(`/api/users/${lost_user._id.toString()}/token`)
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

describe("GET: `/api/users/`", () => {
  it("Should return 200 (successfully)", async () => {
    const { status, body } = await supertest(app)
      .get(`/api/users/`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        account_type: "FREE",
        email: "nugrahasuryono11@gmail.com",
        image: "",
        isVerified: false,
        name: "nugraha suryono",
        phone_number: "6284795324684",
        work_at: expect.any(Array<ObjectId>),
      },
      message: "Get user by token successfully!!",
      status: 200,
      success: true,
    });
  });

  it("Should return 401 (different auth id)", async () => {
    const { status, body } = await supertest(app)
      .get(`/api/users/`)
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
      .get(`/api/users/`)
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
      .get(`/api/users/`)
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
      .get(`/api/users/`)
      .set("Cookie", user.cookies)
      .set("Authorization", "Bearer 652149673c548c04f1f0b4d2");

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
        .get(`/api/users/`)
        .set("Cookie", lost_user.cookies)
        .set("Authorization", lost_user.bearer_token);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "user not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});

describe("GET: `/api/users/:id", () => {
  it("Should return 200 (successfully)", async () => {
    const { status, body } = await supertest(app)
      .get(`/api/users/${user._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        account_type: "FREE",
        email: "nugrahasuryono11@gmail.com",
        image: "",
        isVerified: false,
        name: "nugraha suryono",
        phone_number: "6284795324684",
        work_at: expect.any(Array<ObjectId>),
      },
      message: "Get user by id successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const { status, body } = await supertest(app)
        .get(`/api/users/BU51Rd844I8d46gTE9BVGkZm5`)
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
      .get(`/api/users/${user._id.toString()}`)
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
      .get(`/api/users/${user._id.toString()}`)
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
      .get(`/api/users/${user._id.toString()}`)
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
      .get(`/api/users/${user._id.toString()}`)
      .set("Cookie", user.cookies)
      .set("Authorization", "Bearer 652149673c548c04f1f0b4d2");

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
        .get(`/api/users/${lost_user._id.toString()}`)
        .set("Cookie", lost_user.cookies)
        .set("Authorization", lost_user.bearer_token);

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "user not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});

// describe("PATCH: `/api/users/:id`", () => {
//   it("Should return 200 (successfully)", async () => {
//     const payload = {
//       name: "patch user test",
//       email: "patchtestemail@gmail.com",
//       phone_number: "6281212121212",
//     };

//     const { status, body } = await supertest(app)
//       .patch(`/api/users/${user._id}`)
//       .set("Cookie", user.cookies)
//       .set("Authorization", user.bearer_token)
//       .send(payload);
//     expect(status).toBe(200);
//     expect(body).toEqual({
//       data: {
//         _id: expect.any(String),
//         account_type: expect.any(String),
//         email: expect.any(String),
//         image: expect.any(String),
//         isVerified: expect.any(Boolean),
//         name: expect.any(String),
//         phone_number: expect.any(String),
//         work_at: expect.any(Array),
//       },
//       message: "Success!!",
//       status: 200,
//       success: true,
//     });
//   });

//   it("Should return 400 (duplicate data)", async () => {
//     const payload = {
//       name: "patch user test",
//       email: "patchtestemail@gmail.com",
//       phone_number: "6282222222222",
//     };

//     const { status, body } = await supertest(app)
//       .patch(`/api/users/${user._id}`)
//       .set("Cookie", user.cookies)
//       .set("Authorization", user.bearer_token)
//       .send(payload);
//     expect(status).toBe(400);
//     expect(body).toEqual({
//       data: expect.any(String),
//       message: "Bad Request!!!",
//       status: 400,
//       success: false,
//     });
//   });

//   it("Should return 422 (wrong id type)", async () => {
//     const payload = {
//       name: "patch user test",
//       email: "patchtestemail@gmail.com",
//       phone_number: "6281212121212",
//     };

//     const { status, body } = await supertest(app)
//       .patch(`/api/users/yDBdAAvkTjw3PA55nFYFy7nV`)
//       .set("Cookie", user.cookies)
//       .set("Authorization", user.bearer_token)
//       .send(payload);
//     expect(status).toBe(422);
//     expect(body).toEqual({
//       data: expect.any(Array),
//       message: "ZodError!!!",
//       status: 422,
//       success: false,
//     });
//   });

//   it("Should return 422 (wrong data type)", async () => {
//     const payload = {
//       name: "patch user test",
//       email: "patchtestemail@yahoo.com",
//       phone_number: 6281212121212,
//     };

//     const { status, body } = await supertest(app)
//       .patch(`/api/users/${user._id}`)
//       .set("Cookie", user.cookies)
//       .set("Authorization", user.bearer_token)
//       .send(payload);
//     expect(status).toBe(422);
//     expect(body).toEqual({
//       data: expect.any(Array),
//       message: "ZodError!!!",
//       status: 422,
//       success: false,
//     });
//   });

//   it("Should return 401 (no auth header)", async () => {
//     const payload = {
//       name: "patch user test",
//       email: "patchtestemail@gmail.com",
//       phone_number: "6281212121212",
//     };

//     const { status, body } = await supertest(app)
//       .patch(`/api/users/${user._id}`)
//       .set("Cookie", user.cookies)
//       .send(payload);
//     expect(status).toBe(401);
//     expect(body).toEqual({
//       data: "Authorization header is needed",
//       message: "Unauthorized!!!",
//       status: 401,
//       success: false,
//     });
//   });

//   it("Should return 401 (no cookies)", async () => {
//     const payload = {
//       name: "patch user test",
//       email: "patchtestemail@gmail.com",
//       phone_number: "6281212121212",
//     };

//     const { status, body } = await supertest(app)
//       .patch(`/api/users/${user._id}`)
//       .set("Authorization", user.bearer_token)
//       .send(payload);
//     expect(status).toBe(401);
//     expect(body).toEqual({
//       data: "Request cookies not defined",
//       message: "Unauthorized!!!",
//       status: 401,
//       success: false,
//     });
//   });

//   it("Should return 401 (different id)", async () => {
//     const payload = {
//       name: "patch user test",
//       email: "patchtestemail@gmail.com",
//       phone_number: "6281212121212",
//     };

//     const { status, body } = await supertest(app)
//       .patch(`/api/users/${second_user._id}`)
//       .set("Cookie", user.cookies)
//       .set("Authorization", user.bearer_token)
//       .send(payload);
//     expect(status).toBe(401);
//     expect(body).toEqual({
//       data: "id doesn't match",
//       message: "Unauthorized!!!",
//       status: 401,
//       success: false,
//     });
//   });

//   it("Should return 404 (user not found)", async () => {
//     const payload = {
//       name: "patch user test",
//       email: "patchtestemail@gmail.com",
//       phone_number: "6281212121212",
//     };

//     const { body, status } = await supertest(app)
//       .patch(`/api/users/${lost_user._id}`)
//       .set("Cookie", lost_user.cookies)
//       .set("Authorization", lost_user.bearer_token)
//       .send(payload);
//     expect(status).toBe(404);
//     expect(body).toEqual({
//       data: "user not found",
//       message: "Not Found!!!",
//       status: 404,
//       success: false,
//     });
//   });
// });

// // FIXME and //TODO DELETE USER
// describe("DELETE: `/api/users/:id`", () => {
//   it("Should return 422 (wrong id type)", async () => {
//     const { status } = await supertest(app)
//       .delete("/api/users/yDBdAAvkTjw3PA55nFYFy7nV")
//       .set("Cookie", user.cookies)
//       .set("Authorization", user.bearer_token);
//     expect(status).toBe(422);
//   });

//   it("Should return 401 (no auth header)", async () => {
//     const { status } = await supertest(app)
//       .delete(`/api/users/${user._id}`)
//       .set("Cookie", user.cookies);
//     expect(status).toBe(401);
//   });

//   it("Should return 401 (no cookies)", async () => {
//     const { status } = await supertest(app)
//       .delete(`/api/users/${user._id}`)
//       .set("Authorization", user.bearer_token);
//     expect(status).toBe(401);
//   });

//   it("Should return 401 (different id)", async () => {
//     const { status } = await supertest(app)
//       .delete(`/api/users/${second_user._id}`)
//       .set("Cookie", user.cookies)
//       .set("Authorization", user.bearer_token);
//     expect(status).toBe(401);
//   });

//   it("Should return 204 (successfully)", async () => {
//     const { status } = await supertest(app)
//       .delete(`/api/users/${user._id}`)
//       .set("Cookie", user.cookies)
//       .set("Authorization", user.bearer_token);
//     expect(status).toBe(204);
//   });

//   it("Should return 404 (user not found)", async () => {
//     const { body, status } = await supertest(app)
//       .delete(`/api/users/${lost_user._id}`)
//       .set("Cookie", lost_user.cookies)
//       .set("Authorization", lost_user.bearer_token);
//     expect(status).toBe(404);
//     expect(body).toEqual({
//       data: "user not found",
//       message: "Not Found!!!",
//       status: 404,
//       success: false,
//     });
//   });
// });
