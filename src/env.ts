import * as v from "valibot";
import { PrismaClient } from "./generated/prisma";
const envSchema = v.object({
    NODE_ENV: v.optional(v.string()),
    DATABASE_URL: v.string(),
    HOME_GUILD: v.pipe(v.string(), v.description("Home Guild ID")),
    DISCORD_TOKEN: v.pipe(v.string(), v.description("Discord Bot Token")),
});
export const env = v.parse(envSchema, Bun.env);

export const prisma = new PrismaClient();
