import { PrismaClient } from "@prisma/client";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create a default user
  const hashedPassword = hashSync("password123", 10);

  const user = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      passwordHash: hashedPassword,
      emailVerified: new Date(),
    },
  });

  console.log("Created default user:", user.email);

  // Create a default workspace for the user
  const workspace = await prisma.workspace.upsert({
    where: { id: "default-workspace-id" }, // Using a fixed ID for simplicity, or just use findFirst
    update: {},
    create: {
      name: "Default Workspace",
      slug: "default-workspace",
      createdById: user.id,
    },
  });

  console.log("Created default workspace:", workspace.name);

  // Add user as an owner of the workspace
  await prisma.workspaceMembership.upsert({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId: workspace.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      workspaceId: workspace.id,
      role: "OWNER",
    },
  });

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
