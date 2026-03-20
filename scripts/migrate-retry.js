// Retry apenas tabelas que falharam na migração anterior
const { Client } = require("pg");

const SSL = { rejectUnauthorized: false };
const OLD_CONN = { host: process.env.OLD_DB_HOST || "db.SEU_PROJECT_ANTIGO.supabase.co", port: 5432, user: "postgres", password: process.env.OLD_DB_PASSWORD || "", database: "postgres", ssl: SSL };
const NEW_CONN = { host: process.env.NEW_DB_HOST || "db.SEU_PROJECT_NOVO.supabase.co", port: 5432, user: "postgres", password: process.env.NEW_DB_PASSWORD || "", database: "postgres", ssl: SSL };

const RETRY_TABLES = ["communities", "platform_plans", "subscription_plans", "marketplace_listings", "saas_tools"];

async function copyTable(src, dst, table) {
  const res = await src.query(`SELECT * FROM "${table}"`);
  if (res.rows.length === 0) { console.log(`  ⬜ ${table}: vazia`); return; }

  const cols = Object.keys(res.rows[0]);
  const colList = cols.map((c) => `"${c}"`).join(", ");
  let inserted = 0, failed = 0;

  for (const row of res.rows) {
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
    const values = cols.map((c) => {
      const v = row[c];
      if (v !== null && v !== undefined && typeof v === "object" && !Buffer.isBuffer(v)) return JSON.stringify(v);
      return v;
    });
    try {
      await dst.query(`INSERT INTO "${table}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`, values);
      inserted++;
    } catch (err) {
      failed++;
      console.warn(`    ❌ ${table} falhou: ${err.message}`);
    }
  }
  console.log(`  ✅ ${table}: ${inserted}/${res.rows.length} linhas${failed ? ` (${failed} falharam)` : ""}`);
}

async function main() {
  const src = new Client(OLD_CONN);
  const dst = new Client(NEW_CONN);
  await src.connect();
  await dst.connect();

  await dst.query(`SET session_replication_role = 'replica'`);

  for (const table of RETRY_TABLES) {
    await dst.query(`TRUNCATE TABLE "${table}" CASCADE`).catch(() => {});
    await copyTable(src, dst, table);
  }

  await dst.query(`SET session_replication_role = 'origin'`);
  await src.end();
  await dst.end();
  console.log("\n🎉 Retry concluído!");
}

main().catch(console.error);
