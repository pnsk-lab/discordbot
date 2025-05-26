import { env } from "$env";
import type { components } from "@octokit/openapi-webhooks-types";
import { Webhooks, type EmitterWebhookEvent } from "@octokit/webhooks";
import AsyncLock from "async-lock";
import type * as Djs from "discord.js";
import { REST, Routes } from "discord.js";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import assert from "node:assert";
import { db, getActiveConfig, github_channels } from "../db";
class EphemeralMap<K, V> extends Map<K, V> {
    get(key: K): V | undefined {
        const value = super.get(key);
        if (value !== undefined) {
            this.delete(key);
        }
        return value;
    }
}
type Repository = components["schemas"]["repository-webhooks"];

const webhooks = new Webhooks({
    secret: env.G2B_WH_SECRET,
});

const rest = new REST().setToken(env.DISCORD_TOKEN);
const lock = new AsyncLock();
const rawWebhookStore = new EphemeralMap<string, { body: string; event: string }>();
export const webhookApp = new Hono().post("/webhook", async c => {
    const signature = c.req.header("X-Hub-Signature-256") ?? "INVALID";
    const body = await c.req.text();
    const id = c.req.header("X-GitHub-Delivery")!;
    const name = c.req.header("X-GitHub-Event")!;
    rawWebhookStore.set(id, { body, event: name });
    webhooks
        .verifyAndReceive({
            id,
            name,
            payload: body,
            signature,
        })
        .catch(err => {
            console.error(err);
            c.status(401);
            return c.text("UnAuthorized");
        });
    c.status(202);
    return c.text("Ok");
});
export function registHandler(client: Djs.Client) {
    webhooks.onAny(async event => {
        const {
            github_webhook: { bot_to_discord },
        } = await getActiveConfig();

        if (bot_to_discord === null) {
            console.warn("GitHub to Discord webhook is not configured.");
            return;
        }
        const { channel_id, webhook } = bot_to_discord;

        const forum = (await getServer(client).then(g => g.channels.fetch(channel_id))) as Djs.ForumChannel;

        console.log(event.payload);
        await lock.acquire("messages", async () => {
            // リポジトリ関連
            event.name === "repository" && handleRepository(client, event, forum);
            // リポジトリ以外のイベントはフォールバックチャンネルに送信する
            const target = await (event.name === "repository"
                ? getThread(client, event.payload.repository, forum)
                : getFallbackThread(client, forum));

            // 生データ
            const raw = rawWebhookStore.get(event.id)!;

            // webhookを送信する
            await rest.post(Routes.webhookPlatform(webhook.id, webhook.token, "github"), {
                query: new URLSearchParams({
                    thread_id: target.id,
                }),
                body: raw.body,
                passThroughBody: true,
                headers: {
                    "Content-Type": "application/json",
                    "X-Github-Event": raw.event,
                },
            });
        });
    });
}
async function handleRepository(
    client: Djs.Client,
    event: EmitterWebhookEvent & { name: "repository" },
    forum: Djs.ForumChannel
) {
    const repository = event.payload.repository;
    const thread = await getThread(client, repository, forum);
    switch (event.payload.action) {
        case "deleted": {
            thread.setName(`${repository.name} (archived)`, "Repository Deleted");
            thread.setArchived(true, "Repository Deleted");
            break;
        }

        case "renamed": {
            thread.setName(repository.name, "Repository Edited");
            break;
        }
        case "archived": {
            thread.setName(`${repository.name} (archived)`, "Repository Archived");
            thread.setArchived(true, "Repository Archived");
            break;
        }
        case "unarchived": {
            thread.setName(repository.name, "Repository Unarchived");
            thread.setArchived(false, "Repository Unarchived");
            break;
        }
        case "created":
        case "privatized":
        case "publicized":
        case "edited":
        case "transferred":
        default:
            break;
    }
}

function getServer(client: Djs.Client): Promise<Djs.Guild> {
    return client.guilds.fetch(env.HOME_GUILD);
}
async function getThread(
    client: Djs.Client,
    repository: Repository,
    forum: Djs.ForumChannel
): Promise<Djs.ForumThreadChannel> {
    // GithubのリポジトリIDからスレッドIDを取得
    const thread_id = await queryChannelIdFromGithubId(repository.id);

    if (!thread_id) {
        const thread = await forum.threads.create({
            name: repository.name,
            message: { content: repository.html_url },
        });
        await db.insert(github_channels).values({ id: repository.id, channelId: thread.id });
        return thread;
    }
    // スレッドを取得
    return (await forum.threads.fetch(thread_id))!;
}
// GitHubの通知のうちリポジトリ由来でないもののフォールバックチャンネルを取得する
async function getFallbackThread(client: Djs.Client, forum: Djs.ForumChannel) {
    const thread_id = await queryChannelIdFromGithubId(-1);
    if (!thread_id) throw new Error("Fallback thread not found");
    const thread = await forum.threads.fetch(thread_id)!;
    assert(thread, "Inconsistency: INVALID_ID in database");
    return thread;
}

async function queryChannelIdFromGithubId(id: number): Promise<string | null> {
    const { channelId } = await db
        .select()
        .from(github_channels)
        .where(eq(github_channels.id, id))
        .then(row => row.at(0) ?? { channelId: null });
    return channelId;
}
