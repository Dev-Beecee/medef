# 🔑 Guide de création d'administrateur

## ✅ Configuration terminée !

Les tables et fonctions nécessaires ont été créées dans votre base de données Supabase via MCP :

1. ✅ Table `admin_users` créée
2. ✅ Fonction `create_admin_user()` créée
3. ✅ Fonction `is_admin()` créée
4. ✅ Politiques RLS configurées
5. ✅ Composant `CreateAdminUser` ajouté à la page d'accueil

## 🚀 Utilisation

### Créer votre premier administrateur

1. **Démarrer l'application**

   ```bash
   npm run dev
   ```

2. **Aller sur la page d'accueil**

   - Ouvrir `http://localhost:3000`
   - Vous verrez un bouton flottant violet en bas à droite : **"Créer un Admin"**

3. **Cliquer sur le bouton et remplir le formulaire**

   - Email : `admin@votredomaine.com`
   - Mot de passe : Minimum 8 caractères (ex: `Admin123!@#`)
   - Confirmer le mot de passe
   - Cliquer sur **"Créer l'administrateur"**

4. **Confirmation**
   - Un toast de succès s'affiche
   - L'utilisateur est créé dans Supabase Auth
   - Le rôle admin est automatiquement ajouté

### Se connecter en tant qu'admin

1. Aller sur `/ghost`
2. Utiliser les identifiants créés
3. Redirection automatique vers `/ghost-dashboard`

## 🔐 Sécurité

### Premier administrateur

- ✅ **N'importe qui peut créer le PREMIER admin** (pour l'initialisation)
- ⚠️ Créez votre premier admin immédiatement après le déploiement !

### Administrateurs suivants

- 🔒 **Seuls les admins existants** peuvent créer d'autres admins
- 🔒 Nécessite d'être connecté avec un compte admin

### Recommandation

Une fois le premier admin créé, vous pouvez :

1. Supprimer le composant de la page d'accueil
2. Ou ajouter une vérification pour le cacher après le premier admin

## 📊 Vérifier dans Supabase

### Via le Dashboard Supabase

1. Aller dans **Authentication** > **Users**

   - Vous verrez l'utilisateur créé
   - Email confirmé automatiquement ✅

2. Aller dans **Table Editor** > **admin_users**
   - Vous verrez l'entrée avec le rôle 'admin'

### Via SQL

```sql
-- Lister tous les administrateurs
SELECT
  au.id,
  au.email,
  au.role,
  au.created_at,
  u.last_sign_in_at
FROM admin_users au
LEFT JOIN auth.users u ON au.user_id = u.id
ORDER BY au.created_at DESC;
```

## 🛠️ Gestion des admins

### Supprimer un admin

**Via le Dashboard Supabase :**

1. Table Editor > admin_users
2. Trouver l'admin
3. Cliquer sur les 3 points > Delete
4. L'utilisateur auth sera automatiquement supprimé (CASCADE)

**Via SQL :**

```sql
DELETE FROM admin_users WHERE email = 'admin@example.com';
```

### Lister tous les admins

```sql
SELECT * FROM admin_users ORDER BY created_at DESC;
```

## 🎨 Personnalisation

### Cacher le bouton après le premier admin

Modifier `src/components/CreateAdminUser.tsx` :

```tsx
const [hasAdmins, setHasAdmins] = useState(true);

useEffect(() => {
  const checkAdmins = async () => {
    const { data } = await supabase.from("admin_users").select("id").limit(1);

    setHasAdmins(!!data && data.length > 0);
  };
  checkAdmins();
}, []);

// Ne pas afficher si des admins existent déjà
if (hasAdmins) return null;
```

### Déplacer vers une page protégée

Pour plus de sécurité, déplacer le composant vers `/ghost-dashboard` :

```tsx
// src/app/ghost-dashboard/page.tsx
import { CreateAdminUser } from "@/components/CreateAdminUser";

// Ajouter dans le dashboard
<CreateAdminUser />;
```

## 🔍 Fonctions SQL disponibles

### `create_admin_user(email, password)`

```sql
-- Créer un admin via SQL
SELECT create_admin_user('admin@example.com', 'MotDePasse123!');
```

### `is_admin()`

```sql
-- Vérifier si l'utilisateur actuel est admin
SELECT is_admin();
```

## ⚠️ Problèmes courants

### "Seuls les administrateurs peuvent créer d'autres administrateurs"

- ✅ C'est normal si un admin existe déjà
- ✅ Connectez-vous d'abord avec un compte admin

### "Un utilisateur avec cet email existe déjà"

- ✅ Utilisez un email différent
- ✅ Ou supprimez l'ancien utilisateur d'abord

### Le bouton ne s'affiche pas

- ✅ Vérifiez que la page est en mode client (`'use client'`)
- ✅ Vérifiez la console pour les erreurs

### Erreur lors de la création

- ✅ Vérifiez que les migrations ont bien été appliquées
- ✅ Vérifiez les logs dans Supabase : Settings > Logs

## 📝 Structure de la base de données

### Table `admin_users`

```sql
id          UUID PRIMARY KEY
user_id     UUID (référence auth.users)
email       TEXT UNIQUE
role        TEXT (default: 'admin')
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

### Politiques RLS

- ✅ Seuls les admins peuvent voir la table admin_users
- ✅ Seuls les admins peuvent créer d'autres admins
- ✅ CASCADE sur suppression d'utilisateur

## 🎉 Vous êtes prêt !

Vous pouvez maintenant :

1. ✅ Créer des utilisateurs administrateurs
2. ✅ Les gérer via le dashboard
3. ✅ Sécuriser votre application
4. ✅ Créer plusieurs niveaux d'accès si besoin

Pour toute question, consultez :

- `AUTHENTICATION_GUIDE.md` - Guide complet d'authentification
- `QUICKSTART_AUTH.md` - Démarrage rapide
- `SUPABASE_AUTH_SETUP.sql` - Scripts SQL de référence
