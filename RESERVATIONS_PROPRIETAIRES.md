# 📋 Système de Réservations pour Propriétaires

## ✅ Fonctionnalités Actuelles

### Backend (NestJS)

#### Service de Réservations (`booking.service.ts`)

La méthode `findAll()` filtre automatiquement les réservations selon le rôle de l'utilisateur :

```typescript
async findAll(userId?: string, userRole?: string) {
  let where: any = {};

  // Si l'utilisateur est propriétaire, afficher les réservations de ses biens
  if (userRole === 'owner') {
    where = {
      property: {
        userId: userId,
      },
    };
  }
  // Si l'utilisateur est locataire, afficher ses réservations
  else if (userRole === 'tenant') {
    where = {
      userId,
    };
  }
  // Admin voit toutes les réservations (pas de filtre)

  return this.prisma.booking.findMany({
    where,
    include: {
      property: { ... },
      user: { ... },
      tenant: true,
      validatedBy: { ... },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
```

**Résultat** :

- ✅ **Propriétaires** : Voient uniquement les réservations pour leurs biens
- ✅ **Locataires** : Voient uniquement leurs propres réservations
- ✅ **Admins** : Voient toutes les réservations

#### Controller de Réservations (`booking.controller.ts`)

```typescript
@Get()
findAll(
  @CurrentUser('userId') userId: string,
  @CurrentUser('role') userRole: string,
) {
  return this.bookingService.findAll(userId, userRole);
}
```

Le controller passe automatiquement le rôle de l'utilisateur au service.

### Frontend (Next.js)

#### Page des Réservations (`dashboard/reservations/page.tsx`)

La page détecte automatiquement le rôle de l'utilisateur :

```typescript
const { user } = useAuth();
const isAdmin = user?.role === 'admin';
const isOwner = user?.role === 'owner' || user?.role === 'admin';

useEffect(() => {
  if (isOwner) {
    // Les propriétaires et admins voient toutes les réservations (filtrées par le backend)
    loadAllBookings();
  } else {
    // Les locataires voient uniquement leurs réservations
    loadMyBookings();
  }
}, [isOwner]);

// Utiliser les bonnes réservations selon le rôle
const displayBookings = isOwner ? bookings : myBookings;
```

**Résultat** :

- ✅ **Propriétaires** : Appellent `loadAllBookings()` qui récupère les réservations de leurs biens
- ✅ **Locataires** : Appellent `loadMyBookings()` qui récupère leurs propres réservations
- ✅ **Admins** : Appellent `loadAllBookings()` qui récupère toutes les réservations

#### Onglets de la Page

La page affiche deux onglets :

1. **"Biens en attente"** : Réservations avec statut `pending`
   - Affiche le nombre de réservations en attente
   - Affiche le revenu potentiel
   - Permet de confirmer ou rejeter les réservations (admin/propriétaire)

2. **"Biens confirmés"** : Réservations avec statut `confirmed`
   - Affiche le nombre de réservations confirmées
   - Affiche le revenu total
   - Affiche le nombre total de nuits réservées

#### Statistiques Affichées

**Pour les Propriétaires** :

- ✅ Nombre de réservations en attente
- ✅ Revenu potentiel (si toutes confirmées)
- ✅ Nombre de réservations rejetées
- ✅ Nombre de réservations annulées
- ✅ Nombre de réservations confirmées
- ✅ Revenu total des réservations confirmées
- ✅ Nombre total de nuits réservées

#### Actions Disponibles

**Pour les Propriétaires** :

- ✅ Voir les détails d'une réservation
- ✅ Confirmer une réservation en attente
- ✅ Rejeter une réservation en attente
- ✅ Voir les informations du client (nom, email, photo)

**Pour les Admins** (en plus des actions propriétaires) :

- ✅ Supprimer une réservation
- ✅ Notification clignotante pour les réservations en attente

#### Affichage des Informations

**Pour chaque réservation, les propriétaires voient** :

- ✅ Photos du bien
- ✅ Titre du bien
- ✅ Localisation (quartier, commune)
- ✅ Caractéristiques (chambres, lits, salles de bain, cuisines)
- ✅ Dates de réservation (début et fin)
- ✅ Durée (nombre de nuits)
- ✅ Montant total
- ✅ Devise
- ✅ Statut de la réservation
- ✅ **Informations du client** :
  - Photo de profil
  - Nom complet (ou email si pas de nom)
  - Email
  - Téléphone

## 🎯 Flux de Validation pour Propriétaires

### 1. Réception d'une Nouvelle Réservation

Quand un locataire fait une réservation :

1. **Notification créée** pour le propriétaire du bien
2. **Notification créée** pour le locataire (confirmation de demande)
3. **Notification créée** pour tous les admins
4. **Réservation apparaît** dans l'onglet "Biens en attente" du propriétaire

### 2. Validation par le Propriétaire

Le propriétaire peut :

#### Option A : Confirmer la Réservation

1. Cliquer sur "Confirmer" dans le menu d'actions
2. **Modal de confirmation** s'affiche
3. Après confirmation :
   - ✅ Statut de la réservation → `confirmed`
   - ✅ Statut du bien → `reserved`
   - ✅ **Création automatique du bail (Lease)**
   - ✅ **Génération automatique du contrat PDF**
   - ✅ Notification envoyée au locataire
   - ✅ Notification envoyée aux admins
   - ✅ Réservation déplacée vers l'onglet "Biens confirmés"

#### Option B : Rejeter la Réservation

1. Cliquer sur "Rejeter" dans le menu d'actions
2. **Modal de confirmation** s'affiche
3. Après confirmation :
   - ✅ Statut de la réservation → `rejected`
   - ✅ Statut du bien → `available` (à nouveau disponible)
   - ✅ Notification envoyée au locataire
   - ✅ Notification envoyée aux admins
   - ✅ Réservation déplacée vers l'onglet "Rejetées"

### 3. Après Validation

**Si confirmée** :

- Le bail est créé automatiquement
- Le contrat PDF est généré automatiquement
- Le bien n'est plus disponible pour d'autres réservations
- Le locataire peut voir le contrat dans sa section "Contrats"

**Si rejetée** :

- Le bien redevient disponible
- D'autres locataires peuvent faire une réservation

## 📊 Comparaison : Propriétaire vs Locataire

| Fonctionnalité               | Propriétaire              | Locataire                   |
| ---------------------------- | ------------------------- | --------------------------- |
| Voir les réservations        | ✅ De ses biens           | ✅ Ses propres réservations |
| Voir les infos du client     | ✅ Oui                    | ❌ Non                      |
| Confirmer une réservation    | ✅ Oui                    | ❌ Non                      |
| Rejeter une réservation      | ✅ Oui                    | ❌ Non                      |
| Annuler une réservation      | ✅ Oui                    | ✅ Oui                      |
| Supprimer une réservation    | ❌ Non (admin uniquement) | ❌ Non (admin uniquement)   |
| Voir toutes les réservations | ❌ Non                    | ❌ Non                      |
| Notification clignotante     | ❌ Non (admin uniquement) | ❌ Non                      |

## 🔔 Notifications

### Pour les Propriétaires

**Nouvelle réservation** :

```
Titre: Nouvelle demande de réservation
Message: Une nouvelle demande de réservation a été faite pour votre bien "[Titre du bien]"
Type: booking_new
```

**Réservation confirmée** :

```
Titre: Bien réservé
Message: Votre bien "[Titre du bien]" a été réservé par [Email du client]
Type: property_booked
```

**Bien à nouveau disponible** :

```
Titre: Bien à nouveau disponible
Message: Votre bien "[Titre du bien]" est maintenant disponible suite au rejet/annulation de la réservation
Type: property_available
```

### Pour les Locataires

**Demande envoyée** :

```
Titre: Demande de réservation envoyée
Message: Votre demande de réservation pour "[Titre du bien]" a été envoyée au propriétaire
Type: booking_pending
```

**Réservation confirmée** :

```
Titre: Réservation confirmée
Message: Votre réservation pour "[Titre du bien]" a été confirmée
Type: booking_validated
```

**Réservation rejetée** :

```
Titre: Réservation rejetée
Message: Votre réservation pour "[Titre du bien]" a été rejetée
Type: booking_rejected
```

## 🎨 Interface Utilisateur

### Vue Grille (Grid)

Affiche les réservations sous forme de cartes avec :

- Carousel d'images du bien
- Badge de statut (en haut à gauche)
- Badge de prix (en haut à droite)
- Titre du bien
- Localisation
- Caractéristiques (chambres, lits, etc.)
- Bouton "En savoir plus"

### Vue Tableau (Table)

Affiche les réservations sous forme de tableau avec :

- Colonne "Propriété" (image + titre)
- Colonne "Client" (photo + nom) - **Propriétaires uniquement**
- Colonne "Dates" (début et fin)
- Colonne "Durée" (nombre de nuits)
- Colonne "Montant" (prix + devise)
- Colonne "Statut" (badge coloré)
- Colonne "Actions" (menu déroulant)

### Barre de Recherche

Permet de rechercher par :

- Titre du bien
- Commune
- Quartier
- Email du client
- Nom du client

## ✅ Conclusion

**Le système fonctionne déjà comme souhaité !**

Les propriétaires peuvent :

- ✅ Voir toutes les réservations de leurs biens
- ✅ Voir les réservations en attente de validation
- ✅ Voir les informations des clients
- ✅ Confirmer ou rejeter les réservations
- ✅ Recevoir des notifications pour chaque événement
- ✅ Voir les statistiques de leurs réservations

**Aucune modification n'est nécessaire !** 🎉

Le backend filtre automatiquement les réservations selon le rôle de l'utilisateur, et le frontend affiche les bonnes informations pour chaque type d'utilisateur.
