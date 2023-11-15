import { z } from "zod";

const BodyWithLimit = z.object({
  limit: z.number().nonnegative().finite().gte(1).lte(10).default(5).optional(),
});

type BodyWithLimit = z.infer<typeof BodyWithLimit>;

export default BodyWithLimit;
