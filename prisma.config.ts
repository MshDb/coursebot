// @ts-ignore
import { defineConfig } from "@prisma/config";
// @ts-ignore
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

export default defineConfig({
  earlyAccess: true,
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL!
  },
});
