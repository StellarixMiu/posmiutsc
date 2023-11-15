import { Router } from "express";
import requestValidation from "../../middleware/validationMiddleware";
import ParamsWithId from "../../utils/params/paramsModel";
import { verifyToken } from "../../middleware/tokenMiddleware";

const router = Router();

router.post("/create");

export default router;
