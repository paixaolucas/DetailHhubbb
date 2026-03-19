// One-time script: make communityId and ruleId nullable in commission_transactions
// Run with: npx ts-node prisma/apply-commission-migration.ts

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Applying commission_transactions nullable migration...");
  await db.$executeRawUnsafe(`
    ALTER TABLE commission_transactions
      ALTER COLUMN "communityId" DROP NOT NULL,
      ALTER COLUMN "ruleId" DROP NOT NULL;
  `);
  console.log("✅ Done — communityId and ruleId are now nullable.");
}

main()
  .catch((e) => { console.error("❌ Error:", e.message); process.exit(1); })
  .finally(() => db.$disconnect());
