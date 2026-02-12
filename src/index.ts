/** biome-ignore-all lint/complexity/noBannedTypes: I'm professional of type */
import { env, prisma } from "$env";
import type {
	CmdModule,
	ModalDefinition,
	SlashCommandDefinitionInternal,
} from "$types";
import { Client, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import { bulkInvite } from "./lib/bulkinvite";
import { chatInputCommandHandler } from "./lib/chatInputCommandHandler";
import { scanModule } from "./lib/scanModule";
import { unwrapJsonLike } from "./types/helper";
import { webhookMapperRoute } from "./webhook_mapper";
console.log("Hello via Bun!");
export const IS_DEV = env.NODE_ENV === "development";
console.log(`Running in ${IS_DEV ? "development" : "production"} mode`);

export const slashCmdDefs = new Map<string, SlashCommandDefinitionInternal>();
for await (const mod of scanModule<CmdModule>("interactive/cmd")) {
	const slashCommandInfo = mod.default;
	const json = unwrapJsonLike(slashCommandInfo.data);
	slashCmdDefs.set(json.name, {
		data: json,
		handle: slashCommandInfo.handle,
	});
}

const modalDefs = new Map<string, ModalDefinition>();
for await (const mod of scanModule<{ default: ModalDefinition }>(
	"interactive/modal",
)) {
	const modalDef = mod.default;
	modalDefs.set(modalDef.id, modalDef);
}

export const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
	],
});
//MARK: Initialize
client.once(Events.ClientReady, async client => {
	console.log(`Logged in as ${client.user.tag}`);
	console.log("Slash commands loaded:");
	// 全てのコマンドの名前を列挙
	for (const cmd of slashCmdDefs.values()) {
		console.log(`- /${cmd.data.name}`);
	}
	// コマンドを登録
	await client.application.commands.set(
		slashCmdDefs
			.values()
			.map(cmd => cmd.data)
			.toArray(),
	);
	console.log("Slash commands registered");
});
//MARK: Event Hooks
client.on(Events.InteractionCreate, async interaction => {
	if (interaction.isChatInputCommand())
		chatInputCommandHandler(interaction, slashCmdDefs);
	if (interaction.isModalSubmit()) {
		const [modalId, ctxId] = interaction.customId.split(":");
		console.log(`Modal submitted: ${modalId} with ctxId: ${ctxId}`);
		const modalDef = modalDefs.get(modalId);
		if (!modalDef) {
			console.warn(`[ ⚠️  ] Modal ${modalId} not found`);
			return;
		}
		try {
			await modalDef.handle(interaction, ctxId);
		} catch (error) {
			console.error(error);
			await interaction.reply({
				content: "There was an error while executing this modal!",
				flags: MessageFlags.Ephemeral,
			});
		}
	}
});

client.on(Events.ThreadCreate, async thread => {
	if (!thread.parentId) return;
	const autoInvite = await prisma.autoInviteForum.findUnique({
		where: { id: thread.parentId },
		include: { guild: true },
	});
	if (!autoInvite) return;
	const ignored = thread.appliedTags.includes(autoInvite.ignoredTag!);
	// If it's inverted, send it only if it has the ignored tag. Otherwise,
	// ignore it if it has ignored. After all, if both values ​​are the same, that's it.
	if (ignored !== autoInvite.inverted) return;
	console.log(
		`Inviting users to thread ${thread.id} in guild ${thread.guild.id}`,
	);
	await bulkInvite(thread.guild, thread.id, autoInvite.guild.bulkInviteRoleId);
});

await client.login(env.DISCORD_TOKEN);

Bun.serve({
	hostname: "0.0.0.0",
	port: "10000",
	routes: {
		"/": () =>
			new Response("Hello from Bun! This is a Discord bot running with Bun."),
		...webhookMapperRoute,
	},
});
