import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTenantAccess() {
  console.log("🧪 Test d'accès aux contrats pour les tenants\n");
  console.log('='.repeat(60));

  try {
    // 1. Récupérer tous les utilisateurs tenants
    const tenantUsers = await prisma.user.findMany({
      where: { role: 'tenant' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    console.log(`\n📊 ${tenantUsers.length} utilisateur(s) tenant trouvé(s)\n`);

    for (const user of tenantUsers) {
      console.log('─'.repeat(60));
      console.log(`\n👤 Utilisateur: ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   ID: ${user.id}`);

      // 2. Trouver le tenant associé
      const tenant = await prisma.tenant.findFirst({
        where: { userId: user.id },
        include: {
          leases: {
            include: {
              contract: true,
              property: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      });

      if (!tenant) {
        console.log(`   ❌ Aucun tenant associé à cet utilisateur`);
        continue;
      }

      console.log(
        `\n   ✅ Tenant trouvé: ${tenant.firstName} ${tenant.lastName}`,
      );
      console.log(`      Tenant ID: ${tenant.id}`);
      console.log(`      Tenant userId: ${tenant.userId}`);

      // 3. Vérifier les leases
      if (tenant.leases.length === 0) {
        console.log(`\n   ⚠️ Aucun bail (lease) pour ce tenant`);
        continue;
      }

      console.log(`\n   📋 ${tenant.leases.length} bail(s) trouvé(s):`);

      for (const lease of tenant.leases) {
        console.log(`\n      🏠 Propriété: ${lease.property.title}`);
        console.log(`         Lease ID: ${lease.id}`);

        if (lease.contract) {
          console.log(`         ✅ Contrat: ${lease.contract.id}`);
          console.log(
            `            Signé: ${lease.contract.signedAt ? '✅ Oui' : '❌ Non'}`,
          );
          console.log(
            `            Créé le: ${lease.contract.createdAt.toLocaleDateString('fr-FR')}`,
          );
        } else {
          console.log(`         ⚠️ Aucun contrat pour ce bail`);
        }
      }

      // 4. Tester le filtre utilisé dans le service
      const contractsViaFilter = await prisma.contract.findMany({
        where: {
          lease: {
            tenant: {
              userId: user.id,
            },
          },
        },
        include: {
          lease: {
            include: {
              property: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      });

      console.log(
        `\n   🔍 Test du filtre service: ${contractsViaFilter.length} contrat(s) trouvé(s)`,
      );

      if (contractsViaFilter.length > 0) {
        console.log(`      ✅ Le tenant PEUT voir ses contrats`);
      } else if (tenant.leases.some((l) => l.contract)) {
        console.log(`      ❌ Le tenant NE PEUT PAS voir ses contrats`);
        console.log(`      ⚠️ Problème d'association tenant.userId`);
      } else {
        console.log(`      ℹ️ Aucun contrat créé pour ce tenant`);
      }
    }

    // 5. Statistiques globales
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 STATISTIQUES GLOBALES\n');

    const totalTenants = await prisma.tenant.count();
    const tenantsWithUserId = await prisma.tenant.count({
      where: { userId: { not: null } },
    });
    const tenantsWithoutUserId = totalTenants - tenantsWithUserId;

    console.log(`Total tenants: ${totalTenants}`);
    console.log(
      `Tenants associés: ${tenantsWithUserId} (${((tenantsWithUserId / totalTenants) * 100).toFixed(1)}%)`,
    );
    console.log(
      `Tenants non associés: ${tenantsWithoutUserId} (${((tenantsWithoutUserId / totalTenants) * 100).toFixed(1)}%)`,
    );

    const totalContracts = await prisma.contract.count();
    const contractsWithTenantUserId = await prisma.contract.count({
      where: {
        lease: {
          tenant: {
            userId: { not: null },
          },
        },
      },
    });

    console.log(`\nTotal contrats: ${totalContracts}`);
    console.log(
      `Contrats accessibles aux tenants: ${contractsWithTenantUserId} (${((contractsWithTenantUserId / totalContracts) * 100).toFixed(1)}%)`,
    );
    console.log(
      `Contrats NON accessibles: ${totalContracts - contractsWithTenantUserId} (${(((totalContracts - contractsWithTenantUserId) / totalContracts) * 100).toFixed(1)}%)`,
    );

    // 6. Recommandations
    console.log('\n' + '='.repeat(60));
    console.log('\n💡 RECOMMANDATIONS\n');

    if (tenantsWithoutUserId > 0) {
      console.log(
        `⚠️ ${tenantsWithoutUserId} tenant(s) sans userId détecté(s)`,
      );
      console.log(
        `   Action: Exécuter le script de migration associate_tenants_to_users.sql`,
      );
    }

    if (totalContracts - contractsWithTenantUserId > 0) {
      console.log(
        `⚠️ ${totalContracts - contractsWithTenantUserId} contrat(s) non accessible(s) aux tenants`,
      );
      console.log(
        `   Action: Vérifier que tous les tenants ont un userId valide`,
      );
    }

    if (
      tenantsWithoutUserId === 0 &&
      totalContracts - contractsWithTenantUserId === 0
    ) {
      console.log(
        `✅ Tout est OK ! Tous les tenants peuvent voir leurs contrats.`,
      );
    }

    console.log('\n' + '='.repeat(60));
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le test
testTenantAccess()
  .then(() => {
    console.log('\n✅ Test terminé avec succès\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test échoué:', error);
    process.exit(1);
  });
