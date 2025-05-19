import type { CmdModule, SlashCommand } from "$types";
import { Client, Events, GatewayIntentBits } from "discord.js";
import { Hono } from "hono";
import { join } from "node:path/posix";
import { chatInputCommandHandler } from "./lib/chatInputCommandHandler";
console.log("Hello via Bun!");

export const slashCmds = new Map<string, SlashCommand>();
//#region Importing commands

const tsGlob = new Bun.Glob("**/*.ts");
const CMD_DIR = join(import.meta.dir, "cmd");
for await (const file of tsGlob.scan(CMD_DIR)) {
    console.log(file);
    const mod = await import(`./cmd/${file}`).then(
        (mod: CmdModule) => mod.default
    );
    if (mod === undefined) {
        console.warn(
            `[ ⚠️  ] src/cmd/${file} was dosen't exported SlashCommand`
        );
        continue;
    }
    slashCmds.set(mod.json.name, mod);
}
//#endregion
const hono = new Hono().get("/", c => c.text("Hello Hono!"));
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
    ],
});
//MARK: Initialize
client.once(Events.ClientReady, async client => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log("Slash commands loaded:");
    // 全てのコマンドの名前を列挙
    for (const cmd of slashCmds.values()) {
        console.log(`- /${cmd.json.name}`);
    }
    // コマンドを登録
    await client.application.commands.set(
        slashCmds
            .values()
            .map(cmd => cmd.json)
            .toArray()
    );
    console.log("Slash commands registered");
});
//MARK: Event Hooks
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand())
        chatInputCommandHandler(interaction, slashCmds);
});

await client.login(Bun.env.DISCORD_TOKEN);
Bun.serve({
    fetch: hono.fetch,
    port: Bun.env.PORT,
});
