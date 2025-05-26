import type { SlashCommand } from "$types";
import { SlashCommandBuilder } from "discord.js";
export default {
    data: new SlashCommandBuilder()
        .setName("alwaysthrow")
        .setDescription("This command always fails")
        .toJSON(),
    async execute() {
        throw new Error("The operation failed successfully");
    },
} satisfies SlashCommand;
