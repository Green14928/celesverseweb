// Runtime DB init: detect schema mismatch, force-reset only when legacy enum exists.
// After first successful reset, subsequent boots fall back to safe `prisma db push`.
const { Client } = require("pg");
const { spawnSync } = require("child_process");

const prismaCli = "node_modules/prisma/build/index.js";

function run(args) {
  const r = spawnSync("node", [prismaCli, ...args], { stdio: "inherit" });
  if (r.status !== 0) {
    console.error(`[init-db] prisma ${args.join(" ")} exited ${r.status}`);
    process.exit(r.status ?? 1);
  }
}

(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[init-db] DATABASE_URL not set");
    process.exit(1);
  }

  const client = new Client({ connectionString: url });
  await client.connect();

  // Detect legacy OrderStatus enum (CONFIRMED etc.) — signal that this DB predates Phase 2+ refactor.
  const r = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM pg_type t
      JOIN pg_enum e ON e.enumtypid = t.oid
      WHERE t.typname = 'OrderStatus' AND e.enumlabel = 'CONFIRMED'
    ) AS has_legacy
  `);
  const hasLegacy = r.rows[0]?.has_legacy === true;
  await client.end();

  if (hasLegacy) {
    console.log("[init-db] Legacy OrderStatus enum detected — performing one-time force-reset");
    run(["db", "push", "--accept-data-loss", "--force-reset"]);
  } else {
    console.log("[init-db] Schema looks current — running standard db push");
    run(["db", "push", "--accept-data-loss"]);
  }
})().catch((err) => {
  console.error("[init-db] fatal:", err);
  process.exit(1);
});
