import type { SlashCommand } from "$types";
import {
    ChannelType,
    MessageFlags,
    SlashCommandBuilder,
    WebhookType,
    type ChatInputCommandInteraction,
} from "discord.js";
import { updateActiveConfig } from "../db";
const enum Symbols {
    Set = "set",
    Channel = "channel",
}
export default {
    data: new SlashCommandBuilder()
        .setName("githubmapper")
        .setDescription("GitHub Webhook Forum Mapper")
        .addSubcommand(subcommand =>
            subcommand
                .setName(Symbols.Set)
                .setDescription("GitHub Webhook Forum Channelを設定します")
                .addChannelOption(o =>
                    o
                        .setName(Symbols.Channel)
                        .setDescription("マッピングする対象のフォーラムチャンネル")
                        .addChannelTypes(ChannelType.GuildForum)
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        const subcommandId = interaction.options.getSubcommand(true);
        switch (subcommandId) {
            case Symbols.Set:
                await subcommandSet(interaction);
                break;
        }
    },
} satisfies SlashCommand;

async function subcommandSet(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel(Symbols.Channel, true, [ChannelType.GuildForum]);
    const hooks = await channel.fetchWebhooks();
    for (const [id, hook] of hooks) {
        if (hook.type === WebhookType.Incoming && hook.applicationId === interaction.client.application.id) {
            // 消す意味はないような気がする
            // 既存のWebhookがあれば削除
            await hook.delete("GitHub Webhook Forum Channel Set");
        }
    }
    const webhook = await channel.createWebhook({ name: "GitHub Webhook", reason: "GitHub Webhook Forum Channel Set" });
    await updateActiveConfig({
        github_webhook: {
            bot_to_discord: {
                channel_id: channel.id,
                webhook: {
                    id: webhook.id,
                    token: webhook.token,
                },
            },
        },
    });

    await interaction.reply({
        content: `GitHub Webhook Forum Channel has been set to <#${channel.id}>.`,
        flags: MessageFlags.Ephemeral,
    });
}
