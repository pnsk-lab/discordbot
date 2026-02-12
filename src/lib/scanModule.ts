/** biome-ignore-all lint/complexity/noBannedTypes: i am fine */
import { IS_DEV } from "..";

//#region Importing commands
export async function* scanModule<T extends {}>(
	dir: string,
	validate: (mod: {}) => mod is T = (mod): mod is T => true,
): AsyncGenerator<T> {
	const baseDir = new URL(`../${dir}/`, import.meta.url);
	const glob = new Bun.Glob("**/*.ts");

	for await (const file of glob.scan(baseDir.pathname)) {
		const mod = await import(new URL(file, baseDir).href);
		if (!validate(mod)) {
			const msg = `${file} doesn't export the expected module`;
			if (IS_DEV) {
				console.warn(`[ ⚠️ ] ${msg}`);
				continue;
			}
			throw new Error(msg);
		}

		yield mod;
	}
}
