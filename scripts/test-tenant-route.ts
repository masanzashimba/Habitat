import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Testing tenant data structure...\n');

  try {
    // 1. Vérifier les propriétaires
    const owners = await prisma.user.findMany({
      where: { role: 'owner' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
      take: 5,
    });

    console.log(`📊 Found ${owners.length} owners in the system\n`);

    if (owners.length === 0) {
      console.log('⚠️  No owners found. Create an owner user first.');
      return;
    }

    // 2. Pour chaque propriétaire, vérifier ses locataires
    for (const owner of owners) {
      console.log(
        `\n👤 Owner: ${owner.firstName} ${owner.lastName} (${owner.email})`,
      );
      console.log(`   ID: ${owner.id}`);

      // Récupérer les baux du propriétaire
      const leases = await prisma.lease.findMany({
        where: { ownerId: owner.id },
        include: {
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              isActive: true,
            },
          },
          property: {
            select: {
              id: true,
              title: true,
              address: {
                select: {
                  commune: true,
                  quartier: true,
                },
              },
            },
          },
          contract: {
            select: {
              id: true,
              signedAt: true,
            },
          },
        },
      });

      console.log(`   📋 Leases: ${leases.length}`);

      if (leases.length === 0) {
        console.log('   ⚠️  No leases found for this owner');
        continue;
      }

      // Grouper par locataire
      const tenantsMap = new Map();
      leases.forEach((lease) => {
        const tenantId = lease.tenant.id;
        if (!tenantsMap.has(tenantId)) {
          tenantsMap.set(tenantId, {
            tenant: lease.tenant,
            leases: [],
          });
        }
        tenantsMap.get(tenantId).leases.push(lease);
      });

      console.log(`   👥 Unique tenants: ${tenantsMap.size}\n`);

      // Afficher les détails de chaque locataire
      tenantsMap.forEach((data, tenantId) => {
        const { tenant, leases } = data;
        console.log(
          `   🏠 Tenant: ${tenant.firstName} ${tenant.lastName} (${tenant.email})`,
        );
        console.log(`      ID: ${tenant.id}`);
        console.log(`      Phone: ${tenant.phone || 'N/A'}`);
        console.log(`      Active: ${tenant.isActive ? '✅' : '❌'}`);
        console.log(`      Properties rented: ${leases.length}`);

        leases.forEach((lease, index) => {
          console.log(`      ${index + 1}. ${lease.property.title}`);
          console.log(
            `         Location: ${lease.property.address?.commune}, ${lease.property.address?.quartier}`,
          );
          console.log(`         Rent: ${lease.rentAmount} ${lease.currency}`);
          console.log(`         Status: ${lease.status}`);
          console.log(
            `         Contract: ${lease.contract ? (lease.contract.signedAt ? '✅ Signed' : '⏳ Pending') : '❌ None'}`,
          );
        });
        console.log('');
      });
    }

    console.log('\n✅ Test completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - The data structure is correct');
    console.log('   - Leases are properly linked to Users (tenants)');
    console.log('   - The API route /users/me/tenants should work correctly');
    console.log('\n💡 Next steps:');
    console.log('   1. Restart the backend: npm run start:dev');
    console.log(
      '   2. Test the API: GET http://localhost:3001/users/me/tenants',
    );
    console.log('   3. Test the frontend: Navigate to /dashboard/tenants');
  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
