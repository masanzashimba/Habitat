import {
  PrismaClient,
  Role,
  Currency,
  PropertyStatus,
  PropertyPurpose,
  PropertyType,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  // Vérifier si l'admin existe déjà
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'simeonmasanza@gmail.com' },
  });

  if (existingAdmin) {
    console.log('👤 Utilisateur admin existe déjà');
    return;
  }

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash('Informatique12', 10);

  // Créer l'utilisateur admin
  const admin = await prisma.user.create({
    data: {
      email: 'simeonmasanza@gmail.com',
      password: hashedPassword,
      role: Role.admin,
      isActive: true,
      phone: '+243123456789',
    },
  });

  console.log('✅ Utilisateur admin créé avec succès:');
  console.log(`   📧 Email: ${admin.email}`);
  console.log(`   🔑 Rôle: ${admin.role}`);
  console.log(`   🆔 ID: ${admin.id}`);

  // Optionnel: Créer quelques données de test supplémentaires
  console.log('\n🏠 Création de données de test...');

  // Créer un propriétaire de test
  const ownerPassword = await bcrypt.hash('password123', 10);
  const owner = await prisma.user.create({
    data: {
      email: 'owner@example.com',
      password: ownerPassword,
      role: Role.owner,
      isActive: true,
      phone: '+243987654321',
    },
  });

  console.log(`✅ Propriétaire de test créé: ${owner.email}`);

  // Créer un utilisateur locataire de test
  const tenantUserPassword = await bcrypt.hash('password123', 10);
  const tenantUser = await prisma.user.create({
    data: {
      email: 'tenant@example.com',
      password: tenantUserPassword,
      role: Role.tenant,
      isActive: true,
      phone: '+243555666777',
    },
  });

  console.log(`✅ Utilisateur locataire de test créé: ${tenantUser.email}`);

  // Créer un profil de locataire lié à l'utilisateur
  const tenant = await prisma.tenant.create({
    data: {
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@example.com',
      phone: '+243111222333',
      ownerId: owner.id,
      userId: tenantUser.id,
    },
  });

  console.log(
    `✅ Profil locataire créé: ${tenant.firstName} ${tenant.lastName}`,
  );

  // Créer une propriété de test
  const property = await prisma.property.create({
    data: {
      userId: owner.id,
      slug: 'appartement-moderne-centre-ville-' + Date.now(),
      title: 'Appartement moderne au centre-ville',
      description:
        'Magnifique appartement moderne de 3 chambres avec vue sur la ville, situé au cœur de Kinshasa.',
      price: 800,
      currency: Currency.USD,
      status: PropertyStatus.available,
      purpose: PropertyPurpose.A_LOUER,
      propertyType: PropertyType.APARTMENT,
      bedrooms: 3,
      bathrooms: 2,
      maxGuests: 6,
    },
  });

  console.log(`✅ Propriété de test créée: ${property.title}`);

  // Créer une notification de test
  await prisma.notification.create({
    data: {
      userId: admin.id,
      title: 'Bienvenue sur LogeMoi',
      message: 'Votre compte administrateur a été créé avec succès.',
      type: 'welcome',
    },
  });

  console.log('✅ Notification de bienvenue créée');

  console.log('\n🎉 Seeding terminé avec succès!');
  console.log('\n📋 Comptes créés:');
  console.log('   👑 Admin: simeonmasanza@gmail.com / Informatique12');
  console.log('   🏠 Propriétaire: owner@example.com / password123');
  console.log('   🏠 Locataire: tenant@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
