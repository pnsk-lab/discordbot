import * as v from "valibot";
const envSchema = v.object({
    NODE_ENV: v.string(),
    PORT: v.string(),
    DATABASE_URL: v.string(),
    HOME_GUILD: v.pipe(v.string(), v.description("Home Guild ID")),
    DISCORD_TOKEN: v.pipe(v.string(), v.description("Discord Bot Token")),
});
export const env = v.parse(envSchema, Bun.env);
