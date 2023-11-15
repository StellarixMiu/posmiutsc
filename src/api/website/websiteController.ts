import { ObjectId } from "mongodb";
import { Request, Response, NextFunction } from "express";
import { RequestError } from "../../middleware/errorMiddleware";
import ResponseData from "../../utils/responseHandler";

export const createActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const response = new ResponseData(
      true,
      200,
      "create activity successfully!!",
      "metadata"
    );
    return res.status(200).json(response);
  } catch (error: any) {
    next(error);
  }
};
