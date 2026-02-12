import type { Result } from "$types";
import {
	MessageFlags,
	roleMention,
	type Guild,
	type Snowflake,
} from "discord.js";

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

export function ok(): Result<void, never>;
export function ok<T>(value: T): Result<T, never>;
export function ok(value?: unknown) {
	return {
		success: true,
		value,
		// biome-ignore lint/suspicious/noExplicitAny: shutup
	} as any;
}

export function err<const E>(error: E): Result<never, E> {
	return {
		success: false,
		error,
	};
}
