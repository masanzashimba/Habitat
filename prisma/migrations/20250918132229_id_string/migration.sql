/*
  Warnings:

  - The primary key for the `addresses` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `amenities` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `bookings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `favorites` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `properties` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `property_images` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `reviews` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "public"."bookings" DROP CONSTRAINT "bookings_property_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."favorites" DROP CONSTRAINT "favorites_property_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."properties" DROP CONSTRAINT "properties_address_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."property_images" DROP CONSTRAINT "property_images_property_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."reviews" DROP CONSTRAINT "reviews_property_id_fkey";

-- AlterTable
ALTER TABLE "public"."addresses" DROP CONSTRAINT "addresses_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "addresses_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "addresses_id_seq";

-- AlterTable
ALTER TABLE "public"."amenities" DROP CONSTRAINT "amenities_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "amenities_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "amenities_id_seq";

-- AlterTable
ALTER TABLE "public"."bookings" DROP CONSTRAINT "bookings_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "property_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "bookings_id_seq";

-- AlterTable
ALTER TABLE "public"."favorites" DROP CONSTRAINT "favorites_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "property_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "favorites_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "favorites_id_seq";

-- AlterTable
ALTER TABLE "public"."properties" DROP CONSTRAINT "properties_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "address_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "properties_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "properties_id_seq";

-- AlterTable
ALTER TABLE "public"."property_images" DROP CONSTRAINT "property_images_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "property_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "property_images_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "property_images_id_seq";

-- AlterTable
ALTER TABLE "public"."reviews" DROP CONSTRAINT "reviews_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "property_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "reviews_id_seq";

-- AddForeignKey
ALTER TABLE "public"."properties" ADD CONSTRAINT "properties_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."property_images" ADD CONSTRAINT "property_images_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."favorites" ADD CONSTRAINT "favorites_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
