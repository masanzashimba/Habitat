-- CreateEnum
CREATE TYPE "public"."PropertyPurpose" AS ENUM ('A_LOUER', 'A_VENDRE', 'SEJOUR_LIMITE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."PropertyType" ADD VALUE 'villa';
ALTER TYPE "public"."PropertyType" ADD VALUE 'duplex';
ALTER TYPE "public"."PropertyType" ADD VALUE 'penthouse';
ALTER TYPE "public"."PropertyType" ADD VALUE 'bungalow';
ALTER TYPE "public"."PropertyType" ADD VALUE 'chalet';
ALTER TYPE "public"."PropertyType" ADD VALUE 'residence';
ALTER TYPE "public"."PropertyType" ADD VALUE 'loft';
ALTER TYPE "public"."PropertyType" ADD VALUE 'co_living';
ALTER TYPE "public"."PropertyType" ADD VALUE 'office';
ALTER TYPE "public"."PropertyType" ADD VALUE 'shop';
ALTER TYPE "public"."PropertyType" ADD VALUE 'warehouse';
ALTER TYPE "public"."PropertyType" ADD VALUE 'land';
ALTER TYPE "public"."PropertyType" ADD VALUE 'guest_house';
ALTER TYPE "public"."PropertyType" ADD VALUE 'hotel_room';
ALTER TYPE "public"."PropertyType" ADD VALUE 'airbnb';

-- AlterTable
ALTER TABLE "public"."properties" ADD COLUMN     "purpose" "public"."PropertyPurpose" NOT NULL DEFAULT 'A_LOUER';
