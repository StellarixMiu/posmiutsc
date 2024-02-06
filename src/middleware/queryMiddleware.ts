import { Request, Response, NextFunction } from "express";
import type { AnyZodObject } from "zod";

function queryParse(object: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.query = await object.parseAsync(req.query);
      next();
    } catch (error: any) {
      next(error);
    }
  };
}

export default queryParse;
