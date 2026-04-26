import { defineConfig } from "drizzle-kit";

export default defineConfig({
    out: "./drizzle",
    dialect: "postgresql",
    schema: "./drizzle/schemas.ts",

    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },

    schemaFilter: "public",

    migrations: {
        prefix: "timestamp",
        table: "__drizzle_migrations__",
        schema: "public",
    },

    breakpoints: true,
    strict: true,
    verbose: true,
});
