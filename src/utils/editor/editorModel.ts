import { z } from "zod";
import { ObjectId } from "mongodb";

const EditorSchema = z.object({
  user_id: z.instanceof(ObjectId).or(z.string()),
  date: z.date(),
});

type EditorSchema = z.infer<typeof EditorSchema>;

export { EditorSchema };
