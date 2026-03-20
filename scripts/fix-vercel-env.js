// Fix Vercel env vars that failed due to "already exists" error
// Deletes existing entries then recreates them
const https = require("https");

const TOKEN = process.env.VERCEL_TOKEN || "SEU_VERCEL_TOKEN";
const PROJECT = process.env.VERCEL_PROJECT || "SEU_PROJETO_VERCEL";

const VARS_TO_FIX = {
  DATABASE_URL: process.env.DATABASE_URL || "",
  DIRECT_URL: process.env.DIRECT_URL || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "",
};

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: "api.vercel.com",
      port: 443,
      path,
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        ...(data ? { "Content-Length": Buffer.byteLength(data) } : {}),
      },
      timeout: 15000,
    };
    const r = https.request(options, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    r.on("error", reject);
    r.on("timeout", () => { r.destroy(); reject(new Error("timeout")); });
    if (data) r.write(data);
    r.end();
  });
}

async function main() {
  // 1. Get all existing env var entries
  console.log("📋 Buscando variáveis existentes...");
  const listRes = await req("GET", `/v9/projects/${PROJECT}/env?limit=100`);
  if (listRes.status !== 200) {
    console.error("❌ Erro ao listar:", listRes.body);
    process.exit(1);
  }

  const allEnvs = listRes.body.envs || [];
  console.log(`   ${allEnvs.length} variáveis encontradas\n`);

  // 2. Delete all entries for our target keys
  const keysToFix = Object.keys(VARS_TO_FIX);
  for (const key of keysToFix) {
    const entries = allEnvs.filter((e) => e.key === key);
    if (entries.length === 0) {
      console.log(`   ⬜ ${key}: não existe, será criada`);
      continue;
    }
    for (const entry of entries) {
      const delRes = await req("DELETE", `/v9/projects/${PROJECT}/env/${entry.id}`);
      if (delRes.status === 200 || delRes.status === 204) {
        console.log(`   🗑️  ${key} [${entry.id}] deletada (target: ${entry.target})`);
      } else {
        console.warn(`   ⚠️  Falha ao deletar ${key} [${entry.id}]: ${JSON.stringify(delRes.body)}`);
      }
    }
  }

  console.log("\n📝 Criando variáveis novas...");

  // 3. Recreate with all targets
  for (const [key, value] of Object.entries(VARS_TO_FIX)) {
    const createRes = await req("POST", `/v9/projects/${PROJECT}/env`, {
      key,
      value,
      type: "encrypted",
      target: ["production", "preview", "development"],
    });
    if (createRes.status === 200 || createRes.status === 201) {
      console.log(`   ✅ ${key}`);
    } else {
      console.error(`   ❌ ${key}: ${JSON.stringify(createRes.body)}`);
    }
  }

  console.log("\n🎉 Concluído! Faça um redeploy no Vercel para aplicar as mudanças.");
}

main().catch(console.error);
