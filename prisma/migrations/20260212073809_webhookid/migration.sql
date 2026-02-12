/*
  Warnings:

  - A unique constraint covering the columns `[webhookId]` on the table `DiscordForum` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `webhookId` to the `DiscordForum` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DiscordForum" ADD COLUMN     "webhookId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "DiscordForum_webhookId_key" ON "DiscordForum"("webhookId");
