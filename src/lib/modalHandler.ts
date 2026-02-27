import type { ModalDefinition } from "$types";
import { type ModalSubmitInteraction, MessageFlags } from "discord.js";

export async function modalHandler(
	interaction: ModalSubmitInteraction,
	modalDefs: Map<string, ModalDefinition>,
) {
	const [modalId, ctxId] = interaction.customId.split(":");
	console.log(`Modal submitted: ${modalId} with ctxId: ${ctxId}`);
	const modalDef = modalDefs.get(modalId);
	if (!modalDef) {
		console.warn(`[ ⚠️  ] Modal ${modalId} not found`);
		return;
	}
	try {
		await modalDef.handle(interaction, ctxId);
	} catch (error) {
		console.error(error);
		await interaction.reply({
			content: "There was an error while executing this modal!",
			flags: MessageFlags.Ephemeral,
		});
	}
}
