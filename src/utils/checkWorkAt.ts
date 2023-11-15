import { ObjectId } from "mongodb";
import { RequestError } from "../middleware/errorMiddleware";
import { UserSchemaWithId } from "../api/user/userModel";

const checkUserWorkAtStore = (
  user: UserSchemaWithId,
  store_id: ObjectId
): void => {
  if (
    !user.work_at.map((value) => value.toString()).includes(store_id.toString())
  )
    throw new RequestError(
      403,
      "Forbidden!!!",
      "You do not have access rights to this store"
    );

  return;
};

export default checkUserWorkAtStore;
