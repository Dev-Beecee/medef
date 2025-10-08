# 🚀 Quick Start - Système d'authentification

## ✅ Ce qui a été créé

### Fichiers créés :

1. ✅ `src/components/Login.tsx` - Composant de connexion
2. ✅ `src/lib/useAuth.ts` - Hook d'authentification
3. ✅ `src/components/ProtectedRoute.tsx` - Protection des routes
4. ✅ `src/app/ghost/page.tsx` - Page de connexion
5. ✅ `src/app/ghost-dashboard/page.tsx` - Dashboard protégé
6. ✅ `AUTHENTICATION_GUIDE.md` - Guide complet
7. ✅ `SUPABASE_AUTH_SETUP.sql` - Scripts SQL de configuration

## 🏃 Démarrage rapide (5 minutes)

### Étape 1 : Créer un utilisateur admin dans Supabase

**Option A : Via le Dashboard Supabase (recommandé)**

1. Aller sur [app.supabase.com](https://app.supabase.com)
2. Sélectionner votre projet
3. Aller dans **Authentication** > **Users**
4. Cliquer sur **Add user** > **Create new user**
5. Entrer :
   - Email : `admin@votredomaine.com`
   - Password : `VotreMotDePasseSecurise123!`
   - ✅ Cocher "Auto Confirm User"
6. Cliquer sur **Create user**

**Option B : Via SQL**

```sql
-- Dans l'éditeur SQL de Supabase
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
VALUES (
  'admin@votredomaine.com',
  crypt('VotreMotDePasseSecurise123!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW()
);
```

### Étape 2 : Configurer les permissions (optionnel)

Exécuter le fichier `SUPABASE_AUTH_SETUP.sql` dans l'éditeur SQL de Supabase :

1. Aller dans **SQL Editor**
2. Copier-coller le contenu de `SUPABASE_AUTH_SETUP.sql`
3. Cliquer sur **Run**

### Étape 3 : Tester la connexion

1. Démarrer le serveur de développement :

```bash
npm run dev
```

2. Aller sur : `http://localhost:3000/ghost`

3. Se connecter avec :

   - Email : `admin@votredomaine.com`
   - Mot de passe : `VotreMotDePasseSecurise123!`

4. Vous serez redirigé vers `/ghost-dashboard` ✨

## 🎯 Routes disponibles

| Route              | Accès       | Description                 |
| ------------------ | ----------- | --------------------------- |
| `/ghost`           | 🌐 Public   | Page de connexion           |
| `/ghost-dashboard` | 🔒 Protégée | Dashboard admin avec stats  |
| `/participation`   | 🌐 Public   | Formulaire de participation |

## 🔐 Fonctionnalités

### ✅ Implémenté

- ✅ Connexion par email/mot de passe
- ✅ Gestion automatique du JWT par Supabase
- ✅ Protection des routes sensibles
- ✅ Hook `useAuth()` pour accéder à l'utilisateur
- ✅ Déconnexion sécurisée
- ✅ Redirection automatique si non authentifié
- ✅ Affichage des statistiques dans le dashboard
- ✅ Interface responsive et moderne
- ✅ Toast notifications pour le feedback

### 🎨 Dashboard Admin inclut :

- 📊 Statistiques des participations
- 📈 Graphiques visuels (total, soumises, brouillons)
- 🔘 Actions rapides
- 👤 Affichage de l'utilisateur connecté
- 🚪 Bouton de déconnexion

## 🛠️ Utilisation dans votre code

### Protéger une nouvelle page

```tsx
// src/app/ma-page-privee/page.tsx
"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function MaPagePrivee() {
  return (
    <ProtectedRoute>
      <div>
        <h1>Contenu privé</h1>
        <p>Seuls les utilisateurs connectés peuvent voir ceci</p>
      </div>
    </ProtectedRoute>
  );
}
```

### Accéder aux infos de l'utilisateur

```tsx
"use client";

import { useAuth } from "@/lib/useAuth";

export function MonComposant() {
  const { user, isAuthenticated, logout, loading } = useAuth();

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Bienvenue {user?.email}</p>
          <button onClick={logout}>Se déconnecter</button>
        </>
      ) : (
        <p>Non connecté</p>
      )}
    </div>
  );
}
```

### Récupérer le JWT (si nécessaire pour des API externes)

```tsx
const {
  data: { session },
} = await supabase.auth.getSession();
const jwt = session?.access_token;

// Utiliser le JWT dans un header
fetch("https://api.example.com/data", {
  headers: {
    Authorization: `Bearer ${jwt}`,
  },
});
```

## 🔒 Sécurité

### ✅ Bonnes pratiques appliquées :

- Mot de passe chiffré par Supabase
- JWT géré automatiquement
- Protection côté client avec redirections
- Row Level Security (RLS) recommandée
- Session management automatique

### 🔐 Pour renforcer la sécurité :

1. **Activer RLS sur toutes les tables sensibles**

```sql
ALTER TABLE participations ENABLE ROW LEVEL SECURITY;
```

2. **Configurer la récupération de mot de passe**

   - Aller dans Supabase : Authentication > Email Templates
   - Configurer "Reset Password" email

3. **Activer l'authentification multi-facteur (MFA)**
   - Disponible dans les plans Supabase Pro

## 📝 Variables d'environnement

Vérifier que `.env.local` contient :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_publique
```

## 🐛 Problèmes courants

### "Invalid login credentials"

- ✅ Vérifier que l'email est confirmé dans Supabase
- ✅ Vérifier le mot de passe (sensible à la casse)
- ✅ Regarder les logs dans Authentication > Users > Logs

### Redirection infinie

- ✅ S'assurer que `/ghost` n'est pas dans un `ProtectedRoute`
- ✅ Vérifier la console pour les erreurs

### Session non persistante

- ✅ Vérifier que le localStorage n'est pas bloqué
- ✅ Vérifier les cookies dans les paramètres du navigateur

## 📚 Documentation complète

Pour plus de détails, voir :

- `AUTHENTICATION_GUIDE.md` - Guide complet d'authentification
- `SUPABASE_AUTH_SETUP.sql` - Scripts SQL et configurations
- [Documentation Supabase Auth](https://supabase.com/docs/guides/auth)

## 🎉 C'est prêt !

Votre système d'authentification est maintenant opérationnel. Vous pouvez :

- ✅ Vous connecter sur `/ghost`
- ✅ Accéder au dashboard sur `/ghost-dashboard`
- ✅ Protéger de nouvelles routes
- ✅ Personnaliser l'interface selon vos besoins

Bon développement ! 🚀
