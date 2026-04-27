# Guide de Migration - Ajout des champs pour Vente et Location

## Modifications apportées

### 1. Schéma Prisma (`prisma/schema.prisma`)

Ajout de deux nouveaux champs au modèle `Property` :

- `commissionPercentage` (Float?) : Pourcentage de commission pour les ventes (0-100%)
- `landSize` (Float?) : Superficie en m² pour parcelles et maisons

### 2. DTO Backend (`src/property/dto/create-property.dto.ts`)

Ajout des validations pour les nouveaux champs :

- `commissionPercentage` : Nombre optionnel, minimum 0
- `landSize` : Nombre optionnel, minimum 0

### 3. Frontend (`logis/app/hooks/usePropertyCreateSenior.ts`)

- Suppression de la validation `maxGuests` (champ invités retiré)
- Ajout de la logique conditionnelle pour :
  - Parcelles : pas de validation des capacités (chambres, lits, salles de bain)
  - Bâtiments en vente : pas de validation des capacités
  - Ventes : envoi de `commissionPercentage` au lieu de `commissionMonths`
  - Locations : envoi de `securityDepositMonths` et `commissionMonths`
- Ajout du support pour `landSize` (parcelles et maisons)

## Étapes pour appliquer la migration

### Backend

1. **Générer la migration Prisma** :

```bash
cd LogeMoi_BackEnd
npx prisma migrate dev --name add_commission_percentage_and_land_size
```

2. **Appliquer la migration** :

```bash
npx prisma migrate deploy
```

3. **Générer le client Prisma** :

```bash
npx prisma generate
```

4. **Redémarrer le serveur backend** :

```bash
npm run start:dev
```

### Frontend

1. **Installer les dépendances (si nécessaire)** :

```bash
cd logis
npm install
```

2. **Redémarrer le serveur de développement** :

```bash
npm run dev
```

## Flux de création de bien

### Pour les LOCATIONS (A_LOUER) :

1. Type de transaction : À louer
2. Présentation (titre, description)
3. Type de logement (maison, appartement, villa, etc.)
4. Tarifs : prix, période, devise, mois de garantie, mois de commission
5. Localisation (+ superficie pour maisons)
6. Informations principales (chambres, lits, salles de bain) - sauf pour parcelles
7. Équipements - sauf pour parcelles
8. Photos
9. Révision et publication

### Pour les VENTES (A_VENDRE) :

1. Type de transaction : À vendre
2. Type de bien (maison, bâtiment, parcelle, appartement, villa)
3. Présentation (titre, description)
4. Tarifs : prix de vente, devise, pourcentage de commission (0-100%)
5. Localisation (+ superficie pour parcelles et maisons)
6. Informations principales (chambres, lits, salles de bain) - **seulement pour maisons, villas, appartements**
7. Équipements - **seulement pour maisons, villas, appartements**
8. Photos
9. Révision et publication

## Champs conditionnels

### Parcelles (land) :

- ✅ Superficie obligatoire
- ❌ Pas d'informations principales (chambres, lits, etc.)
- ❌ Pas d'équipements
- ✅ Photos obligatoires (min 3)

### Bâtiments en vente (building + A_VENDRE) :

- ❌ Pas d'informations principales
- ✅ Équipements affichés
- ✅ Photos obligatoires (min 3)

### Maisons, Villas, Appartements :

- ✅ Informations principales obligatoires
- ✅ Équipements affichés
- ✅ Superficie pour maisons
- ✅ Photos obligatoires (min 3)

## Vérification

Après la migration, vérifiez que :

1. ✅ Le backend accepte les nouveaux champs `commissionPercentage` et `landSize`
2. ✅ Les validations fonctionnent correctement
3. ✅ La création de biens fonctionne pour les deux types (À louer / À vendre)
4. ✅ Les parcelles peuvent être créées sans informations principales
5. ✅ Les bâtiments en vente peuvent être créés sans informations principales
6. ✅ Le champ invités n'est plus requis ni affiché

## Rollback (en cas de problème)

Si vous devez annuler la migration :

```bash
cd LogeMoi_BackEnd
npx prisma migrate resolve --rolled-back add_commission_percentage_and_land_size
```

Puis supprimez manuellement les colonnes de la base de données :

```sql
ALTER TABLE "Property" DROP COLUMN "commissionPercentage";
ALTER TABLE "Property" DROP COLUMN "landSize";
```
