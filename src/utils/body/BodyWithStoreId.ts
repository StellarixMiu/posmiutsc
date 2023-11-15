import { z } from "zod";
import { ObjectId } from "mongodb";

const BodyWithStoreId = z.object({
  store_id: z.string().refine(
    (value) => {
      try {
        return new ObjectId(value);
      } catch (error) {
        return false;
      }
    },
    { message: "`store_id` should be an valid ObjectId" }
  ),
});

type BodyWithStoreId = z.infer<typeof BodyWithStoreId>;

export default BodyWithStoreId;
