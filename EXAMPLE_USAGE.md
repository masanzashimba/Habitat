# Exemples d'utilisation des photos de profil

## Test avec cURL

### 1. Créer un utilisateur avec photo de profil

```bash
curl -X POST http://localhost:3000/users/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "email=john.doe@example.com" \
  -F "firstName=John" \
  -F "lastName=Doe" \
  -F "password=motdepasse123" \
  -F "role=owner" \
  -F "profileImage=@/path/to/profile-photo.jpg"
```

### 2. Mettre à jour un utilisateur avec nouvelle photo

```bash
curl -X PUT http://localhost:3000/users/USER_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "firstName=John Updated" \
  -F "profileImage=@/path/to/new-profile-photo.jpg"
```

### 3. Créer un locataire avec photo de profil

```bash
curl -X POST http://localhost:3000/tenants \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "email=tenant@example.com" \
  -F "firstName=Jane" \
  -F "lastName=Smith" \
  -F "phone=+243123456789" \
  -F "profileImage=@/path/to/tenant-photo.jpg"
```

### 4. Mettre à jour un locataire avec nouvelle photo

```bash
curl -X PUT http://localhost:3000/tenants/TENANT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "firstName=Jane Updated" \
  -F "profileImage=@/path/to/new-tenant-photo.jpg"
```

## Test avec Postman

### Configuration de la requête

1. **Méthode**: POST ou PUT
2. **URL**: `http://localhost:3000/users/create` ou autre endpoint
3. **Headers**:
   - `Authorization: Bearer YOUR_JWT_TOKEN`
4. **Body**:
   - Sélectionner `form-data`
   - Ajouter les champs texte normalement
   - Pour `profileImage`: changer le type de "Text" à "File" et sélectionner votre image

### Exemple de réponse réussie

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "profileImage": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/profiles/user-1234567890-profile.jpg",
    "role": "owner",
    "createdAt": "2024-01-01T10:00:00.000Z"
  },
  "message": "Utilisateur créé avec succès"
}
```

## Frontend React/Vue.js

### Exemple avec React

```jsx
import React, { useState } from 'react';

function UserForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [profileImage, setProfileImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });

    if (profileImage) {
      data.append('profileImage', profileImage);
    }

    try {
      const response = await fetch('/users/create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: data,
      });

      const result = await response.json();
      console.log('Utilisateur créé:', result);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Prénom"
        value={formData.firstName}
        onChange={(e) =>
          setFormData({ ...formData, firstName: e.target.value })
        }
      />

      <input
        type="text"
        placeholder="Nom"
        value={formData.lastName}
        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
      />

      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
      />

      <input
        type="password"
        placeholder="Mot de passe"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
      />

      <input
        type="file"
        accept="image/*"
        onChange={(e) => setProfileImage(e.target.files[0])}
      />

      <button type="submit">Créer utilisateur</button>
    </form>
  );
}

export default UserForm;
```

### Exemple avec Vue.js

```vue
<template>
  <form @submit.prevent="createUser">
    <input v-model="form.firstName" placeholder="Prénom" />
    <input v-model="form.lastName" placeholder="Nom" />
    <input v-model="form.email" type="email" placeholder="Email" required />
    <input
      v-model="form.password"
      type="password"
      placeholder="Mot de passe"
      required
    />
    <input type="file" @change="handleFileChange" accept="image/*" />
    <button type="submit">Créer utilisateur</button>
  </form>
</template>

<script>
export default {
  data() {
    return {
      form: {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
      },
      profileImage: null,
    };
  },
  methods: {
    handleFileChange(event) {
      this.profileImage = event.target.files[0];
    },

    async createUser() {
      const formData = new FormData();

      Object.keys(this.form).forEach((key) => {
        formData.append(key, this.form[key]);
      });

      if (this.profileImage) {
        formData.append('profileImage', this.profileImage);
      }

      try {
        const response = await fetch('/users/create', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.$store.state.token}`,
          },
          body: formData,
        });

        const result = await response.json();
        console.log('Utilisateur créé:', result);
      } catch (error) {
        console.error('Erreur:', error);
      }
    },
  },
};
</script>
```

## Validation des images côté frontend

```javascript
function validateImage(file) {
  // Vérifier le type de fichier
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      'Type de fichier non supporté. Utilisez JPEG, PNG ou WebP.',
    );
  }

  // Vérifier la taille (10MB max)
  const maxSize = 10 * 1024 * 1024; // 10MB en bytes
  if (file.size > maxSize) {
    throw new Error('Le fichier est trop volumineux. Taille maximale: 10MB.');
  }

  return true;
}

// Utilisation
const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    try {
      validateImage(file);
      setProfileImage(file);
    } catch (error) {
      alert(error.message);
      event.target.value = ''; // Reset input
    }
  }
};
```
