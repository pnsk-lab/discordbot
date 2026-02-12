-- CreateTable
CREATE TABLE "DiscordForum" (
    "id" TEXT NOT NULL,

    CONSTRAINT "DiscordForum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscordForumThread" (
    "id" TEXT NOT NULL,
    "githubRepoId" TEXT NOT NULL,
    "forumId" TEXT NOT NULL,

    CONSTRAINT "DiscordForumThread_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiscordForumThread_githubRepoId_key" ON "DiscordForumThread"("githubRepoId");

-- AddForeignKey
ALTER TABLE "DiscordForumThread" ADD CONSTRAINT "DiscordForumThread_forumId_fkey" FOREIGN KEY ("forumId") REFERENCES "DiscordForum"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
