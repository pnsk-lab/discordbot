import type { JSONLike, Result } from "$types";

export function unwrapJsonLike<T>(jsonlike: JSONLike<T>): T {
	if (
		typeof jsonlike === "object" &&
		jsonlike !== null &&
		"toJSON" in jsonlike
	) {
		return jsonlike.toJSON();
	}
	// biome-ignore lint/suspicious/noExplicitAny: type is totally fine
	return jsonlike as any;
}
export function err<const E>(error: E): Result<never, E> {
	return {
		success: false,
		error,
	};
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
