const https = require("https");

const TOKEN = process.env.VERCEL_TOKEN || "SEU_VERCEL_TOKEN";
const PROJECT = process.env.VERCEL_PROJECT || "SEU_PROJETO_VERCEL";

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
      timeout: 20000,
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
  // Get latest deployment to find gitSource
  console.log("🔍 Buscando último deployment...");
  const deplRes = await req("GET", `/v6/deployments?projectId=${PROJECT}&limit=1`);
  if (deplRes.status !== 200) {
    console.error("❌ Erro:", deplRes.body);
    process.exit(1);
  }

  const deployments = deplRes.body.deployments || [];
  if (deployments.length === 0) {
    console.error("❌ Nenhum deployment encontrado");
    process.exit(1);
  }

  const latest = deployments[0];
  console.log(`   Último deployment: ${latest.uid} (${latest.state})`);
  console.log(`   Branch: ${latest.meta?.githubCommitRef || "unknown"}`);
  console.log(`   Commit: ${latest.meta?.githubCommitSha?.slice(0, 7) || "unknown"}\n`);

  // Redeploy using the same git source
  console.log("🚀 Disparando redeploy...");
  const redeployRes = await req("POST", `/v13/deployments?forceNew=1`, {
    name: PROJECT,
    deploymentId: latest.uid,
  });

  if (redeployRes.status === 200 || redeployRes.status === 201) {
    const d = redeployRes.body;
    console.log(`✅ Redeploy iniciado!`);
    console.log(`   ID: ${d.id || d.uid}`);
    console.log(`   URL: https://${d.url || PROJECT + ".vercel.app"}`);
    console.log(`   Status: ${d.readyState || d.status || "queued"}`);
  } else {
    console.error("❌ Erro no redeploy:", JSON.stringify(redeployRes.body, null, 2));
  }
}

main().catch(console.error);
