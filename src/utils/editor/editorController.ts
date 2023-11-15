import { ObjectId } from "mongodb";
import { EditorSchema } from "./editorModel";

const createEditor = async (id: string) => {
  return await EditorSchema.parseAsync({
    user_id: new ObjectId(id),
    date: new Date(),
  });
};

export default createEditor;
