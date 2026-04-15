-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "account_type" TEXT,
ADD COLUMN     "address" TEXT,
ADD COLUMN     "business_id" TEXT,
ADD COLUMN     "city" TEXT DEFAULT 'Kinshasa',
ADD COLUMN     "company_name" TEXT,
ADD COLUMN     "cover_image" TEXT,
ADD COLUMN     "email_verification_token" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "owner_id" TEXT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
