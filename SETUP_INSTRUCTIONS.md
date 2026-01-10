# 🚀 Instructions de Configuration - Système d'Authentification Amélioré

## ✅ Ce qui a été fait

Votre système d'authentification a été complètement refactorisé au niveau senior avec :

### 1. **Nouveaux fichiers créés**
```
src/auth/
├── constants.ts                          # Constantes de configuration
├── refresh-token.service.ts              # Service de gestion des refresh tokens
├── decorators/
│   ├── public.decorator.ts               # Décorateur pour routes publiques
│   └── current-user.decorator.ts         # Décorateur pour extraire l'utilisateur
├── dto/
│   └── change-password.dto.ts            # DTO pour changement de mot de passe
├── guards/
│   ├── jwt-access.guard.ts               # Guard pour access tokens
│   └── jwt-refresh.guard.ts              # Guard pour refresh tokens
└── strategies/
    ├── jwt-access.strategy.ts            # Stratégie JWT pour access tokens
    └── jwt-refresh.strategy.ts           # Stratégie JWT pour refresh tokens
```

### 2. **Fichiers modifiés**
- ✅ `prisma/schema.prisma` - Ajout du modèle RefreshToken + champs de sécurité
- ✅ `src/auth/auth.service.ts` - Refonte complète avec toutes les améliorations
- ✅ `src/auth/auth.controller.ts` - Nouveaux endpoints et sécurité renforcée
- ✅ `src/auth/auth.module.ts` - Configuration des nouveaux providers
- ✅ `src/app.module.ts` - Rate limiting global
- ✅ `src/main.ts` - Helmet, validation globale, CORS sécurisé
- ✅ `src/auth/dto/*.dto.ts` - Validation renforcée

### 3. **Dépendances installées**
- ✅ `@nestjs/throttler` - Rate limiting
- ✅ `helmet` - En-têtes de sécurité HTTP

## 🔧 Configuration Requise

### 1. Variables d'environnement

Créez ou mettez à jour votre fichier `.env` avec ces variables **OBLIGATOIRES** :

```env
# JWT Secrets (CHANGEZ CES VALEURS !)
JWT_SECRET="votre-secret-jwt-super-securise-minimum-32-caracteres"
JWT_REFRESH_SECRET="un-autre-secret-different-du-premier-aussi-32-caracteres"

# Application
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"

# Database (déjà configuré)
DATABASE_URL="postgresql://..."

# Email (déjà configuré)
MAIL_HOST=...
MAIL_USER=...
MAIL_PASSWORD=...
```

⚠️ **IMPORTANT** : 
- `JWT_SECRET` et `JWT_REFRESH_SECRET` doivent être **différents**
- Utilisez des secrets longs et complexes (minimum 32 caractères)
- En production, utilisez des secrets générés aléatoirement

### 2. Génération de secrets sécurisés

Vous pouvez générer des secrets avec Node.js :

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Exécutez cette commande 2 fois pour obtenir 2 secrets différents.

## 🗄️ Base de Données

La base de données a été synchronisée automatiquement. Vérifiez que tout est OK :

```bash
# Vérifier le statut
npx prisma migrate status

# Si nécessaire, regénérer le client Prisma
npx prisma generate
```

## 🧪 Tester l'Authentification

### 1. Démarrer l'application

```bash
npm run dev
```

### 2. Tester les endpoints

#### Inscription
```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

#### Connexion
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!"
  }' \
  -c cookies.txt
```

#### Profil (avec cookies)
```bash
curl -X GET http://localhost:3001/auth/me \
  -b cookies.txt
```

#### Refresh Token
```bash
curl -X POST http://localhost:3001/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

#### Déconnexion
```bash
curl -X POST http://localhost:3001/auth/logout \
  -b cookies.txt
```

## 📋 Nouveaux Endpoints Disponibles

| Méthode | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| POST | `/auth/register` | Inscription | ❌ |
| POST | `/auth/login` | Connexion | ❌ |
| POST | `/auth/refresh` | Renouveler les tokens | ❌ (refresh token requis) |
| GET | `/auth/me` | Profil utilisateur | ✅ |
| POST | `/auth/logout` | Déconnexion (appareil actuel) | ✅ |
| POST | `/auth/logout-all` | Déconnexion (tous les appareils) | ✅ |
| POST | `/auth/forgot-password` | Demande réinitialisation | ❌ |
| POST | `/auth/reset-password` | Réinitialiser mot de passe | ❌ |
| POST | `/auth/change-password` | Changer mot de passe | ✅ |

## 🔐 Fonctionnalités de Sécurité

### Protection contre les attaques par force brute
- Maximum **5 tentatives** de connexion échouées
- Verrouillage du compte pendant **15 minutes** après 5 échecs
- Compteur réinitialisé après connexion réussie

### Rate Limiting
- **Login** : 5 requêtes/minute
- **Register** : 3 requêtes/minute
- **Forgot Password** : 3 requêtes/5 minutes
- **Refresh** : 10 requêtes/minute
- **Global** : 100 requêtes/minute

### Tokens
- **Access Token** : 15 minutes (stocké dans cookie `access_token`)
- **Refresh Token** : 30 jours (stocké dans cookie `refresh_token`)
- **Rotation automatique** : Nouveau refresh token à chaque utilisation
- **Révocation en cascade** : Détection de réutilisation = révocation de tous les tokens

### Validation des mots de passe
- Minimum **8 caractères**
- Au moins **1 majuscule**
- Au moins **1 minuscule**
- Au moins **1 chiffre**
- Au moins **1 caractère spécial** (@$!%*?&)

## 🛡️ Sécurité des Cookies

Les cookies sont configurés avec :
- `httpOnly: true` - Protection contre XSS
- `secure: true` (en production) - HTTPS uniquement
- `sameSite: 'strict'` (en production) - Protection CSRF
- `sameSite: 'lax'` (en développement) - Compatible localhost

## 🔄 Migration depuis l'ancien système

Si vous avez du code existant utilisant l'ancien système :

### Avant
```typescript
@UseGuards(JwtCookieGuard)
@Get('protected')
async protectedRoute(@Req() req: Request) {
  const user = req.user;
  return user;
}
```

### Après
```typescript
@UseGuards(JwtAccessGuard)  // ou simplement rien (guard global)
@Get('protected')
async protectedRoute(@CurrentUser() user: any) {
  return user;
}
```

### Routes publiques
```typescript
@Public()  // Ajouter ce décorateur
@Get('public')
async publicRoute() {
  return { message: 'Public' };
}
```

## 📊 Monitoring Recommandé

Surveillez ces métriques en production :
- Nombre de comptes verrouillés
- Taux de refresh tokens réutilisés (indicateur d'attaque)
- Nombre de tentatives de connexion échouées
- Durée moyenne des sessions

## 🧹 Maintenance

### Nettoyage des tokens expirés

Ajoutez un cron job pour nettoyer les tokens expirés :

```typescript
// Dans un service dédié
import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RefreshTokenService } from './auth/refresh-token.service';

@Injectable()
export class TasksService {
  constructor(private refreshTokenService: RefreshTokenService) {}

  @Cron('0 0 * * *') // Tous les jours à minuit
  async cleanupExpiredTokens() {
    await this.refreshTokenService.cleanupExpiredTokens();
    console.log('✅ Tokens expirés nettoyés');
  }
}
```

## 🐛 Dépannage

### Erreur "JWT_SECRET is not defined"
→ Vérifiez que `JWT_SECRET` et `JWT_REFRESH_SECRET` sont dans votre `.env`

### Erreur "Cannot find module 'helmet'"
→ Relancez `npm install`

### Les cookies ne sont pas envoyés
→ Vérifiez que `credentials: true` est configuré dans votre client HTTP (fetch, axios)

### Migration Prisma échoue
→ La base de données a déjà été synchronisée avec `prisma db push`

### Rate limiting trop strict en développement
→ Modifiez les limites dans `src/app.module.ts` et les décorateurs `@Throttle()`

## 📚 Documentation Complète

Consultez `AUTHENTICATION_GUIDE.md` pour :
- Architecture détaillée
- Flow d'authentification complet
- Concepts avancés utilisés
- Bonnes pratiques implémentées

## ✨ Prochaines Étapes Recommandées

1. **Tester tous les endpoints** avec Postman ou curl
2. **Configurer les secrets JWT** en production
3. **Ajouter un cron job** pour nettoyer les tokens expirés
4. **Implémenter le logging** des événements de sécurité
5. **Configurer le monitoring** des métriques de sécurité
6. **Tester la rotation des tokens** et la détection de réutilisation
7. **Vérifier le verrouillage** après 5 tentatives échouées

---

**🎉 Votre système d'authentification est maintenant au niveau senior !**

Pour toute question, consultez le guide complet dans `AUTHENTICATION_GUIDE.md`.
