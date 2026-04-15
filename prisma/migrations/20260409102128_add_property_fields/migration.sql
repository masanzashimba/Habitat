/*
  Warnings:

  - You are about to drop the column `priceUnit` on the `properties` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."properties" DROP COLUMN "priceUnit",
ADD COLUMN     "bathrooms" INTEGER,
ADD COLUMN     "bedrooms" INTEGER,
ADD COLUMN     "beds" INTEGER,
ADD COLUMN     "discount" DECIMAL(5,2),
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kitchens" INTEGER,
ADD COLUMN     "livingRooms" INTEGER,
ADD COLUMN     "otherRooms" TEXT,
ADD COLUMN     "paymentType" TEXT,
ADD COLUMN     "specialNotes" TEXT;
