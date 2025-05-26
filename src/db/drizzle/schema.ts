import { integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";

export const github_channels = pgTable("github_channels", {
    id: integer("id").primaryKey(),
    channelId: text("channel_id").notNull(),
});
export interface ActiveConfig {
    github_webhook: {
        bot_to_discord: {
            channel_id: string;
            webhook: { id: string; token: string };
        } | null;
    };
}
export const config = pgTable("config", {
    id: text("id").primaryKey().default("singleton"),
    value: jsonb("value")
        .notNull()
        .$type<ActiveConfig>()
        .default({ github_webhook: { bot_to_discord: null } }),
});
