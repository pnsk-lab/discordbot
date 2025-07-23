import { PrismaClient } from "@prisma/client";
import * as v from "valibot";
const envSchema = v.object({
    NODE_ENV: v.optional(v.string()),
    DATABASE_URL: v.string(),
    HOME_GUILD: v.pipe(v.string(), v.description("Home Guild ID")),
    DISCORD_TOKEN: v.pipe(v.string(), v.description("Discord Bot Token")),
    RENDER: v.optional(v.literal("true")),
});
export const env = v.parse(envSchema, Bun.env);

export const prisma = new PrismaClient();
// 初期化時にも実行する, バグに気づきやすくするため
const setIntervalImmediate = (fn: () => void, ms: number) => {
    fn();
    return setInterval(fn, ms);
};

setIntervalImmediate(() => {
    // Supabaseが勝手にスリープするので1日に1度クエリを実行しておく
    prisma.$queryRaw`SELECT 1`
        .then(() => {
            console.log("Supabase keep-alive query succeeded");
        })
        .catch(err => {
            console.error("Supabase keep-alive query failed:", err);
        });
}, 24 * 60 * 60 * 1000); // 24 hours
