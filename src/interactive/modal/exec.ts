import type { ModalDefinition } from "$types";
import {
	ActionRowBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import { handleExec } from "../cmd/exec";
const id = "exec_modal";
export default {
	id,
	createModal() {
		return new ModalBuilder()
			.setTitle("Execute Code")
			.setCustomId(id)
			.addComponents(
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					new TextInputBuilder()
						.setLabel("Code")
						.setStyle(TextInputStyle.Paragraph)
						.setCustomId("code_input"),
				),
			);
	},
	handle(interaction) {
		const code = interaction.fields.getTextInputValue("code_input");
		handleExec(interaction, code);
	},
} satisfies ModalDefinition;
