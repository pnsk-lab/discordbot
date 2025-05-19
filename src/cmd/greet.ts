import type { SlashCommand } from "$types";
import { SlashCommandBuilder } from "discord.js";
export default {
    json: new SlashCommandBuilder()
        .setName("greet")
        .setDescription("Greet the user")
        .toJSON(),
    async execute(interaction) {
        await interaction.reply("Hello!");
    },
} satisfies SlashCommand;
