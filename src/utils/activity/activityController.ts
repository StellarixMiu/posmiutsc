import { ObjectId } from "mongodb";
import { ActivitiesSchema, ActivitiesTypeEnum } from "./activityModel";

const createActivity = async (
  type: ActivitiesTypeEnum,
  changes: ObjectId,
  descriptions?: string
) => {
  return await ActivitiesSchema.parseAsync({
    type: type,
    changes: changes,
    descriptions: descriptions || "",
  });
};

export default createActivity;
