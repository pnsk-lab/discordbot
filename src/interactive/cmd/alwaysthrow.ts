import type { SlashCommandDefinition } from "$types";
import { SlashCommandBuilder } from "discord.js";
export default {
	data: new SlashCommandBuilder()
		.setName("alwaysthrow")
		.setDescription("This command always fails"),
	async handle() {
		throw new Error("The operation failed successfully");
	},
} satisfies SlashCommandDefinition;
