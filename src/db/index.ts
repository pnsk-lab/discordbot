import type { SetStateAction } from "$types";
import { db } from "./db";
import { config, type ActiveConfig } from "./drizzle/schema";

export { db } from "./db";
export * from "./drizzle/schema";
let dbCache: ActiveConfig | null = null;

export async function getActiveConfig() {
    // if (dbCache !== null) {
    //     return dbCache;
    // }
    const row = await db.query.config.findFirst();

    if (row === undefined) {
        return (dbCache = await db
            .insert(config)
            .values({})
            .returning()
            .then(rows => rows[0].value)) as ActiveConfig;
    }
    return (dbCache = row.value as ActiveConfig); // Cache the result
}
export async function updateActiveConfig(newConfig: SetStateAction<ActiveConfig>) {
    if (typeof newConfig === "function") {
        const currentConfig = await getActiveConfig();
        newConfig = newConfig(currentConfig);
    }
    await db.update(config).set({ value: newConfig }).returning();
    return (dbCache = newConfig); // Update the cache
}
