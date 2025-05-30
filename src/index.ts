import { env } from "$env";
import type { CmdModule, SlashCommandInternal } from "$types";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { join } from "node:path/posix";
import { chatInputCommandHandler } from "./lib/chatInputCommandHandler";
console.log("Hello via Bun!");
const IS_DEV = env.NODE_ENV === "development";
console.log(`Running in ${IS_DEV ? "development" : "production"} mode`);
export const slashCmds = new Map<string, SlashCommandInternal>();
//#region Importing commands

const tsGlob = new Bun.Glob("**/*.ts");
const CMD_DIR = join(import.meta.dir, "cmd");
for await (const file of tsGlob.scan(CMD_DIR)) {
    console.log(file);
    const mod = await import(`./cmd/${file}`).then((mod: CmdModule) => mod.default);
    if (mod === undefined) {
        if (IS_DEV) {
            console.warn(`[ ⚠️  ] src/cmd/${file} was dosen't exported SlashCommand. will be ignored`);
        } else {
            throw new Error(`src/cmd/${file} was dosen't exported SlashCommand`);
        }
        continue;
    }
    const json = "toJSON" in mod.data ? mod.data.toJSON() : mod.data;
    slashCmds.set(json.name, {
        data: json,
        execute: mod.execute,
    });
}
//#endregion
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent],
});
//MARK: Initialize
client.once(Events.ClientReady, async client => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log("Slash commands loaded:");
    // 全てのコマンドの名前を列挙
    for (const cmd of slashCmds.values()) {
        console.log(`- /${cmd.data.name}`);
    }
    // コマンドを登録
    await client.application.commands.set(
        slashCmds
            .values()
            .map(cmd => cmd.data)
            .toArray()
    );
    console.log("Slash commands registered");
});
//MARK: Event Hooks
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) chatInputCommandHandler(interaction, slashCmds);
});

await client.login(env.DISCORD_TOKEN);
