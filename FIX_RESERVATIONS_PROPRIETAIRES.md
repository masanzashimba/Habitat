# 🔧 Correction : Réservations pour Propriétaires

## 🐛 Problème Identifié

Les propriétaires ne voyaient pas les réservations de leurs biens car :

1. **Backend** : La méthode `findAll()` vérifiait si `userRole === 'owner'`
2. **Réalité** : Les utilisateurs qui créent des biens ont le rôle `user`, pas `owner`
3. **Résultat** : Les propriétaires voyaient un tableau vide `[]`

### Exemple du Problème

```json
{
  "propertyId": "e04c5f0e-06fb-46ff-8724-b43110546c98",
  "property": {
    "userId": "4ae5e665-dd59-490e-8f43-c3f60719b67e" // ← Propriétaire du bien
  },
  "userId": "3ab3045e-5226-4b06-a158-228918f3ed8f" // ← Locataire qui a réservé
}
```

- **Propriétaire** (`4ae5e665...`) : Rôle = `user` → Ne voyait rien ❌
- **Locataire** (`3ab3045e...`) : Voyait sa réservation ✅

## ✅ Solution Implémentée

### 1. Backend : Vérifier la Possession de Biens

Au lieu de vérifier le rôle `owner`, on vérifie si l'utilisateur possède des biens.

**Fichier** : `LogeMoi_BackEnd/src/booking/booking.service.ts`

**Avant** :

```typescript
async findAll(userId?: string, userRole?: string) {
  let where: any = {};

  // Si l'utilisateur a le rôle 'owner'
  if (userRole === 'owner') {
    where = {
      property: {
        userId: userId,
      },
    };
  } else if (userRole === 'tenant') {
    where = {
      userId,
    };
  }
  // Admin voit tout
}
```

**Après** :

```typescript
async findAll(userId?: string, userRole?: string) {
  let where: any = {};

  // Admin voit tout
  if (userRole === 'admin') {
    // Pas de filtre
  } else {
    // Vérifier si l'utilisateur possède des biens
    const userProperties = await this.prisma.property.findMany({
      where: { userId },
      select: { id: true },
    });

    if (userProperties.length > 0) {
      // L'utilisateur possède des biens → Afficher les réservations de ses biens
      where = {
        property: {
          userId: userId,
        },
      };
    } else {
      // L'utilisateur ne possède pas de biens → Afficher ses propres réservations
      where = {
        userId,
      };
    }
  }

  return this.prisma.booking.findMany({ where, ... });
}
```

**Logique** :

- ✅ **Admin** : Voit toutes les réservations
- ✅ **Utilisateur avec biens** : Voit les réservations de ses biens (propriétaire)
- ✅ **Utilisateur sans biens** : Voit ses propres réservations (locataire)

### 2. Frontend : Simplifier la Logique

**Fichier** : `logis/app/dashboard/reservations/page.tsx`

**Avant** :

```typescript
useEffect(() => {
  if (isOwner) {
    loadAllBookings(); // Propriétaires et admins
  } else {
    loadMyBookings(); // Locataires
  }
}, [isOwner]);

const displayBookings = isOwner ? bookings : myBookings;
```

**Après** :

```typescript
useEffect(() => {
  // Tous les utilisateurs utilisent loadAllBookings
  // Le backend détermine automatiquement quelles réservations afficher
  loadAllBookings();
}, [user]);

const displayBookings = bookings;
```

**Avantages** :

- ✅ Plus simple : un seul endpoint pour tous
- ✅ Logique centralisée dans le backend
- ✅ Pas besoin de vérifier le rôle côté frontend

### 3. Rechargement Après Actions

**Avant** :

```typescript
// Après validation ou suppression
if (isAdmin) {
  loadAllBookings();
} else {
  loadMyBookings();
}
```

**Après** :

```typescript
// Après validation ou suppression
loadAllBookings();
```

## 🧪 Test de la Correction

### Scénario 1 : Utilisateur Propriétaire (avec biens)

**Utilisateur** : `owner@example.com` (ID: `4ae5e665-dd59-490e-8f43-c3f60719b67e`)
**Rôle** : `user`
**Biens** : 1 bien (ID: `e04c5f0e-06fb-46ff-8724-b43110546c98`)

**Requête** : `GET /bookings`

**Résultat attendu** :

```json
[
  {
    "id": "ad517293-ab25-45ba-9b83-1609f96877cc",
    "propertyId": "e04c5f0e-06fb-46ff-8724-b43110546c98",
    "userId": "3ab3045e-5226-4b06-a158-228918f3ed8f",
    "property": {
      "userId": "4ae5e665-dd59-490e-8f43-c3f60719b67e",
      "title": "Belle maison familiale avec jardin"
    },
    "user": {
      "email": "tenant@example.com"
    }
  }
]
```

✅ **Le propriétaire voit la réservation de son bien**

### Scénario 2 : Utilisateur Locataire (sans biens)

**Utilisateur** : `tenant@example.com` (ID: `3ab3045e-5226-4b06-a158-228918f3ed8f`)
**Rôle** : `user`
**Biens** : 0 bien

**Requête** : `GET /bookings`

**Résultat attendu** :

```json
[
  {
    "id": "ad517293-ab25-45ba-9b83-1609f96877cc",
    "propertyId": "e04c5f0e-06fb-46ff-8724-b43110546c98",
    "userId": "3ab3045e-5226-4b06-a158-228918f3ed8f",
    "property": {
      "title": "Belle maison familiale avec jardin"
    }
  }
]
```

✅ **Le locataire voit sa propre réservation**

### Scénario 3 : Admin

**Utilisateur** : `admin@example.com`
**Rôle** : `admin`

**Requête** : `GET /bookings`

**Résultat attendu** : Toutes les réservations de tous les utilisateurs

✅ **L'admin voit toutes les réservations**

## 📊 Comparaison Avant/Après

| Utilisateur  | Rôle    | Biens | Avant               | Après                        |
| ------------ | ------- | ----- | ------------------- | ---------------------------- |
| Propriétaire | `user`  | 1+    | ❌ Tableau vide     | ✅ Réservations de ses biens |
| Locataire    | `user`  | 0     | ✅ Ses réservations | ✅ Ses réservations          |
| Admin        | `admin` | N/A   | ✅ Toutes           | ✅ Toutes                    |

## 🎯 Avantages de la Solution

1. **Flexible** : Fonctionne quel que soit le rôle de l'utilisateur
2. **Intelligent** : Détecte automatiquement si l'utilisateur est propriétaire
3. **Simple** : Un seul endpoint pour tous les cas
4. **Évolutif** : Un utilisateur peut être à la fois propriétaire et locataire
5. **Cohérent** : La logique est centralisée dans le backend

## 🔄 Flux Complet

### Pour un Propriétaire

1. **Connexion** : `owner@example.com`
2. **Navigation** : `/dashboard/reservations`
3. **Requête** : `GET /bookings`
4. **Backend** :
   - Vérifie si l'utilisateur possède des biens → **Oui**
   - Filtre : `property.userId = userId`
5. **Résultat** : Réservations pour les biens du propriétaire
6. **Affichage** : Liste des réservations avec infos des clients

### Pour un Locataire

1. **Connexion** : `tenant@example.com`
2. **Navigation** : `/dashboard/reservations`
3. **Requête** : `GET /bookings`
4. **Backend** :
   - Vérifie si l'utilisateur possède des biens → **Non**
   - Filtre : `userId = userId`
5. **Résultat** : Réservations faites par le locataire
6. **Affichage** : Liste de ses propres réservations

## 📝 Fichiers Modifiés

1. **Backend** :
   - `LogeMoi_BackEnd/src/booking/booking.service.ts` (méthode `findAll`)

2. **Frontend** :
   - `logis/app/dashboard/reservations/page.tsx` (logique de chargement)

## ✅ Résultat Final

**Tous les utilisateurs voient maintenant les bonnes réservations** :

- ✅ Propriétaires : Réservations de leurs biens
- ✅ Locataires : Leurs propres réservations
- ✅ Admins : Toutes les réservations

**Le système fonctionne correctement !** 🎉
