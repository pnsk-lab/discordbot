import type { SlashCommand } from "$types";
import { SlashCommandBuilder } from "discord.js";
export default {
    data: new SlashCommandBuilder().setName("ping").setDescription("Ping the bot"),
    async execute(interaction) {
        await interaction.reply(`Pong! ${Date.now() - interaction.createdTimestamp}ms`);
    },
} satisfies SlashCommand;
