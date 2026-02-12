import { env, prisma } from "$env";
import { Webhooks, type EmitterWebhookEvent } from "@octokit/webhooks";
import type { RouterTypes } from "bun";
import {
	ChannelType,
	Routes,
	ThreadAutoArchiveDuration,
	type ForumChannel,
	type Webhook,
	type WebhookType,
} from "discord.js";
import assert from "node:assert";
import PQueue from "p-queue";
import { client } from ".";
import { err, ok } from "./types/helper";

type MyEmitterWebhookEvent = EmitterWebhookEvent & {
	webhookId: string;
	raw_payload: string;
	signature: string;
};
const webhookMapperQueues = new Map<string, PQueue>();
function getQueue(key: string) {
	let q = webhookMapperQueues.get(key);
	if (!q) {
		q = new PQueue({ concurrency: 1 });
		webhookMapperQueues.set(key, q);
	}
	return q;
}
function addToQueue(event: MyEmitterWebhookEvent) {
	const payload = event.payload;
	if ("repository" in payload && payload.repository != null) {
		const id = payload.repository.id;
		getQueue(`repo-${id}`).add(() => handleEvent(event));
	} else {
	}
}
async function handleEvent(event: MyEmitterWebhookEvent) {
	const payload = event.payload;
	assert(
		"repository" in payload && payload.repository,
		"Repository should not be null",
	);

	const repoId = String(payload.repository.id);

	const threadResult = await ensureThread({
		repoId,
		webhookId: event.webhookId,
		repoName: payload.repository.name,
		repoUrl: payload.repository.html_url,
	});

	if (!threadResult.success) {
		switch (threadResult.error) {
			case "FORUM_NOT_FOUND":
				console.warn(
					`[ Github D Mapper ] WRONG_STATE 設定されたフォーラムはすでに削除されていました ${payload.repository.name} (${repoId})`,
				);
				break;
			case "FORUM_NOT_CONFIGURED":
				console.warn(
					`[ Github D Mapper ] WRONG_STATE 未設定のWebhookが迷い込みました ${event.webhookId}`,
				);
				break;
		}
		return;
	}

	const thread = threadResult.value;
	const webhook = await getWebhook(thread.parent as ForumChannel);

	await client.rest.post(
		Routes.webhookPlatform(webhook.id, webhook.token, "github"),
		{
			query: new URLSearchParams({ thread_id: thread.id }),
			body: event.raw_payload,
			passThroughBody: true,
			headers: {
				"Content-Type": "application/json",
				"X-Github-Event": event.name,
				"X-GitHub-Hook-ID": event.webhookId,
				"X-Hub-Signature-256": event.signature,
				"X-GitHub-Delivery": event.id,
			},
		},
	);
}
async function ensureThread(opts: {
	repoId: string;
	webhookId: string;
	repoName: string;
	repoUrl: string;
}) {
	// ① DB 既存チェック
	const existing = await prisma.discordForumThread.findUnique({
		where: { githubRepoId: opts.repoId },
		include: { forum: true },
	});

	if (existing) {
		const res = await fetchDiscordThread(existing.forum.id, existing.id);
		if (res.success) return res;
		// unrecoverable error
		if (res.error === "FORUM_NOT_FOUND") {
			return res;
		}
		// THREAD_NOT_FOUND の場合は新規作成へフォールバック
		await prisma.discordForumThread.delete({
			where: { githubRepoId: opts.repoId },
		});
	}

	// ② forum 解決
	const forumRow = await prisma.discordForum.findFirst({
		where: { webhookId: opts.webhookId },
	});
	// そもそも初期化されてない
	if (!forumRow) {
		return err("FORUM_NOT_CONFIGURED");
	}

	const forum = await tryFetchForum(forumRow.id);
	// 初期化されたがフォーラムは消されていた
	if (!forum) {
		return err("FORUM_NOT_FOUND");
	}

	// ③ thread 作成
	const thread = await forum.threads.create({
		name: opts.repoName,
		message: { content: opts.repoUrl },
		autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
		reason: `Creating thread for GitHub repo ${opts.repoName} (${opts.repoId})`,
	});

	// ④ DB 保存（unique制約で race-safe）
	await prisma.discordForumThread.create({
		data: {
			githubRepoId: opts.repoId,
			forumId: forumRow.id,
			id: thread.id,
		},
	});

	return ok(thread);
}

async function tryFetchForum(id: string) {
	const ch = await client.channels.fetch(id);
	if (!ch || ch.type !== ChannelType.GuildForum) {
		return null;
	}
	return ch;
}

async function fetchDiscordThread(forumId: string, threadId: string) {
	const forum = await tryFetchForum(forumId);
	if (!forum) {
		return err("FORUM_NOT_FOUND");
	}
	const thread = await forum.threads.fetch(threadId).catch(() => null);
	if (!thread) {
		return err("THREAD_NOT_FOUND");
	}
	return ok(thread);
}
const webhookCache = new Map<string, Webhook<WebhookType.Incoming>>();
async function getWebhook(forum: ForumChannel) {
	if (webhookCache.has(forum.id)) {
		return webhookCache.get(forum.id)!;
	}
	const webhooks = await forum.fetchWebhooks();
	const ownWebhook = webhooks.find(
		(wh): wh is Webhook<WebhookType.Incoming> =>
			wh.owner?.id === client.user?.id && wh.isIncoming(),
	);

	if (ownWebhook) {
		webhookCache.set(forum.id, ownWebhook);
		return ownWebhook;
	}

	const newWebhook = await forum.createWebhook({
		name: "GitHub D!scord Mapper",
		reason: "Webhook for GitHub D!scord Mapper",
	});
	webhookCache.set(forum.id, newWebhook);
	return newWebhook;
}
const webhooks = new Webhooks({ secret: env.GITHUB_SECRET });
export const webhookMapperRoute = {
	"/github/webhook": {
		GET: () => new Response("405 Method Not Allowed", { status: 405 }),
		POST: async (req, _server) => {
			const signature = req.headers.get("X-Hub-Signature-256")!;
			const body = await req.text();
			const id = req.headers.get("X-GitHub-Delivery")!;
			// biome-ignore lint/suspicious/noExplicitAny: idk
			const name = req.headers.get("X-GitHub-Event") as any;
			const isOk = await webhooks.verify(body, signature).catch(() => false);
			if (!isOk) return new Response("401 Unauthorized", { status: 401 });
			if (isOk) {
				addToQueue({
					id,
					name: name,
					payload: JSON.parse(body),
					raw_payload: body,
					webhookId: req.headers.get("X-GitHub-Hook-ID")!,
					signature: signature,
				});
			}
			return new Response("OK");
		},
	},
} satisfies Record<string, RouterTypes.RouteValue<string>>;
