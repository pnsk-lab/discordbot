import { PrismaPg } from "@prisma/adapter-pg";
import * as v from "valibot";
import { PrismaClient } from "./generated/client";
const envSchema = v.object({
	NODE_ENV: v.optional(v.string()),
	DATABASE_URL: v.string(),
	HOME_GUILD: v.pipe(v.string(), v.description("Home Guild ID")),
	DISCORD_TOKEN: v.pipe(v.string(), v.description("Discord Bot Token")),
	RENDER: v.optional(v.literal("true")),
});
export const env = v.parse(envSchema, Bun.env);

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });
// 初期化時にも実行する, バグに気づきやすくするため
const setIntervalImmediate = (fn: () => void, ms: number) => {
	fn();
	return setInterval(fn, ms);
};

setIntervalImmediate(
	() => {
		// Supabaseが勝手にスリープするので1日に1度クエリを実行しておく
		prisma.autoInviteForum
			.count()
			.then(() => {
				console.log("Supabase keep-alive query succeeded");
			})
			.catch((err: unknown) => {
				console.error("Supabase keep-alive query failed:", err);
			});
	},
	24 * 60 * 60 * 1000,
); // 24 hours
