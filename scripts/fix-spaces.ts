// =============================================================================
// Script: fix-spaces.ts
// Reduz cada comunidade para no máximo 3 espaços.
// Espaços extras têm seus posts movidos para o espaço padrão antes de serem removidos.
// Uso: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/fix-spaces.ts
// =============================================================================

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🔍 Verificando espaços por comunidade...\n");

  const communities = await db.community.findMany({
    select: { id: true, name: true },
  });

  for (const community of communities) {
    const spaces = await db.space.findMany({
      where: { communityId: community.id },
      orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
    });

    if (spaces.length <= 3) {
      console.log(`✅ ${community.name}: ${spaces.length} espaços — OK`);
      continue;
    }

    const keep = spaces.slice(0, 3);
    const remove = spaces.slice(3);
    const defaultSpace = keep.find((s) => s.isDefault) ?? keep[0];

    console.log(`⚠️  ${community.name}: ${spaces.length} espaços — removendo ${remove.length}`);

    for (const space of remove) {
      const postCount = await db.post.count({ where: { spaceId: space.id } });
      if (postCount > 0) {
        console.log(`   → Movendo ${postCount} post(s) de "${space.name}" para "${defaultSpace.name}"`);
        await db.post.updateMany({
          where: { spaceId: space.id },
          data: { spaceId: defaultSpace.id },
        });
      }
      await db.space.delete({ where: { id: space.id } });
      console.log(`   → Espaço "${space.name}" removido`);
    }
  }

  console.log("\n✅ Concluído!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
