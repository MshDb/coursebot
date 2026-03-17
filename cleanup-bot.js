const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.bot.deleteMany({
    where: {
      telegramBotId: BigInt('8693479551')
    }
  });
  console.log(`Deleted ${result.count} bots.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
