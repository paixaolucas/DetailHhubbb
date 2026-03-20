// =============================================================================
// migrate-db.js — copia todos os dados do banco antigo para o novo
// Uso: node scripts/migrate-db.js
// =============================================================================

const { Client } = require("pg");

const SSL = { rejectUnauthorized: false };

const OLD_CONN = {
  host: process.env.OLD_DB_HOST || "db.SEU_PROJECT_ANTIGO.supabase.co",
  port: 5432, user: "postgres", password: process.env.OLD_DB_PASSWORD || "",
  database: "postgres", ssl: SSL,
};
const NEW_CONN = {
  host: process.env.NEW_DB_HOST || "db.SEU_PROJECT_NOVO.supabase.co",
  port: 5432, user: "postgres", password: process.env.NEW_DB_PASSWORD || "",
  database: "postgres", ssl: SSL,
};

// Ordem respeitando foreign keys (pai antes do filho)
const TABLE_ORDER = [
  "users",
  "user_profiles",
  "refresh_tokens",
  "influencers",
  "communities",
  "spaces",
  "platform_plans",
  "platform_memberships",
  "subscription_plans",
  "community_memberships",
  "posts",
  "comments",
  "post_reactions",
  "comment_reactions",
  "notifications",
  "payments",
  "commission_transactions",
  "marketplace_listings",
  "marketplace_products",
  "marketplace_purchases",
  "live_sessions",
  "live_session_attendees",
  "modules",
  "lessons",
  "content_progress",
  "badges",
  "user_badges",
  "certificates",
  "conversations",
  "conversation_participants",
  "messages",
  "reports",
  "analytics_events",
  "ai_usage_logs",
  "leaderboard_entries",
  "point_transactions",
  "commission_rules",
  "influencer_links",
  "referral_conversions",
];

async function getTables(client) {
  const res = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    AND table_name NOT LIKE '_prisma%'
  `);
  return res.rows.map((r) => r.table_name);
}

async function copyTable(src, dst, table) {
  const res = await src.query(`SELECT * FROM "${table}"`);
  if (res.rows.length === 0) {
    console.log(`  ⬜ ${table}: vazia`);
    return;
  }

  const cols = Object.keys(res.rows[0]);
  const colList = cols.map((c) => `"${c}"`).join(", ");
  let inserted = 0;

  for (const row of res.rows) {
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
    // Serializa objetos/arrays para JSON string (evita erro "invalid input syntax for type json")
    const values = cols.map((c) => {
      const v = row[c];
      if (v !== null && v !== undefined && typeof v === "object" && !Buffer.isBuffer(v)) {
        return JSON.stringify(v);
      }
      return v;
    });
    try {
      await dst.query(
        `INSERT INTO "${table}" (${colList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
        values
      );
      inserted++;
    } catch (err) {
      console.warn(`    ⚠️  Linha ignorada em ${table}: ${err.message}`);
    }
  }

  console.log(`  ✅ ${table}: ${inserted}/${res.rows.length} linhas`);
}

async function migrate() {
  const src = new Client(OLD_CONN);
  const dst = new Client(NEW_CONN);

  console.log("🔌 Conectando aos bancos...");
  await src.connect();
  await dst.connect();
  console.log("   ✅ Conectado!\n");

  // Descobre tabelas reais no banco de origem
  const existingTables = await getTables(src);
  const tables = TABLE_ORDER.filter((t) => existingTables.includes(t));
  // Adiciona tabelas que existem mas não estão no TABLE_ORDER
  const extra = existingTables.filter((t) => !TABLE_ORDER.includes(t));
  if (extra.length) console.log(`ℹ️  Tabelas extras: ${extra.join(", ")}\n`);

  // Desativa verificações de FK no destino
  await dst.query(`SET session_replication_role = 'replica'`);

  // Trunca todas as tabelas do destino
  console.log("🗑️  Limpando banco destino...");
  for (const table of [...tables].reverse()) {
    await dst.query(`TRUNCATE TABLE "${table}" CASCADE`).catch(() => {});
  }
  for (const table of extra) {
    await dst.query(`TRUNCATE TABLE "${table}" CASCADE`).catch(() => {});
  }
  console.log("   ✅ Limpo!\n");

  // Copia dados
  console.log("📦 Copiando dados...");
  for (const table of tables) {
    await copyTable(src, dst, table);
  }
  for (const table of extra) {
    await copyTable(src, dst, table);
  }

  // Reativa FK
  await dst.query(`SET session_replication_role = 'origin'`);

  await src.end();
  await dst.end();

  console.log("\n🎉 Migração concluída!");
}

migrate().catch((err) => {
  console.error("❌ Erro na migração:", err.message);
  process.exit(1);
});
