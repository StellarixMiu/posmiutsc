import { RequestError } from "../middleware/errorMiddleware";

const checkForIdMismatch = (
  auth_id: string | undefined,
  cookies_id: string | undefined
): void => {
  if (cookies_id !== auth_id)
    throw new RequestError(
      401,
      "Unauthorized!!!",
      "Mismatch between `auth_id` and `cookies_id`"
    );
};

export default checkForIdMismatch;
