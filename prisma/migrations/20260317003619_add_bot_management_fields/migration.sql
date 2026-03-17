/*
  Warnings:

  - The values [DRAFT,SUSPENDED] on the enum `BotStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `bot_name` on the `bots` table. All the data in the column will be lost.
  - You are about to drop the column `bot_username` on the `bots` table. All the data in the column will be lost.
  - You are about to drop the column `encrypted_token` on the `bots` table. All the data in the column will be lost.
  - Added the required column `display_name` to the `bots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `telegram_bot_username` to the `bots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `token_encrypted` to the `bots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `webhook_secret_token` to the `bots` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `telegram_bot_id` on the `bots` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `telegram_user_id` on the `end_users` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SubscriberStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'UNSUBSCRIBED');

-- AlterEnum
BEGIN;
CREATE TYPE "BotStatus_new" AS ENUM ('ACTIVE', 'PAUSED', 'ERROR', 'DELETED');
ALTER TABLE "public"."bots" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "bots" ALTER COLUMN "status" TYPE "BotStatus_new" USING ("status"::text::"BotStatus_new");
ALTER TYPE "BotStatus" RENAME TO "BotStatus_old";
ALTER TYPE "BotStatus_new" RENAME TO "BotStatus";
DROP TYPE "public"."BotStatus_old";
ALTER TABLE "bots" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterTable
ALTER TABLE "bot_subscribers" ADD COLUMN     "status" "SubscriberStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "subscribed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "unsubscribed_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "bots" DROP COLUMN "bot_name",
DROP COLUMN "bot_username",
DROP COLUMN "encrypted_token",
ADD COLUMN     "display_name" TEXT NOT NULL,
ADD COLUMN     "menu_config" JSONB,
ADD COLUMN     "telegram_bot_username" TEXT NOT NULL,
ADD COLUMN     "token_encrypted" TEXT NOT NULL,
ADD COLUMN     "webhook_secret_token" TEXT NOT NULL,
ADD COLUMN     "webhook_url" TEXT,
ADD COLUMN     "welcome_message" TEXT,
DROP COLUMN "telegram_bot_id",
ADD COLUMN     "telegram_bot_id" BIGINT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "end_users" ADD COLUMN     "language_code" TEXT,
DROP COLUMN "telegram_user_id",
ADD COLUMN     "telegram_user_id" BIGINT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "bots_telegram_bot_id_key" ON "bots"("telegram_bot_id");

-- CreateIndex
CREATE UNIQUE INDEX "end_users_telegram_user_id_key" ON "end_users"("telegram_user_id");
