const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserFields() {
  try {
    // Récupérer un utilisateur pour voir tous les champs disponibles
    const user = await prisma.user.findFirst({
      where: { email: 'simeonmasanza@gmail.com' },
    });

    if (user) {
      console.log("🔍 Structure de l'utilisateur dans la BD:");
      console.log(JSON.stringify(user, null, 2));

      console.log('\n📋 Champs disponibles:');
      Object.keys(user).forEach((key) => {
        console.log(`   - ${key}: ${typeof user[key]} = ${user[key]}`);
      });
    } else {
      console.log('❌ Aucun utilisateur trouvé');
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserFields();
