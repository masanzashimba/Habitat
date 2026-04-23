-- AlterTable
ALTER TABLE "public"."Tenant" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "emergencyPhone" TEXT,
ADD COLUMN     "employer" TEXT,
ADD COLUMN     "monthlyIncome" DOUBLE PRECISION,
ADD COLUMN     "nationalId" TEXT,
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "profileImage" TEXT;
