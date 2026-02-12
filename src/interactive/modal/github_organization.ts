import type { ModalDefinition } from "$types";
import {
	ActionRowBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
const id = "github_organization_modal";
export default {
	id,
	createModal() {
		return new ModalBuilder()
			.setTitle("join GitHub Organization")
			.setCustomId(id)
			.addComponents(
				new ActionRowBuilder<TextInputBuilder>().addComponents(
					new TextInputBuilder()
						.setLabel("あなたのGitHubのユーザー名を教えてください")
						.setStyle(TextInputStyle.Short)
						.setPlaceholder("ex. ")
						.setCustomId("username_input"),
				),
			);
	},
	handle(interaction) {
		const code = interaction.fields.getTextInputValue("username_input");
		console.log(code);
	},
} satisfies ModalDefinition;
