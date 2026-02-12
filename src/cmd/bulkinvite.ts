import { prisma } from "$env";
import type { SlashCommandDefinition } from "$types";
import {
	ChannelType,
	InteractionContextType,
	MessageFlags,
	SlashCommandBuilder,
} from "discord.js";
import { bulkInvite } from "../lib/bulkinvite";
import { ensureInGuild } from "../util/ensure";
export default {
	data: new SlashCommandBuilder()
		.setName("bulkinvite")
		.setDescription("Bulk invite users to thread")
		.setContexts(InteractionContextType.Guild)
		.addBooleanOption(o =>
			o
				.setName("confirm")
				.setDescription(
					"Confirm to invite users even if the thread has an ignored tag",
				)
				.setRequired(false),
		),
	async handle(interaction) {
		if (!ensureInGuild(interaction)) return;
		const confirmed = interaction.options.getBoolean("confirm") ?? false;

		if (!interaction.channel?.isThread()) {
			await interaction.reply({
				content: "This command can only be used in a thread.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}
		// should be a forum channel;
		const thread = interaction.channel;
		const parentChannel = thread.parent;
		// そのチャンネルにignoredTagが設定されている場合は、本当に招待したいのか警告する
		// threadのparentがないなんてことあるの？
		// biome-ignore lint/suspicious/noConfusingLabels: better readability
		confirm: if (parentChannel?.type === ChannelType.GuildForum) {
			const autoInvInfo = await prisma.autoInviteForum.findUnique({
				where: { id: parentChannel.id },
			});
			if (!autoInvInfo || autoInvInfo.ignoredTag === null) break confirm;

			if (thread.appliedTags.includes(autoInvInfo.ignoredTag) && !confirmed) {
				await interaction.reply({
					content: `This thread has an ignored tag: <${
						parentChannel.availableTags.find(
							tag => tag.id === autoInvInfo.ignoredTag,
						)!.name
					}:${autoInvInfo.ignoredTag}>. Do you want to invite users anyway? Use \`/bulkinvite confirm\` to proceed.`,
					flags: MessageFlags.Ephemeral,
				});
				return;
			}
		}

		const guild = await prisma.guild.findUnique({
			where: { id: interaction.guildId },
		});
		if (!guild) {
			await interaction.reply({
				content: "Guild not initialized. Please run /auto-invite setup.",
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const result = await bulkInvite(
			interaction.guild,
			interaction.channelId,
			guild.bulkInviteRoleId,
		);
		if (result.success) {
			await interaction.editReply({ content: "Complete!" });
		} else {
			console.error(
				"Bulk invite error:",
				result.error,
				"at: ",
				interaction.guildId,
				interaction.channelId,
			);
			await interaction.editReply({
				content:
					result.error === "ChannelNotFoundError"
						? "Channel not found. ( may be permission error )"
						: result.error === "ChannelNotSendableError"
							? "Channel is not sendable. ( permission error )"
							: "An unknown error occurred.",
			});
		}
	},
} satisfies SlashCommandDefinition;
