import type { SetStateAction } from "$types";
import { db } from "./db";
import { config, type ActiveConfig } from "./drizzle/schema";

export { db } from "./db";
export * from "./drizzle/schema";
let dbCache: ActiveConfig | null = null;

export async function getActiveConfig() {
    if (dbCache !== null) {
        return dbCache;
    }
    return db
        .select()
        .from(config)
        .limit(1)
        .then(rows => {
            return (dbCache = rows[0].value);
        });
}
export async function updateActiveConfig(newConfig: SetStateAction<ActiveConfig>) {
    if (typeof newConfig === "function") {
        const currentConfig = await getActiveConfig();
        newConfig = newConfig(currentConfig);
    }
    await db.update(config).set({ value: newConfig }).returning();
    return (dbCache = newConfig); // Update the cache
}
