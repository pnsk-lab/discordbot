import type { Result } from "$types";
import { MessageFlags, roleMention, type Guild, type Snowflake } from "discord.js";

export async function bulkInvite(
    guild: Guild,
    threadId: Snowflake,
    roleId: Snowflake
): Promise<Result<void, "ChannelNotFoundError" | "ChannelNotSendableError">> {
    const channel = await guild.channels.fetch(threadId);
    if (!channel) {
        return { success: false, error: "ChannelNotFoundError" };
    }
    if (!channel.isSendable()) {
        return { success: false, error: "ChannelNotSendableError" };
    }
    const message = await channel.send({
        content: "-# Bulk Invite Message",
        flags: MessageFlags.SuppressNotifications,
    });

    await message.edit({
        content: roleMention(roleId),
    });
    await message.delete();
    return { success: true, value: undefined };
}
