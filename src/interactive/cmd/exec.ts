import { env } from "$env";
import type { SlashCommandDefinition } from "$types";
import {
	MessageFlags,
	SlashCommandBuilder,
	type ChatInputCommandInteraction,
	type ModalSubmitInteraction,
} from "discord.js";
import ExecModalDefinition from "../modal/exec";
export default {
	data: new SlashCommandBuilder()
		.setName("exec")
		.setDescription("exec for bot developers")
		.addStringOption(o => o.setName("code").setDescription("Code to execute"))
		.toJSON(),
	async handle(interaction) {
		const code = interaction.options.getString("code");
		if (env.BOT_OWNERS?.includes(interaction.user.id)) {
			if (code == null) {
				await interaction.showModal(ExecModalDefinition.createModal(), {
					withResponse: true,
				});
				return;
			}

			await handleExec(interaction, code);
		} else {
			await interaction.reply({
				content: "You are not authorized to use this command.",
				flags: MessageFlags.Ephemeral,
			});
		}
	},
} satisfies SlashCommandDefinition;

export async function handleExec(
	interaction: ChatInputCommandInteraction | ModalSubmitInteraction,
	code: string,
) {
	const AsyncFunction = (async () => {}).constructor as typeof Function;

	const fn = new AsyncFunction(
		"interaction",
		"channel",
		"guild",
		"client",
		`
"use strict";
${wrapUserCode(code)}
`,
	);
	try {
		const result = await fn(
			interaction,
			interaction.channel,
			interaction.guild,
			interaction.client,
		);

		const text = Bun.inspect(result, { depth: 2 }).slice(0, 1900);

		await interaction.reply({
			content: `\`\`\`ts\n${text}\n\`\`\``,
			flags: MessageFlags.Ephemeral,
		});
	} catch (error) {
		await interaction.reply({
			content: `\`\`\`ts\n${Bun.inspect(error).slice(0, 1900)}\n\`\`\``,
			flags: MessageFlags.Ephemeral,
		});
	}
}

function wrapUserCode(code: string) {
	const lines = code.trim().split("\n");

	if (
		lines.length === 1 &&
		!/^\s*(return|if|for|while|const|let|var|throw)/.test(lines[0])
	) {
		return `return (${lines[0]});`;
	}

	return code;
}
