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
        // console.log(req.params);
        result = await validators.params?.parseAsync(req.params);
      }
      if (validators.body) {
        // console.log(req.body);
        result = await validators.body?.parseAsync(req.body);
      }
      if (validators.query) {
        // console.log(req.query);
        result = await validators.query?.parseAsync(req.query);
      }
      next();
    } catch (error: any) {
      next(error);
    }
  };
}

export default requestValidation;
