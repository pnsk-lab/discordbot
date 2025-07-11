-- CreateTable
CREATE TABLE "AutoInviteForum" (
    "guildId" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "ignoredTag" TEXT,
    "inverted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AutoInviteForum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL,
    "bulkInviteRoleId" TEXT NOT NULL,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AutoInviteForum" ADD CONSTRAINT "AutoInviteForum_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
