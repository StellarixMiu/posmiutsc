import { Router } from "express";
import authRoutes from "./auth/authRoutes";
import categoriesRoutes from "./category/categoryRoutes";
import couponsRoutes from "./coupon/couponRoutes";
import customersRoutes from "./customer/customerRoutes";
import productRoutes from "./product/productRoutes";
import storeRoutes from "./store/storeRoutes";
import transactionsRoutes from "./transaction/transactionRoutes";
import userRoutes from "./user/userRoutes";
import websitesRoutes from "./website/websiteRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/categories", categoriesRoutes);
router.use("/coupons", couponsRoutes);
router.use("/customers", customersRoutes);
router.use("/products", productRoutes);
router.use("/stores", storeRoutes);
router.use("/transactions", transactionsRoutes);
router.use("/users", userRoutes);

// TODO website routes
// router.use("/websites", websitesRoutes);

export default router;
