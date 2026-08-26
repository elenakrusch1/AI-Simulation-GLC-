// A prisma.config.ts opts out of Prisma's implicit .env loading, so
// we load it ourselves — Next.js does the same for `next dev`/`next
// build`, but the Prisma CLI (migrate, studio, this config file
// itself) runs outside Next entirely.
import { config as loadDotenv } from "dotenv";
import { defineConfig } from "prisma/config";

loadDotenv({ quiet: true });

// Prisma 6's newer config surface — keeps the `seed` command out of
// package.json (deprecated there) without adopting Prisma 7's
// datasource-in-config/driver-adapter requirement, which would be a
// much larger, riskier jump for this project right now.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
});
