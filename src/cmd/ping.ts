import type { SlashCommandDefinition } from "$types";
import { SlashCommandBuilder } from "discord.js";
export default {
	data: new SlashCommandBuilder()
		.setName("ping")
		.setDescription("Ping the bot"),
	async handle(interaction) {
		await interaction.reply(
			`Pong! ${Date.now() - interaction.createdTimestamp}ms`,
		);
	},
} satisfies SlashCommandDefinition;
