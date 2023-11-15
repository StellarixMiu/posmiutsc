import { z } from "zod";
import { ObjectId, WithId } from "mongodb";
import { database } from "../../utils/databaseConnection";

const WebsitesSchema = z.object({
  slug: z.string({
    required_error: "`name` is required",
    invalid_type_error: "`name` must be a string",
  }),
  store: z.instanceof(ObjectId).or(z.string()),
  isActive: z.boolean().default(false),
});

type WebsitesSchema = z.infer<typeof WebsitesSchema>;
type WebsitesSchemaWithId = WithId<WebsitesSchema>;

const Websites = database.collection<WebsitesSchema>("Websites");

Websites.createIndex({ slug: 1 }, { unique: true });

export { WebsitesSchema, WebsitesSchemaWithId, Websites };
