import { prisma } from "$env";
import type { SlashCommandDefinition } from "$types";
import { ChannelType, SlashCommandBuilder } from "discord.js";
export default {
	data: new SlashCommandBuilder()
		.setName("register_webhook_mapper")
		.setDescription("Registers a webhook mapper for GitHub events")
		.addStringOption(o =>
			o
				.setName("webhook_id")
				.setDescription("The ID of the webhook to use")
				.setRequired(true),
		)
		.addChannelOption(o =>
			o
				.setName("channel")
				.setDescription("The channel to register the webhook mapper for")
				.addChannelTypes(ChannelType.GuildForum)
				.setRequired(true),
		),
	async handle(interaction) {
		const webhookId = interaction.options.getString("webhook_id", true);
		const channel = interaction.options.getChannel("channel", true, [
			ChannelType.GuildForum,
		]);

		await prisma.discordForum.upsert({
			where: {
				id: channel.id,
			},
			create: {
				id: channel.id,
				webhookId: webhookId,
			},
			update: {
				webhookId: webhookId,
			},
		});
		await interaction.reply(
			`Registered webhook mapper for channel <#${channel.id}> with webhook ID \`${webhookId}\``,
		);
	},
} satisfies SlashCommandDefinition;
