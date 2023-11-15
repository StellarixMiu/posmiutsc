import { databaseDisconnect } from "../utils/databaseConnection";

global.afterAll(async () => {
  setTimeout(async () => {
    await databaseDisconnect();
  }, 1500);
});
