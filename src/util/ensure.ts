import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";

export function ensureInGuild(
	interaction: ChatInputCommandInteraction,
): interaction is ChatInputCommandInteraction<"cached"> {
	if (!interaction.inCachedGuild()) {
		interaction.reply({
			content: "This command can only be used in a server.",
			flags: MessageFlags.Ephemeral,
		});
		return false;
	}
	return true;
}
