import type {
    Awaitable,
    ChatInputCommandInteraction,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";
type JSONConvertible<T> = T | { toJSON: () => T };

export type SlashCommand = {
    data: JSONConvertible<RESTPostAPIChatInputApplicationCommandsJSONBody>;
    execute: (interaction: ChatInputCommandInteraction) => Awaitable<void>;
};
export type SlashCommandInternal = {
    execute: (interaction: ChatInputCommandInteraction) => Awaitable<void>;
    data: RESTPostAPIChatInputApplicationCommandsJSONBody;
};

export type CmdModule = {
    default: SlashCommand;
};
export type SetStateAction<T> = T | ((prevState: T) => T);

export type Result<T, U> = { success: true; value: T } | { success: false; error: U };
