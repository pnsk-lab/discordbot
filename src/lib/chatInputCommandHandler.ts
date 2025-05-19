import type { SlashCommand } from "$types";
import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";

export async function chatInputCommandHandler(
    interaction: ChatInputCommandInteraction,
    slashCmds: Map<string, SlashCommand>
) {
    const cmd = slashCmds.get(interaction.commandName);
    if (!cmd) {
        console.warn(`[ ⚠️  ] Command ${interaction.commandName} not found`);
        return;
    }
    try {
        await cmd.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({
            content: "There was an error while executing this command!",
            flags: MessageFlags.Ephemeral,
        });
    }
}
