# Guide d'Authentification - Niveau Senior

## 🎯 Améliorations Implémentées

### 1. **Gestion Avancée des Tokens**
- ✅ **Refresh Token Rotation** : Les refresh tokens sont automatiquement renouvelés à chaque utilisation
- ✅ **Token Blacklisting** : Système de révocation des tokens en base de données
- ✅ **Détection de Réutilisation** : Si un refresh token révoqué est réutilisé, tous les tokens de la famille sont révoqués (protection contre le vol de token)
- ✅ **Durée de vie courte** : Access tokens valides 15 minutes, refresh tokens 30 jours
- ✅ **Stockage sécurisé** : Tokens stockés dans des cookies HttpOnly

### 2. **Sécurité Renforcée**
- ✅ **Protection contre les attaques par force brute** : 
  - Maximum 5 tentatives de connexion échouées
  - Verrouillage du compte pendant 15 minutes après 5 échecs
- ✅ **Rate Limiting** : 
  - Login: 5 requêtes/minute
  - Register: 3 requêtes/minute
  - Forgot Password: 3 requêtes/5 minutes
  - Refresh: 10 requêtes/minute
  - Global: 100 requêtes/minute
- ✅ **Validation forte des mots de passe** :
  - Minimum 8 caractères
  - Au moins une majuscule, une minuscule, un chiffre et un caractère spécial
- ✅ **Headers de sécurité** : Helmet configuré
- ✅ **CORS sécurisé** : Configuration stricte avec credentials

### 3. **Gestion des Sessions**
- ✅ **Multi-device support** : Tracking des tokens par appareil (User-Agent + IP)
- ✅ **Logout sélectif** : Déconnexion d'un seul appareil
- ✅ **Logout global** : Déconnexion de tous les appareils
- ✅ **Invalidation automatique** : Tous les tokens révoqués lors du changement de mot de passe

### 4. **Détection de Compromission**
- ✅ **Password Changed At** : Timestamp du dernier changement de mot de passe
- ✅ **Validation des tokens** : Les tokens émis avant un changement de mot de passe sont automatiquement invalides
- ✅ **Révocation en cascade** : Détection de réutilisation de token révoqué = révocation de toute la famille

### 5. **Architecture Professionnelle**
- ✅ **Séparation des responsabilités** : Services dédiés (AuthService, RefreshTokenService)
- ✅ **Stratégies JWT multiples** : Stratégies séparées pour access et refresh tokens
- ✅ **Guards personnalisés** : Gestion d'erreurs détaillée
- ✅ **Decorators custom** : @Public(), @CurrentUser()
- ✅ **DTOs validés** : Validation stricte avec class-validator
- ✅ **Constants centralisés** : Configuration dans un fichier dédié

## 📋 Nouveaux Endpoints

### Authentification
```
POST /auth/register          - Inscription
POST /auth/login             - Connexion
POST /auth/refresh           - Renouvellement des tokens
POST /auth/logout            - Déconnexion (appareil actuel)
POST /auth/logout-all        - Déconnexion (tous les appareils)
GET  /auth/me                - Profil utilisateur
```

### Gestion du mot de passe
```
POST /auth/forgot-password   - Demande de réinitialisation
POST /auth/reset-password    - Réinitialisation avec token
POST /auth/change-password   - Changement de mot de passe (authentifié)
```

## 🔐 Schéma de Base de Données

### Modèle User (mis à jour)
```prisma
model User {
  passwordChangedAt     DateTime?
  failedLoginAttempts   Int       @default(0)
  lockedUntil          DateTime?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  refreshTokens        RefreshToken[]
}
```

### Nouveau Modèle RefreshToken
```prisma
model RefreshToken {
  id           String    @id @default(uuid())
  userId       String
  token        String    @unique
  expiresAt    DateTime
  isRevoked    Boolean   @default(false)
  replacedBy   String?
  userAgent    String?
  ipAddress    String?
  createdAt    DateTime  @default(now())
  revokedAt    DateTime?
  user         User      @relation(...)
}
```

## 🚀 Migration de la Base de Données

```bash
# Générer la migration
npx prisma migrate dev --name add_refresh_token_and_security_fields

# Appliquer en production
npx prisma migrate deploy
```

## 📝 Variables d'Environnement Requises

Ajoutez ces variables dans votre `.env` :

```env
JWT_SECRET="votre-secret-super-securise-changez-moi"
JWT_REFRESH_SECRET="un-autre-secret-different-du-premier"
FRONTEND_URL="http://localhost:3000"
NODE_ENV=development
```

## 🔄 Flow d'Authentification

### 1. Login
```
Client → POST /auth/login
  ↓
Vérification compte non verrouillé
  ↓
Validation email/password
  ↓
Génération access token (15min) + refresh token (30j)
  ↓
Stockage refresh token en DB avec metadata
  ↓
Cookies HttpOnly envoyés au client
```

### 2. Refresh Token
```
Client → POST /auth/refresh (avec refresh token cookie)
  ↓
Validation du refresh token en DB
  ↓
Vérification non révoqué + non expiré
  ↓
Génération nouveaux tokens
  ↓
Révocation ancien refresh token
  ↓
Stockage nouveau refresh token (rotation)
  ↓
Nouveaux cookies envoyés
```

### 3. Détection de Réutilisation
```
Client utilise un refresh token révoqué
  ↓
Système détecte isRevoked = true
  ↓
Révocation de tous les tokens de la famille
  ↓
Utilisateur doit se reconnecter
```

## 🛡️ Bonnes Pratiques Implémentées

1. **Tokens courts** : Access tokens de 15 minutes seulement
2. **Rotation systématique** : Refresh tokens renouvelés à chaque utilisation
3. **Cookies sécurisés** : HttpOnly, Secure (en prod), SameSite
4. **Validation stricte** : Tous les DTOs validés avec class-validator
5. **Rate limiting** : Protection contre les attaques par force brute
6. **Logging implicite** : Metadata (IP, User-Agent) stockées
7. **Révocation en cascade** : Protection contre le vol de tokens
8. **Password policy** : Mots de passe forts obligatoires
9. **Account locking** : Verrouillage temporaire après échecs
10. **Clean architecture** : Code modulaire et testable

## 🧪 Tests Recommandés

### Test de sécurité
1. Tenter 6 connexions échouées → Vérifier le verrouillage
2. Utiliser un token expiré → Vérifier le rejet
3. Réutiliser un refresh token → Vérifier la révocation en cascade
4. Changer le mot de passe → Vérifier l'invalidation des anciens tokens

### Test fonctionnel
1. Register → Login → Refresh → Logout
2. Forgot Password → Reset Password → Login
3. Change Password → Vérifier déconnexion automatique
4. Logout All → Vérifier révocation de tous les tokens

## 📊 Monitoring

Surveillez ces métriques :
- Nombre de tentatives de connexion échouées
- Taux de refresh token réutilisés (indicateur d'attaque)
- Nombre de comptes verrouillés
- Durée moyenne des sessions

## 🔧 Maintenance

### Nettoyage des tokens expirés
Le service `RefreshTokenService` inclut une méthode `cleanupExpiredTokens()`.
Configurez un cron job pour l'exécuter quotidiennement :

```typescript
// Dans un service dédié
@Cron('0 0 * * *') // Tous les jours à minuit
async cleanupTokens() {
  await this.refreshTokenService.cleanupExpiredTokens();
}
```

## 🎓 Concepts Avancés Utilisés

1. **JWT Strategy Pattern** : Stratégies séparées pour différents types de tokens
2. **Guard Composition** : Guards globaux avec exceptions via @Public()
3. **Decorator Pattern** : @CurrentUser() pour extraction propre de l'utilisateur
4. **Repository Pattern** : RefreshTokenService comme repository
5. **Token Rotation** : Sécurité renforcée contre le vol
6. **Family Revocation** : Détection et réponse aux attaques

---

**Note** : Cette implémentation suit les standards OWASP et les meilleures pratiques de l'industrie pour l'authentification JWT.
