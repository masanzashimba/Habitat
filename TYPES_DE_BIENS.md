# 📋 Types de Biens - Guide Complet

## 🏠 Types de Propriétés Disponibles

### 1. **APARTMENT** (Appartement)

- **Description** : Appartement en copropriété
- **Usage** : À louer ou à vendre
- **Champs requis** :
  - ✅ Chambres (bedrooms)
  - ✅ Lits (beds)
  - ✅ Salles de bain (bathrooms)
  - ✅ Équipements (amenities)
- **Champs optionnels** :
  - Cuisines (kitchens)
  - Salons (livingRooms)
  - Autres pièces (otherRooms)
  - Superficie (landSize)

### 2. **HOUSE** (Maison)

- **Description** : Maison individuelle
- **Usage** : À louer ou à vendre
- **Champs requis** :
  - ✅ Chambres (bedrooms)
  - ✅ Lits (beds)
  - ✅ Salles de bain (bathrooms)
  - ✅ Équipements (amenities)
- **Champs optionnels** :
  - Cuisines (kitchens)
  - Salons (livingRooms)
  - Autres pièces (otherRooms)
  - Superficie du terrain (landSize)

### 3. **VILLA** (Villa)

- **Description** : Villa de luxe
- **Usage** : À louer ou à vendre
- **Champs requis** :
  - ✅ Chambres (bedrooms)
  - ✅ Lits (beds)
  - ✅ Salles de bain (bathrooms)
  - ✅ Équipements (amenities)
- **Champs optionnels** :
  - Cuisines (kitchens)
  - Salons (livingRooms)
  - Autres pièces (otherRooms)
  - Superficie du terrain (landSize)

### 4. **BUILDING** (Bâtiment)

- **Description** : Immeuble ou bâtiment commercial
- **Usage** : À louer ou à vendre
- **Champs requis** :
  - **À louer** : Chambres, lits, salles de bain, équipements
  - **À vendre** : ❌ Pas de chambres/lits/salles de bain requis
- **Champs optionnels** :
  - Superficie (landSize)
  - Nombre d'étages
  - Nombre d'unités

### 5. **LAND** (Parcelle) ⭐

- **Description** : Terrain ou parcelle
- **Usage** : **Uniquement à vendre**
- **Champs requis** :
  - ❌ Pas de chambres
  - ❌ Pas de lits
  - ❌ Pas de salles de bain
  - ❌ Pas d'équipements
- **Champs optionnels** :
  - ✅ Superficie (landSize) - **Recommandé**
  - ✅ Coordonnées GPS (latitude, longitude) - **Recommandé**
  - Notes spéciales (specialNotes)

## 📊 Tableau Comparatif

| Type              | À Louer | À Vendre | Chambres | Lits | Salles de bain | Équipements | Superficie |
| ----------------- | ------- | -------- | -------- | ---- | -------------- | ----------- | ---------- |
| APARTMENT         | ✅      | ✅       | ✅       | ✅   | ✅             | ✅          | ⚪         |
| HOUSE             | ✅      | ✅       | ✅       | ✅   | ✅             | ✅          | ⚪         |
| VILLA             | ✅      | ✅       | ✅       | ✅   | ✅             | ✅          | ⚪         |
| BUILDING (louer)  | ✅      | ❌       | ✅       | ✅   | ✅             | ✅          | ⚪         |
| BUILDING (vendre) | ❌      | ✅       | ❌       | ❌   | ❌             | ⚪          | ⚪         |
| LAND              | ❌      | ✅       | ❌       | ❌   | ❌             | ❌          | ✅         |

**Légende** :

- ✅ Requis
- ⚪ Optionnel
- ❌ Non applicable

## 💰 Champs Financiers

### Pour les Locations (A_LOUER)

- **Prix** : Montant du loyer
- **Unité de prix** : PER_MONTH (par mois)
- **Mois de garantie** : `securityDepositMonths` (ex: 1, 2, 3 mois)
- **Mois de commission** : `commissionMonths` (ex: 1 mois)

### Pour les Ventes (A_VENDRE)

- **Prix** : Prix de vente
- **Unité de prix** : TOTAL (prix total)
- **Pourcentage de commission** : `commissionPercentage` (ex: 5%, 10%)
- **Réduction** : `discount` (optionnel)

## 📍 Champs d'Adresse

### Obligatoires

- ✅ `commune` : Commune (ex: Gombe, Ngaliema)
- ✅ `quartier` : Quartier (ex: Résidentiel, Commercial)
- ✅ `avenue` : Avenue ou rue (ex: Avenue de la Paix)

### Optionnels

- ⚪ `number` : Numéro de la propriété (ex: 123)
- ⚪ `city` : Ville (défaut: Kinshasa)
- ⚪ `province` : Province (défaut: Kinshasa)
- ⚪ `latitude` : Latitude GPS (ex: -4.3276)
- ⚪ `longitude` : Longitude GPS (ex: 15.3136)

## 🖼️ Images

### Règles

- **Minimum** : 3 images
- **Maximum** : 10 images
- **Taille max** : 5MB par image
- **Formats acceptés** : JPEG, JPG, PNG, WEBP
- **Première image** : Définie comme image principale (`isPrimary: true`)

## 🔄 Mapping Frontend → Backend

### Types de Propriété

```typescript
Frontend (minuscule) → Backend (MAJUSCULE)
--------------------------------
house                → HOUSE
apartment            → APARTMENT
villa                → VILLA
building             → BUILDING
land                 → LAND
```

### Unités de Prix

```typescript
Frontend → Backend
------------------
day      → PER_NIGHT
week     → PER_WEEK
month    → PER_MONTH
year     → PER_YEAR
total    → TOTAL
```

### Purpose (Usage)

```typescript
Frontend → Backend
------------------
A_LOUER  → A_LOUER
A_VENDRE → A_VENDRE
```

## ✅ Validation

### Titre

- Minimum : 5 caractères
- Maximum : 100 caractères
- Obligatoire

### Description

- Minimum : 20 caractères
- Obligatoire

### Prix

- Doit être > 0
- Maximum : 1 000 000 000
- Obligatoire

### Chambres (si applicable)

- Minimum : 1
- Maximum : 20

### Salles de bain (si applicable)

- Minimum : 1
- Maximum : 10

### Lits (si applicable)

- Minimum : 1
- Maximum : 50

## 🎯 Cas d'Usage

### Créer un Appartement à Louer

```json
{
  "title": "Appartement 2 chambres à Gombe",
  "description": "Bel appartement moderne...",
  "propertyType": "apartment",
  "purpose": "A_LOUER",
  "price": 800,
  "currency": "USD",
  "bedrooms": 2,
  "beds": 2,
  "bathrooms": 1,
  "securityDepositMonths": 2,
  "commissionMonths": 1,
  "amenities": ["WiFi", "Climatisation", "Parking"]
}
```

### Créer une Maison à Vendre

```json
{
  "title": "Maison 4 chambres à Ngaliema",
  "description": "Grande maison familiale...",
  "propertyType": "house",
  "purpose": "A_VENDRE",
  "price": 150000,
  "currency": "USD",
  "bedrooms": 4,
  "beds": 4,
  "bathrooms": 3,
  "landSize": 800,
  "commissionPercentage": 5,
  "amenities": ["Jardin", "Garage", "Piscine"]
}
```

### Créer une Parcelle à Vendre ⭐

```json
{
  "title": "Parcelle 500m² à Gombe",
  "description": "Parcelle viabilisée...",
  "propertyType": "land",
  "purpose": "A_VENDRE",
  "price": 50000,
  "currency": "USD",
  "landSize": 500,
  "commissionPercentage": 5,
  "address": {
    "commune": "Gombe",
    "quartier": "Résidentiel",
    "avenue": "Avenue de la Paix",
    "number": "123",
    "latitude": -4.3276,
    "longitude": 15.3136
  }
}
```

### Créer un Bâtiment à Vendre

```json
{
  "title": "Immeuble commercial à Kinshasa",
  "description": "Immeuble de 5 étages...",
  "propertyType": "building",
  "purpose": "A_VENDRE",
  "price": 500000,
  "currency": "USD",
  "landSize": 1200,
  "commissionPercentage": 3,
  "specialNotes": "5 étages, 20 bureaux"
}
```

## 🚀 Flux de Création

### Pour une Parcelle (LAND)

1. **Step 1** : Sélectionner "À vendre"
2. **Step 2** : Sélectionner "Parcelle"
3. **Step 3** : Remplir titre et description
4. **Step 4** : Définir prix et devise
5. **Step 5** : Remplir l'adresse complète
6. **Step 6** : ⏭️ **SKIP** (pas de chambres/lits)
7. **Step 7** : ⏭️ **SKIP** (pas d'équipements)
8. **Step 8** : Ajouter minimum 3 photos
9. **Step 9** : Vérifier et publier

### Pour un Appartement/Maison/Villa

1. **Step 1** : Sélectionner "À louer" ou "À vendre"
2. **Step 2** : Sélectionner le type (si vente)
3. **Step 3** : Remplir titre et description
4. **Step 4** : Définir prix et devise
5. **Step 5** : Remplir l'adresse complète
6. **Step 6** : ✅ Définir chambres, lits, salles de bain
7. **Step 7** : ✅ Sélectionner les équipements
8. **Step 8** : Ajouter minimum 3 photos
9. **Step 9** : Vérifier et publier

## 📝 Notes Importantes

1. **Parcelles** : Uniquement à vendre, pas de chambres/lits/équipements
2. **Bâtiments en vente** : Pas de chambres/lits requis
3. **Superficie** : Recommandée pour parcelles et maisons
4. **GPS** : Recommandé pour toutes les propriétés
5. **Commission** : Pourcentage pour ventes, mois pour locations
6. **Images** : Minimum 3, première image = image principale

## 🎉 Résumé

Le système supporte **5 types de propriétés** avec des règles de validation adaptées à chaque type. Les parcelles ont un traitement spécial car elles ne nécessitent pas de chambres, lits, salles de bain ou équipements.

**Tous les types sont maintenant opérationnels !** ✅
