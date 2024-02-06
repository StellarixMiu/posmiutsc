import { Request, Response, NextFunction } from "express";
import { AnyZodObject } from "zod";

interface RequestValidators {
  params?: AnyZodObject;
  body?: AnyZodObject;
  query?: AnyZodObject;
}

function requestValidation(validators: RequestValidators) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let result;
      if (validators.params) {
        result = await validators.params?.parseAsync(req.params);
      }
      if (validators.body) {
        result = await validators.body?.parseAsync(req.body);
      }
      if (validators.query) {
        result = await validators.query?.parseAsync(req.query);
      }
      next();
    } catch (error: any) {
      next(error);
    }
  };
}

export default requestValidation;
