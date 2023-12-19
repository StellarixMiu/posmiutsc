import supertest from "supertest";
import { ObjectId } from "mongodb";
import { deleteR2Image } from "../../utils/image/imageController";
import { Image, ImageSchemaWithId } from "../../utils/image/imageModel";
import app from "../../app";
import createTest from "../../test/createTest";

let image_id: string;

let user: any;
let store: any;

let second_user: any;
let second_store: any;

let lost_user: any;
let lost_store: any;

const invalid_params = "5CfUyC0li8LAoIyb6UoQjY28";
const invalid_bearer = "Bearer 65818b1f0b989a2068d4e207";

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

describe("POST: `/api/users/:id/image`", () => {
  it("Should return 200 (successfully)", async () => {
    const { status, body } = await supertest(app)
      .post(`/api/users/${user._id.toString()}/image`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg");
    image_id = body.data.image;

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        account_type: "FREE",
        email: "nugrahasuryono11@gmail.com",
        image: expect.any(String),
        isVerified: false,
        name: "nugraha suryono",
        phone_number: "6284795324684",
        work_at: expect.any(Array<ObjectId>),
      },
      message: "Add store logo successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const { status, body } = await supertest(app)
        .post(`/api/users/${invalid_params}/image`)
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
        .post(`/api/users/${user._id.toString()}/image`)
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
      .post(`/api/users/${user._id.toString()}/image`)
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
      .post(`/api/users/${user._id.toString()}/image`)
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
      .post(`/api/users/${user._id.toString()}/image`)
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
      .post(`/api/users/${user._id.toString()}/image`)
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

  it("Should return 400 (User already has an image)", async () => {
    const { status, body } = await supertest(app)
      .post(`/api/users/${user._id.toString()}/image`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg");

    expect(status).toBe(400);
    expect(body).toEqual({
      data: "User already has an image",
      message: "Bad Request!!!",
      status: 400,
      success: false,
    });
  });

  it.skip("Should return 500 ('Failed to upload image to Cloudflare R2')", () => {});

  describe("'SOMETHING' not found", () => {
    it("Should return 404 ('User' not found)", async () => {
      const { status, body } = await supertest(app)
        .post(`/api/users/${lost_user._id.toString()}/image`)
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
  });
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
        .get(`/api/users/${invalid_params}/token`)
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
        image: expect.any(String),
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
        .get(`/api/users/${invalid_params}`)
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
        .get(`/api/users/${lost_user._id.toString()}`)
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
  });
});

describe("PATCH: `/api/users/:id`", () => {
  it("Should return 200 (successfully)", async () => {
    const payload = {
      name: "nugra suryono",
      email: "nugrasuryon01@gmail.com",
      phone_number: "6284795324127",
    };

    const { status, body } = await supertest(app)
      .patch(`/api/users/${user._id}`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .send(payload);

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        account_type: "FREE",
        email: "nugrahasuryono11@gmail.com",
        image: expect.any(String),
        isVerified: false,
        name: "nugraha suryono",
        phone_number: "6284795324684",
        work_at: expect.any(Array<ObjectId>),
      },
      message: "Patch user by id successfully!!",
      status: 200,
      success: true,
    });
  });

  describe("wrong data type", () => {
    it("Should return 422 (wrong params type)", async () => {
      const payload = {
        name: "nugra suryono",
        email: "nugrasuryon01@gmail.com",
        phone_number: "6284795324127",
      };

      const { status, body } = await supertest(app)
        .patch(`/api/users/${invalid_params}`)
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
        name: "ns",
        email: "nugrasuryon01@yahoo.com",
        phone_number: 6284795324127,
      };

      const { status, body } = await supertest(app)
        .patch(`/api/users/${user._id}`)
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
        name: "ns",
        email: "nugrasuryon01@gmail.com",
        phone_number: "6284795324127",
      };

      const { status, body } = await supertest(app)
        .patch(`/api/users/${user._id}`)
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
        name: "nugra suryono",
        email: "nugrasuryon01@yahoo.com",
        phone_number: "6284795324127",
      };

      const { status, body } = await supertest(app)
        .patch(`/api/users/${user._id}`)
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
        name: "nugra suryono",
        email: "nugrasuryon01@gmail.com",
        phone_number: 6284795324127,
      };

      const { status, body } = await supertest(app)
        .patch(`/api/users/${user._id}`)
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
      name: "nugra suryono",
      email: "nugrasuryon01@gmail.com",
      phone_number: "6284795324127",
    };

    const { status, body } = await supertest(app)
      .patch(`/api/users/${second_user._id}`)
      .set("Cookie", user.cookies)
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
      name: "nugra suryono",
      email: "nugrasuryon01@gmail.com",
      phone_number: "6284795324127",
    };

    const { status, body } = await supertest(app)
      .patch(`/api/users/${user._id}`)
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
      name: "nugra suryono",
      email: "nugrasuryon01@gmail.com",
      phone_number: "6284795324127",
    };
    const { status, body } = await supertest(app)
      .patch(`/api/users/${user._id}`)
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

  it("Should return 400 (duplicate data)", async () => {
    const payload = {
      name: "nugra suryono",
      email: second_user.email,
      phone_number: second_user.phone_number,
    };

    const { status, body } = await supertest(app)
      .patch(`/api/users/${user._id}`)
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
    it("Should return 404 (user not found)", async () => {
      const payload = {
        name: "nugra suryono",
        email: "nugrasuryon01@gmail.com",
        phone_number: "6284795324127",
      };

      const { body, status } = await supertest(app)
        .patch(`/api/users/${lost_user._id}`)
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

describe("PATCH: `/api/users/:id/image`", () => {
  it("Should return 200 (successfully)", async () => {
    const { status, body } = await supertest(app)
      .patch(`/api/users/${user._id.toString()}/image`)
      .set("Cookie", user.cookies)
      .set("Authorization", user.bearer_token)
      .set("Content-Type", "multipart/form-data")
      .attach("image", "src/test/images/0.jpg");

    expect(status).toBe(200);
    expect(body).toEqual({
      data: {
        _id: expect.any(String),
        account_type: "FREE",
        email: "nugrasuryon01@gmail.com",
        image: expect.any(String),
        isVerified: false,
        name: "nugra suryono",
        phone_number: "6284795324127",
        work_at: expect.any(Array<ObjectId>),
      },
      message: "Patch user image successfully!!",
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
      const { status, body } = await supertest(app)
        .patch(`/api/users/${invalid_params}/image`)
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
        .patch(`/api/users/${user._id.toString()}/image`)
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
      .patch(`/api/users/${user._id.toString()}/image`)
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
      .patch(`/api/users/${user._id.toString()}/image`)
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
      .patch(`/api/users/${user._id.toString()}/image`)
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
      .patch(`/api/users/${user._id.toString()}/image`)
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

  it.skip("Should return 500 ('Failed to upload image to Cloudflare R2')", () => {});

  describe("'SOMETHING' not found", () => {
    it("Should return 404 ('User' not found)", async () => {
      const { status, body } = await supertest(app)
        .patch(`/api/users/${lost_user._id.toString()}/image`)
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

    it("Should return 404 ('User image' not found)", async () => {
      const { status, body } = await supertest(app)
        .patch(`/api/users/${second_user._id.toString()}/image`)
        .set("Cookie", second_user.cookies)
        .set("Authorization", second_user.bearer_token)
        .set("Content-Type", "multipart/form-data")
        .attach("image", "src/test/images/0.jpg");

      expect(status).toBe(404);
      expect(body).toEqual({
        data: "User image not found",
        message: "Not Found!!!",
        status: 404,
        success: false,
      });
    });
  });
});

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
