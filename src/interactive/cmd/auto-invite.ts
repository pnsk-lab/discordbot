import { prisma } from "$env";
import type { SlashCommandDefinition } from "$types";
import {
	ChannelType,
	type ChatInputCommandInteraction,
	type ForumChannel,
	InteractionContextType,
	MessageFlags,
	PermissionFlagsBits,
	type Role,
	SlashCommandBuilder,
} from "discord.js";
import { ensureInGuild } from "../../util/ensure";

const Enum = {
	AutoInvite: "auto-invite",
	Setup: "setup",
	Forum: "forum",
	Role: "role",
	IgnoredTag: "ignored-tag",
	Inverted: "inverted",
	Register: "register",
} as const;

export default {
	data: new SlashCommandBuilder()
		.setName(Enum.AutoInvite)
		.setDescription("Automatically invite users to the thread")
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
		.setContexts(InteractionContextType.Guild)
		.addSubcommand(s =>
			s
				.setName(Enum.Setup)
				.setDescription("Set up auto-invite for a forum channel")
				.addRoleOption(o =>
					o
						.setName(Enum.Role)
						.setDescription("Role to invite users to")
						.setRequired(true),
				),
		)
		.addSubcommand(s =>
			s
				.setName(Enum.Register)
				.setDescription("Register a forum channel for auto-invite")
				.addChannelOption(o =>
					o
						.setName(Enum.Forum)
						.setDescription("Forum channel to set up auto-invite")
						.addChannelTypes(ChannelType.GuildForum)
						.setRequired(true),
				)
				.addStringOption(o =>
					o
						.setName(Enum.IgnoredTag)
						.setDescription("TagId to ignore for auto-invite")
						.setRequired(false),
				)
				.addBooleanOption(o =>
					o
						.setName(Enum.Inverted)
						.setDescription("Inverted mode: 指定のタグがない限り、招待しません")
						.setRequired(false),
				),
		),
	async handle(interaction) {
		const subCommand = interaction.options.getSubcommand(true);
		if (!ensureInGuild(interaction)) return;
		if (subCommand === Enum.Setup) {
			const role = interaction.options.getRole(Enum.Role, true);
			await setupAutoInvite(interaction, role);
		}

		if (subCommand === Enum.Register) {
			const forumChannel = interaction.options.getChannel(Enum.Forum, true, [
				ChannelType.GuildForum,
			]);
			const ignoredTag = interaction.options.getString(Enum.IgnoredTag);
			const inverted = interaction.options.getBoolean(Enum.Inverted) ?? false;
			await registerAutoInvite(interaction, forumChannel, ignoredTag, inverted);
		}
	},
} satisfies SlashCommandDefinition;

async function setupAutoInvite(
	interaction: ChatInputCommandInteraction<"cached">,
	role: Role,
) {
	if (role.id === role.guild.roles.everyone.id) {
		await interaction.reply({
			content:
				"You cannot set up auto-invite for the @everyone role. reason: Mentioning Everyone is not available for invitations.",
			flags: MessageFlags.Ephemeral,
		});
		return;
	}
	// Create or update the auto-invite setup
	await prisma.guild
		.upsert({
			where: { id: role.guild.id },
			update: { bulkInviteRoleId: role.id },
			create: {
				id: role.guild.id,
				bulkInviteRoleId: role.id,
			},
		})
		.then(() =>
			interaction.reply(`Auto-invite setup complete for role ${role.name}.`),
		);
}
async function registerAutoInvite(
	interaction: ChatInputCommandInteraction<"cached">,
	forumChannel: ForumChannel,
	ignoredTag: string | null,
	inverted: boolean,
) {
	if (ignoredTag === null && inverted) {
		await interaction.reply({
			content: "Inverted mode requires an ignored tag.",
			ephemeral: true,
		});
		return;
	}
	const hasGuild = await prisma.guild
		.findUnique({
			where: { id: forumChannel.guildId },
		})
		.then(g => g !== null);
	if (!hasGuild) {
		await interaction.reply({
			content:
				"Please set up the auto-invite role first using /auto-invite setup.",
			flags: MessageFlags.Ephemeral,
		});
		return;
	}
	await prisma.autoInviteForum.upsert({
		where: { id: forumChannel.id },
		update: { ignoredTag, inverted },
		create: {
			id: forumChannel.id,
			ignoredTag,
			inverted,
			guild: { connect: { id: forumChannel.guildId } },
		},
	});
	console.log(
		`[ Auto-Invite ] Registered forum channel: <${forumChannel.name}:${forumChannel.id}>`,
	);
	await interaction.reply({
		content: `Auto-invite registered for forum channel ${forumChannel.name}. Ignored tag Id: ${
			ignoredTag ?? "None"
		},${inverted ? "Inverted" : ""}}`,
		flags: MessageFlags.Ephemeral,
	});
}
