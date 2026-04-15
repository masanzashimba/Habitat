/*
  Warnings:

  - The values [tenant] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `created_at` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `property_id` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `leases` table. All the data in the column will be lost.
  - You are about to drop the column `owner_id` on the `leases` table. All the data in the column will be lost.
  - You are about to drop the column `property_id` on the `leases` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `leases` table. All the data in the column will be lost.
  - You are about to drop the column `tenant_id` on the `leases` table. All the data in the column will be lost.
  - You are about to drop the column `address_id` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `bathrooms` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `bedrooms` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `beds` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `is_featured` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `is_verified` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `kitchens` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `livingRooms` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `maxGuests` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `otherRooms` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `payment_type` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `price_unit` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `short_description` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `special_notes` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `views` on the `properties` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `property_images` table. All the data in the column will be lost.
  - You are about to drop the column `image_url` on the `property_images` table. All the data in the column will be lost.
  - You are about to drop the column `is_primary` on the `property_images` table. All the data in the column will be lost.
  - You are about to drop the column `property_id` on the `property_images` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `email_verification_token` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `failed_login_attempts` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `is_deleted` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `is_email_verified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `is_phone_verified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `last_login_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `locked_until` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `owner_id` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `password_changed_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `users` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `propertyId` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `leases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `propertyId` to the `leases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `leases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `leases` table without a default value. This is not possible if the table is not empty.
  - Added the required column `addressId` to the `properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `property_images` table without a default value. This is not possible if the table is not empty.
  - Added the required column `propertyId` to the `property_images` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."Role_new" AS ENUM ('admin', 'owner');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."users" ALTER COLUMN "role" TYPE "public"."Role_new" USING ("role"::text::"public"."Role_new");
ALTER TYPE "public"."Role" RENAME TO "Role_old";
ALTER TYPE "public"."Role_new" RENAME TO "Role";
DROP TYPE "public"."Role_old";
ALTER TABLE "public"."users" ALTER COLUMN "role" SET DEFAULT 'owner';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."bookings" DROP CONSTRAINT "bookings_property_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."bookings" DROP CONSTRAINT "bookings_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."leases" DROP CONSTRAINT "leases_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."leases" DROP CONSTRAINT "leases_property_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."leases" DROP CONSTRAINT "leases_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."properties" DROP CONSTRAINT "properties_address_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."properties" DROP CONSTRAINT "properties_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."property_images" DROP CONSTRAINT "property_images_property_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_owner_id_fkey";

-- AlterTable
ALTER TABLE "public"."addresses" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."bookings" DROP COLUMN "property_id",
DROP COLUMN "user_id",
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."leases" DROP COLUMN "notes",
DROP COLUMN "owner_id",
DROP COLUMN "property_id",
DROP COLUMN "start_date",
DROP COLUMN "tenant_id",
ADD COLUMN     "ownerId" TEXT NOT NULL,
ADD COLUMN     "propertyId" TEXT NOT NULL,
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."properties" DROP COLUMN "address_id",
DROP COLUMN "bathrooms",
DROP COLUMN "bedrooms",
DROP COLUMN "beds",
DROP COLUMN "created_at",
DROP COLUMN "discount",
DROP COLUMN "is_featured",
DROP COLUMN "is_verified",
DROP COLUMN "kitchens",
DROP COLUMN "livingRooms",
DROP COLUMN "maxGuests",
DROP COLUMN "otherRooms",
DROP COLUMN "payment_type",
DROP COLUMN "price_unit",
DROP COLUMN "short_description",
DROP COLUMN "special_notes",
DROP COLUMN "updated_at",
DROP COLUMN "user_id",
DROP COLUMN "views",
ADD COLUMN     "addressId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ALTER COLUMN "slug" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."property_images" DROP COLUMN "created_at",
DROP COLUMN "image_url",
DROP COLUMN "is_primary",
DROP COLUMN "property_id",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "imageUrl" TEXT NOT NULL,
ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "propertyId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "created_at",
DROP COLUMN "email_verification_token",
DROP COLUMN "failed_login_attempts",
DROP COLUMN "is_deleted",
DROP COLUMN "is_email_verified",
DROP COLUMN "is_phone_verified",
DROP COLUMN "last_login_at",
DROP COLUMN "locked_until",
DROP COLUMN "owner_id",
DROP COLUMN "password_changed_at",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "passwordChangedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- DropEnum
DROP TYPE "public"."PriceUnit";

-- CreateTable
CREATE TABLE "public"."Tenant" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "ownerId" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_userId_key" ON "public"."Tenant"("userId");

-- CreateIndex
CREATE INDEX "Tenant_email_idx" ON "public"."Tenant"("email");

-- AddForeignKey
ALTER TABLE "public"."Tenant" ADD CONSTRAINT "Tenant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Tenant" ADD CONSTRAINT "Tenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."properties" ADD CONSTRAINT "properties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."properties" ADD CONSTRAINT "properties_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "public"."addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."property_images" ADD CONSTRAINT "property_images_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leases" ADD CONSTRAINT "leases_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leases" ADD CONSTRAINT "leases_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."leases" ADD CONSTRAINT "leases_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
