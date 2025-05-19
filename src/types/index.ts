import type {
    Awaitable,
    ChatInputCommandInteraction,
    RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";

export type SlashCommand = {
    json: RESTPostAPIChatInputApplicationCommandsJSONBody;
    execute: (interaction: ChatInputCommandInteraction) => Awaitable<void>;
};

export type CmdModule = {
    default: SlashCommand;
};
