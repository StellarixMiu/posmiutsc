import { z } from "zod";
import { ObjectId } from "mongodb";

const ParamsWithId = z.object({
  id: z.string().refine((value) => {
    try {
      return new ObjectId(value);
    } catch (error) {
      return false;
    }
  }),
});

type ParamsWithId = z.infer<typeof ParamsWithId>;

export default ParamsWithId;
