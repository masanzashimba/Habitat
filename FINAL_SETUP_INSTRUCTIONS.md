# 🚀 Instructions Finales - Configuration Complète

## ✅ Modifications Terminées

Tous les fichiers ont été mis à jour pour supporter les nouveaux champs de propriété.

### Fichiers Modifiés :

1. ✅ `prisma/schema.prisma` - Ajout de 13 nouveaux champs
2. ✅ `src/property/property.service.ts` - Mise à jour des méthodes create/update
3. ✅ `src/property/dto/create-property.dto.ts` - Déjà à jour
4. ✅ `src/property/dto/CreateAddressDto.ts` - Déjà à jour

---

## 🔧 Actions Requises (À FAIRE MAINTENANT)

### **ÉTAPE 1 : Arrêter le Serveur**

```bash
# Dans le terminal où le serveur tourne
Ctrl + C
```

### **ÉTAPE 2 : Régénérer le Client Prisma**

```bash
cd LogeMoi_BackEnd
npx prisma generate
```

**Si vous obtenez une erreur "EPERM"** :

```bash
# Vérifier les processus Node.js
tasklist | findstr node

# Tuer tous les processus Node.js si nécessaire
taskkill /F /IM node.exe

# Réessayer
npx prisma generate
```

### **ÉTAPE 3 : Créer et Appliquer la Migration**

```bash
npx prisma migrate dev --name add_property_fields
```

Cette commande va :

- ✅ Créer un fichier de migration SQL
- ✅ Appliquer les changements à votre base de données PostgreSQL
- ✅ Régénérer automatiquement le client Prisma

### **ÉTAPE 4 : Redémarrer le Serveur**

```bash
npm run start:dev
```

---

## 📊 Nouveaux Champs Disponibles

### Modèle `Property` :

#### Pièces et Capacité :

- `beds` (Int?) - Nombre de lits
- `kitchens` (Int?) - Nombre de cuisines
- `livingRooms` (Int?) - Nombre de salons
- `otherRooms` (Int?) - Autres pièces
- `maxGuests` (Int?) - Capacité maximale

#### Dimensions et Terrain :

- `landSize` (Decimal?) - Superficie du terrain en m²

#### Finances :

- `commissionPercentage` (Decimal?) - Pourcentage de commission (0-100)
- `discount` (Decimal?) - Réduction en pourcentage

#### Informations Complémentaires :

- `paymentType` (String?) - Type de paiement accepté
- `specialNotes` (String?) - Notes spéciales ou instructions

### Modèle `PropertyAddress` :

#### Localisation Avancée :

- `province` (String?) - Province (défaut: "Kinshasa")
- `latitude` (Float?) - Coordonnée GPS latitude
- `longitude` (Float?) - Coordonnée GPS longitude

---

## 🧪 Test de Création de Propriété

Après avoir suivi toutes les étapes, testez la création d'une propriété avec les nouveaux champs :

```json
{
  "title": "Belle maison familiale",
  "propertyType": "HOUSE",
  "price": 500,
  "currency": "USD",
  "bedrooms": 3,
  "beds": 4,
  "bathrooms": 2,
  "kitchens": 1,
  "livingRooms": 2,
  "maxGuests": 6,
  "landSize": 500.5,
  "commissionPercentage": 10,
  "discount": 5,
  "paymentType": "Mensuel",
  "specialNotes": "Jardin arboré inclus",
  "address": {
    "commune": "Gombe",
    "quartier": "Mama Mobutu",
    "avenue": "Avenue de la Paix",
    "number": "123",
    "city": "Kinshasa",
    "province": "Kinshasa",
    "latitude": -4.3276,
    "longitude": 15.3136
  },
  "amenities": ["wifi", "parking", "garden"]
}
```

---

## ⚠️ Troubleshooting

### Erreur : "EPERM: operation not permitted"

**Solution** : Le serveur NestJS est toujours en cours d'exécution

```bash
taskkill /F /IM node.exe
npx prisma generate
```

### Erreur : "Unknown argument `beds`"

**Solution** : Le client Prisma n'a pas été régénéré

```bash
npx prisma generate
npm run start:dev
```

### Erreur de Migration : "Column already exists"

**Solution** : La migration a déjà été appliquée partiellement

```bash
# Vérifier l'état des migrations
npx prisma migrate status

# Si nécessaire, réinitialiser (ATTENTION : perte de données)
npx prisma migrate reset
npx prisma migrate dev
```

### Erreur : "Cannot connect to database"

**Solution** : Vérifier que PostgreSQL est en cours d'exécution

```bash
# Vérifier le fichier .env
# DATABASE_URL="postgresql://user:password@localhost:5432/database"
```

---

## 📝 Notes Importantes

1. **Tous les nouveaux champs sont optionnels** - Vous n'êtes pas obligé de les remplir
2. **Les valeurs par défaut sont définies** - `province` = "Kinshasa", `city` = "Kinshasa"
3. **Validation automatique** - Les types sont vérifiés par les DTOs
4. **Transformation automatique** - Les nombres sont convertis automatiquement

---

## ✨ Prochaines Étapes

Après avoir terminé la configuration :

1. ✅ Tester la création d'une propriété
2. ✅ Tester la mise à jour d'une propriété
3. ✅ Vérifier que les nouveaux champs s'affichent correctement
4. ✅ Mettre à jour le frontend pour utiliser les nouveaux champs

---

## 🆘 Besoin d'Aide ?

Si vous rencontrez des problèmes :

1. Vérifiez que toutes les étapes ont été suivies dans l'ordre
2. Consultez les logs du serveur pour plus de détails
3. Vérifiez que PostgreSQL est bien démarré
4. Assurez-vous que le fichier `.env` est correctement configuré

---

**Bonne chance ! 🚀**
