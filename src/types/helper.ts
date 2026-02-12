import type { JSONLike } from "$types";

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
