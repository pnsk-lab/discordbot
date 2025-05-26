declare global {
    namespace NodeJS {
        interface ProcessEnv {
            // NODE_ENV: "development" | "production" | "test";
            // PORT: string;
            // DATABASE_URL: string;
            // B2D_WH_ID: string;
            // B2D_WH_TOKEN: string;
            // B2D_WH_FORUM: string;
            // G2B_WH_SECRET: string;
            // HOME_GUILD: string;
            // DISCORD_TOKEN: string;
        }
    }
}
