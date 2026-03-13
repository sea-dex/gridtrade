import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load env files in priority order (same logic as src/config/env.ts).
// When launched via `dotenv -e .env.local` the variables are already set,
// but this ensures `drizzle-kit generate` (no dotenv prefix) still works.
//
// drizzle-kit transpiles this config to CJS, so import.meta.dirname is
// unavailable.  Fall back to __dirname (injected by CJS) or derive from
// import.meta.url when running as true ESM.
const root = path.resolve(
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url)),
);
const nodeEnv = process.env.NODE_ENV || 'development';

const envFiles = [
  '.env',
  `.env.${nodeEnv}`,
  '.env.local',
  `.env.${nodeEnv}.local`,
];
const explicitDatabaseUrl = process.env.DATABASE_URL;
const explicitDbHost = process.env.DB_HOST;

for (const file of envFiles) {
  const filePath = path.resolve(root, file);
  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override: true });
  }
}

// Respect a DATABASE_URL explicitly injected by the caller, e.g. an SSH tunnel.
if (explicitDatabaseUrl) {
  process.env.DATABASE_URL = explicitDatabaseUrl;
}

if (explicitDbHost) {
  process.env.DB_HOST = explicitDbHost;
}

function isRunningInDocker(): boolean {
  return fs.existsSync('/.dockerenv');
}

function resolveDatabaseUrl(databaseUrl: string, dbHost?: string): string {
  let parsed: URL;

  try {
    parsed = new URL(databaseUrl);
  } catch {
    return databaseUrl;
  }

  if (dbHost) {
    parsed.hostname = dbHost;
    return parsed.toString();
  }

  if (parsed.hostname === 'host.docker.internal' && !isRunningInDocker()) {
    parsed.hostname = 'localhost';
  }

  return parsed.toString();
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: resolveDatabaseUrl(
      process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/gridex',
      process.env.DB_HOST,
    ),
  },
});
