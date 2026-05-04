# Instructions de Migration - Ajout des champs Property

## Étapes à suivre :

1. **Arrêter le serveur NestJS** (Ctrl+C dans le terminal où il tourne)

2. **Régénérer le client Prisma** :

   ```bash
   cd LogeMoi_BackEnd
   npx prisma generate
   ```

3. **Créer et appliquer la migration** :

   ```bash
   npx prisma migrate dev --name add_property_fields
   ```

4. **Redémarrer le serveur** :
   ```bash
   npm run start:dev
   ```

## Champs ajoutés au modèle Property :

- `beds` (Int?) - Nombre de lits
- `kitchens` (Int?) - Nombre de cuisines
- `livingRooms` (Int?) - Nombre de salons
- `otherRooms` (Int?) - Autres pièces
- `maxGuests` (Int?) - Nombre maximum d'invités
- `landSize` (Decimal?) - Superficie du terrain
- `commissionPercentage` (Decimal?) - Pourcentage de commission
- `discount` (Decimal?) - Réduction
- `paymentType` (String?) - Type de paiement
- `specialNotes` (String?) - Notes spéciales

## Champs ajoutés au modèle PropertyAddress :

- `province` (String?) - Province (défaut: "Kinshasa")
- `latitude` (Float?) - Latitude GPS
- `longitude` (Float?) - Longitude GPS

## Note :

Si vous obtenez une erreur "EPERM: operation not permitted", assurez-vous que :

- Le serveur NestJS est bien arrêté
- Aucun processus n'utilise les fichiers Prisma
- Vous avez les droits d'administrateur si nécessaire
