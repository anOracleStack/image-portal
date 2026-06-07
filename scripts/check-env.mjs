#!/usr/bin/env node
/**
 * Print which Image Portal env vars are set (no secret values).
 * Run from repo root: node scripts/check-env.mjs
 * Or: pnpm check:env
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const envPath = resolve(root, "apps/web/.env.local");
const examplePath = resolve(root, "apps/web/.env.example");

/** @type {Record<string, { required: boolean; group: string }>} */
const VARS = {
  NEXT_PUBLIC_SUPABASE_URL: { required: true, group: "Supabase" },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: { required: true, group: "Supabase" },
  SUPABASE_SERVICE_ROLE_KEY: { required: true, group: "Supabase" },
  NEXT_PUBLIC_APP_URL: { required: true, group: "App" },
  PORT: { required: false, group: "App" },
  CATALOG_EMBED_PROVIDER: { required: false, group: "Matching" },
  CATALOG_EMBED_ENDPOINT: { required: false, group: "Matching" },
  CATALOG_EMBED_API_KEY: { required: false, group: "Matching" },
  EMBED_MODEL_ID: { required: false, group: "Matching" },
  EMBED_VERSION: { required: false, group: "Matching" },
  OPENAI_API_KEY: { required: false, group: "AI chat" },
  OPENAI_MODEL: { required: false, group: "AI chat" },
  STRIPE_SECRET_KEY: { required: false, group: "Stripe" },
  STRIPE_WEBHOOK_SECRET: { required: false, group: "Stripe" },
  STRIPE_PRICE_INDIE: { required: false, group: "Stripe" },
  STRIPE_PRICE_PRO: { required: false, group: "Stripe" },
  SAFE_BROWSING_API_KEY: { required: false, group: "Safety" },
  MAX_IMAGE_UPLOAD_MB: { required: false, group: "App" },
};

function loadEnvFile(path) {
  /** @type {Record<string, string>} */
  const out = {};
  if (!existsSync(path)) return out;
  const text = readFileSync(path, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const fileEnv = loadEnvFile(envPath);
const merged = { ...process.env, ...fileEnv };

const groups = new Map();
for (const [key, meta] of Object.entries(VARS)) {
  const val = merged[key];
  const set = Boolean(val && String(val).trim());
  if (!groups.has(meta.group)) groups.set(meta.group, []);
  groups.get(meta.group).push({ key, set, required: meta.required });
}

console.log("Image Portal — environment check");
console.log(`Env file: ${existsSync(envPath) ? envPath : "(missing — copy apps/web/.env.example → .env.local)"}`);
console.log(`Example:  ${examplePath}\n`);

let missingRequired = 0;
let missingOptional = 0;

for (const [group, items] of groups) {
  console.log(`## ${group}`);
  for (const { key, set, required } of items) {
    const status = set ? "✓ set" : required ? "✗ MISSING (required)" : "○ optional (unset)";
    console.log(`  ${key.padEnd(32)} ${status}`);
    if (!set && required) missingRequired++;
    if (!set && !required) missingOptional++;
  }
  console.log("");
}

if (missingRequired > 0) {
  console.log(`⚠ ${missingRequired} required variable(s) missing. See docs/ENV_KEYS.md & docs/USER_SETUP.md`);
  process.exit(1);
}

console.log("✓ All required variables are set.");
if (missingOptional > 0) {
  console.log(`  ${missingOptional} optional variable(s) unset — app runs with graceful fallbacks.`);
}
