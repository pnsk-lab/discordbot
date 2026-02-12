import type {
	Awaitable,
	ChatInputCommandInteraction,
	ModalBuilder,
	ModalSubmitInteraction,
	RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
export type JSONLike<T> = T | { toJSON: () => T };

export type SlashCommandDefinition = {
	data: JSONLike<RESTPostAPIChatInputApplicationCommandsJSONBody>;
	handle: (interaction: ChatInputCommandInteraction) => Awaitable<void>;
};
export type SlashCommandDefinitionInternal = {
	handle: (interaction: ChatInputCommandInteraction) => Awaitable<void>;
	data: RESTPostAPIChatInputApplicationCommandsJSONBody;
};

export type ModalDefinition = {
	id: string;
	createModal(ctxId: string): ModalBuilder;
	handle: (
		interaction: ModalSubmitInteraction,
		ctxId: string,
	) => Awaitable<void>;
};
export type CmdModule = {
	default: SlashCommandDefinition;
};
export type SetStateAction<T> = T | ((prevState: T) => T);

export type Result<T, U> =
	| { success: true; value: T }
	| { success: false; error: U };
