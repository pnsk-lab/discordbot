import {
	MessageFlags,
	roleMention,
	type Guild,
	type Snowflake,
} from "discord.js";
import { err, ok } from "../types/helper";

export async function bulkInvite(
	guild: Guild,
	threadId: Snowflake,
	roleId: Snowflake,
) {
	const channel = await guild.channels.fetch(threadId);
	if (channel == null) {
		return err("ChannelNotFoundError");
	}
	if (!channel.isSendable()) {
		return err("ChannelNotSendableError");
	}
	const message = await channel.send({
		content: "-# Bulk Invite Message",
		flags: MessageFlags.SuppressNotifications,
	});

	await message.edit({
		content: roleMention(roleId),
	});
	await message.delete();
	return ok();
}
