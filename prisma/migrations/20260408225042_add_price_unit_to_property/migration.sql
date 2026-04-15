-- CreateEnum
CREATE TYPE "public"."PriceUnit" AS ENUM ('DAY', 'MONTH', 'YEAR');

-- AlterTable
ALTER TABLE "public"."properties" ADD COLUMN     "priceUnit" "public"."PriceUnit" NOT NULL DEFAULT 'MONTH';
