import type { SlashCommandDefinition } from "$types";
import { SlashCommandBuilder } from "discord.js";
export default {
	data: new SlashCommandBuilder()
		.setName("greet")
		.setDescription("Greet the user"),
	async handle(interaction) {
		await interaction.reply("Hello!");
	},
} satisfies SlashCommandDefinition;
