import supertest from "supertest";
import { ObjectId } from "mongodb";
import { Image } from "../utils/image/imageModel";
import { Store } from "../api/store/storeModel";
import { Coupon } from "../api/coupon/couponModel";
import { Product } from "../api/product/productModel";
import { Category } from "../api/category/categoryModel";
import { Customer } from "../api/customer/customerModel";
import { Transaction } from "../api/transaction/transactionModel";
import { User } from "../api/user/userModel";
import app from "../app";

const users = [
  {
    name: "nugraha suryono",
    email: "nugrahasuryono11@gmail.com",
    phone_number: "6284795324684",
    password: "GciOiJ5UzI1N56",
  },
  {
    name: "asirwada ramadan",
    email: "asirwadaramadan23@gmail.com",
    phone_number: "6280301095501",
    password: "lxtrLzUQ4tBjFZ4",
  },
  {
    name: "vera suartini",
    email: "suartin1vera@gmail.com",
    phone_number: "6285493165972",
    password: "gy1WPbMcK1kV0QF",
  },
];

const stores = [
  {
    name: "Storely",
    address: "Jl Keatrian V A 12, Dki Jakarta",
    phone_number: "6285741248965",
    type: "grocery",
  },
  {
    name: "EZGrocery",
    address: "Jl Gombel Permai X/254, Jawa Tengah",
    phone_number: "628597830405",
    type: "grocery",
  },
  {
    name: "The Corner Egg",
    address: "Jl Sultan Iskandar Muda Bl F/25 RT 011/02, Dki Jakarta",
    phone_number: "628514021670",
    type: "restaurant",
  },
];

const categories = [
  { name: "Vegetables" },
  { name: "Fruits" },
  { name: "Household" },
];

const coupons = [
  {
    name: "no tricks",
    type: "PRICE",
    discount: 15000,
    code: "TmmJy",
    ends_date: new Date(2024, 1, 3),
  },
  {
    name: "spring deal",
    description: "Spring deal coupons",
    type: "PRICE",
    discount: 10000,
    code: "Cl5z6",
    starts_date: new Date(),
    ends_date: new Date(2030, 5, 24),
  },
  {
    name: "back to school",
    description: "Back to school coupon",
    type: "PRICE",
    discount: 150000,
    code: "KyeQl",
    starts_date: new Date(),
    ends_date: new Date(2030, 12, 20),
  },
];

const customers = [
  {
    name: "Keisha Purwanti",
    phone_number: "6284571263800",
    address: "Jl Jemursari Slt VIII 3, Jawa Timur",
  },
  {
    name: "Padma Nurdiyanti",
    phone_number: "628801246794",
  },
  {
    name: "Irfan Najmudin",
    phone_number: "6285401379506",
    address: "Jl Mangga Dua Raya JITC Mangga Dua Bl C/90, Jakarta",
  },
];

const products = [
  {
    name: "Toothbrush",
    price: 15000,
    description:
      "This Ultra Clean Toothbrush is designed to give you a superior brushing experience.",
    stock: 10,
  },
  {
    name: "Water Bottle",
    price: 10000,
    stock: 100,
  },
  {
    name: "Cheeseburger",
    price: 20000,
    stock: 6,
  },
];

const createTest = async () => {
  await deleteDatabaseData();
  const result_test: Array<Object> = [];

  for (let i = 0; i < 3; i++) {
    const user = users[i];
    const store = stores[i];
    const category = categories[i];
    const coupon = coupons[i];
    const customer = customers[i];
    const product = products[i];
    const login = {
      email: user.email,
      password: user.password,
    };
    let new_user = await testUser(user);
    if (!new_user._id) continue;

    await supertest(app)
      .post("/api/auth/signin")
      .send(login)
      .then(({ body, headers }) => {
        const cookies = headers["set-cookie"];
        const access_token = body.data.access_token;
        new_user = {
          ...new_user,
          access_token,
          bearer_token: `Bearer ${access_token}`,
          cookies,
        };
      });
    let new_store = await testStore(new_user, store);
    if (!new_store._id) continue;

    new_user = {
      ...new_user,
      store: new_store,
    };
    let new_category = await testCategory(new_user, category);
    if (!new_category._id) continue;

    new_user = {
      ...new_user,
      category: new_category,
    };
    let new_coupon = await testCoupon(new_user, coupon);
    if (!new_coupon._id) continue;

    new_user = {
      ...new_user,
      coupon: new_coupon,
    };
    let new_customer = await testCustomer(new_user, customer);
    if (!new_customer._id) continue;

    new_user = {
      ...new_user,
      customer: new_customer,
    };
    let new_product = await testProduct(new_user, product);
    if (!new_product._id) continue;

    new_user = {
      ...new_user,
      product: new_product,
    };

    let new_transaction = await testTransaction(new_user);

    if (!new_product._id) continue;
    new_user = {
      ...new_user,
      transaction: new_transaction,
    };
    if (i === 2) {
      await testLost(new_user);
    }
    result_test.push(new_user);
  }

  return result_test;
};

const deleteDatabaseData = async () => {
  await User.deleteMany();
  await Store.deleteMany();
  await Category.deleteMany();
  await Coupon.deleteMany();
  await Customer.deleteMany();
  await Image.deleteMany();
  await Product.deleteMany();
  await Transaction.deleteMany();
  return;
};

const testUser = async (payload: any) => {
  return await supertest(app)
    .post("/api/auth/signup")
    .send(payload)
    .then(({ body }) => {
      const { password, ...data } = body.data;
      return { ...data, password: payload.password };
    });
};

const testStore = async (user: any, payload: any) => {
  return await supertest(app)
    .post("/api/stores/")
    .set("Cookie", user.cookies)
    .set("Authorization", user.bearer_token)
    .send(payload)
    .then(({ body }) => {
      return body.data;
    });
};

const testCategory = async (user: any, payload: any) => {
  return await supertest(app)
    .post("/api/categories/")
    .set("Cookie", user.cookies)
    .set("Authorization", user.bearer_token)
    .send({
      ...payload,
      store_id: user.store._id.toString(),
      products: [],
    })
    .then(({ body }) => {
      return body.data;
    });
};

const testCoupon = async (user: any, payload: any) => {
  return await supertest(app)
    .post("/api/coupons/")
    .set("Cookie", user.cookies)
    .set("Authorization", user.bearer_token)
    .send({
      ...payload,
      store_id: user.store._id.toString(),
    })
    .then(({ body }) => {
      return body.data;
    });
};

const testCustomer = async (user: any, payload: any) => {
  return await supertest(app)
    .post("/api/customers/")
    .set("Cookie", user.cookies)
    .set("Authorization", user.bearer_token)
    .send({
      ...payload,
      store_id: user.store._id.toString(),
    })
    .then(({ body }) => {
      return body.data;
    });
};

const testProduct = async (user: any, payload: any) => {
  return await supertest(app)
    .post("/api/products/")
    .set("Cookie", user.cookies)
    .set("Authorization", user.bearer_token)
    .send({
      ...payload,
      store_id: user.store._id.toString(),
    })
    .then(({ body }) => {
      return body.data;
    });
};

const testTransaction = async (user: any) => {
  const payload = {
    products: [
      {
        id: user.product._id.toString(),
        quantity: Math.floor(Math.random() * 2) + 1,
      },
    ],
    customer: user.customer._id,
    store_id: user.store._id.toString(),
  };
  return await supertest(app)
    .post("/api/transactions/")
    .set("Cookie", user.cookies)
    .set("Authorization", user.bearer_token)
    .send(payload)
    .then(({ body }) => {
      return body.data;
    });
};

const testLost = async (user: any) => {
  await User.deleteOne({ _id: new ObjectId(user._id) });
  await Store.deleteOne({ _id: new ObjectId(user.store._id) });
  await Category.deleteOne({ _id: new ObjectId(user.category._id) });
  await Coupon.deleteOne({ _id: new ObjectId(user.coupon._id) });
  await Customer.deleteOne({ _id: new ObjectId(user.customer._id) });
  await Product.deleteOne({ _id: new ObjectId(user.product._id) });
  await Transaction.deleteOne({ _id: new ObjectId(user.transaction._id) });
  return;
};

export default createTest;
