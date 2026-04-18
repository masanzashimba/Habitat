# Guide d'utilisation des photos de profil

## Fonctionnalités ajoutées

### Pour les utilisateurs (Users)

#### 1. Création d'utilisateur avec photo de profil

```bash
POST /users/create
Content-Type: multipart/form-data

# Champs du formulaire :
- firstName: string (optionnel)
- middleName: string (optionnel)
- lastName: string (optionnel)
- email: string (requis)
- phone: string (optionnel)
- password: string (requis)
- role: string (optionnel, par défaut: "owner")
- accountType: string (optionnel)
- companyName: string (optionnel)
- businessId: string (optionnel)
- address: string (optionnel)
- city: string (optionnel, par défaut: "Kinshasa")
- profileImage: File (optionnel) - Image de profil
```

#### 2. Mise à jour d'utilisateur avec photo de profil

```bash
PUT /users/:id
Content-Type: multipart/form-data

# Champs du formulaire (tous optionnels) :
- firstName: string
- middleName: string
- lastName: string
- phone: string
- accountType: string
- companyName: string
- businessId: string
- address: string
- city: string
- profileImage: File - Nouvelle image de profil
- role: string
- isActive: boolean
```

### Pour les locataires (Tenants)

#### 1. Création de locataire avec photo de profil

```bash
POST /tenants
Content-Type: multipart/form-data

# Champs du formulaire :
- email: string (requis)
- firstName: string (optionnel)
- lastName: string (optionnel)
- phone: string (optionnel)
- profileImage: File (optionnel) - Image de profil
- dateOfBirth: string (optionnel, format ISO)
- nationalId: string (optionnel)
- address: string (optionnel)
- city: string (optionnel)
- emergencyContact: string (optionnel)
- emergencyPhone: string (optionnel)
- occupation: string (optionnel)
- employer: string (optionnel)
- monthlyIncome: number (optionnel)
```

#### 2. Mise à jour de locataire avec photo de profil

```bash
PUT /tenants/:id
Content-Type: multipart/form-data

# Champs du formulaire (tous optionnels) :
- firstName: string
- lastName: string
- phone: string
- profileImage: File - Nouvelle image de profil
- dateOfBirth: string (format ISO)
- nationalId: string
- address: string
- city: string
- emergencyContact: string
- emergencyPhone: string
- occupation: string
- employer: string
- monthlyIncome: number
- isActive: boolean
```

## Configuration Cloudinary

Les images sont automatiquement uploadées sur Cloudinary avec les configurations suivantes :

### Pour les utilisateurs

- **Dossier**: `profiles/`
- **Transformations**: 500x500px, crop: fill, gravity: face, qualité automatique
- **Nom du fichier**: `user-{timestamp}-{nom_original}`

### Pour les locataires

- **Dossier**: `tenants/`
- **Transformations**: 500x500px, crop: fill, gravity: face, qualité automatique
- **Nom du fichier**: `tenant-{timestamp}-{nom_original}`

## Variables d'environnement requises

Assurez-vous que ces variables sont configurées dans votre fichier `.env` :

```env
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
```

## Réponses API

### Utilisateur créé/mis à jour

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "profileImage": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/profiles/user-1234567890-photo.jpg",
    "role": "owner",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Utilisateur créé avec succès"
}
```

### Locataire créé/mis à jour

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "tenant@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "profileImage": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/tenants/tenant-1234567890-photo.jpg",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Locataire créé avec succès"
}
```

## Formats d'images supportés

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

## Limitations

- Taille maximale : 10MB par image
- Les images sont automatiquement redimensionnées à 500x500px
- La qualité est optimisée automatiquement par Cloudinary

## Exemple d'utilisation avec JavaScript/FormData

```javascript
// Création d'utilisateur avec photo
const formData = new FormData();
formData.append('email', 'user@example.com');
formData.append('firstName', 'John');
formData.append('lastName', 'Doe');
formData.append('password', 'motdepasse123');
formData.append('profileImage', fileInput.files[0]); // File object

const response = await fetch('/users/create', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + token,
  },
  body: formData,
});

// Mise à jour de locataire avec photo
const updateFormData = new FormData();
updateFormData.append('firstName', 'Jane');
updateFormData.append('profileImage', newFileInput.files[0]);

const updateResponse = await fetch('/tenants/tenant-id', {
  method: 'PUT',
  headers: {
    Authorization: 'Bearer ' + token,
  },
  body: updateFormData,
});
```
