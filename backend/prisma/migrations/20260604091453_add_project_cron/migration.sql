-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "cron_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cron_expr" TEXT;
