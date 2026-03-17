import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const workspace = await prisma.workspace.findFirst();
  const user = await prisma.user.findFirst();
  console.log(JSON.stringify({ workspace, user }));
}
main();
