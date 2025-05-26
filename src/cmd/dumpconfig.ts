import type { SlashCommand } from "$types";
import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { getActiveConfig } from "../db";
export default {
    data: new SlashCommandBuilder().setName("dumpconfig").setDescription("Dump the current configuration"),
    async execute(interaction) {
        if (interaction.user.id == "980604083851390976") {
            await interaction.reply(JSON.stringify(await getActiveConfig(), null, 4));
        } else {
            await interaction.reply({
                content: "You are not allowed to use this command.",
                flags: MessageFlags.Ephemeral,
            });
        }
    },
} satisfies SlashCommand;
