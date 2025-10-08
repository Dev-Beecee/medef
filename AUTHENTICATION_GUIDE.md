# Guide d'authentification - Dashboard Admin

## 📋 Vue d'ensemble

Ce système d'authentification utilise Supabase Auth pour sécuriser l'accès au dashboard administrateur. Le JWT (JSON Web Token) est automatiquement géré par Supabase et stocké de manière sécurisée.

## 🔧 Composants créés

### 1. **Composant Login** (`src/components/Login.tsx`)

- Formulaire de connexion avec email/mot de passe
- Gestion des erreurs avec toast notifications
- Redirection automatique vers le dashboard après connexion

### 2. **Hook useAuth** (`src/lib/useAuth.ts`)

- Hook personnalisé pour gérer l'état d'authentification
- Détecte automatiquement les changements de session
- Fonction `logout()` pour déconnecter l'utilisateur
- Retourne `user`, `loading`, `isAuthenticated`, et `logout`

### 3. **Composant ProtectedRoute** (`src/components/ProtectedRoute.tsx`)

- Wrapper pour protéger les routes nécessitant une authentification
- Redirige vers `/ghost` si l'utilisateur n'est pas connecté
- Affiche un loader pendant la vérification

### 4. **Page Login** (`src/app/ghost/page.tsx`)

- Page accessible à `/ghost`
- Interface moderne et responsive

### 5. **Dashboard Protégé** (`src/app/ghost-dashboard/page.tsx`)

- Page accessible uniquement aux utilisateurs authentifiés
- Affiche des statistiques des participations
- Bouton de déconnexion
- Actions rapides pour l'administration

## 🚀 Utilisation

### Créer un utilisateur admin dans Supabase

1. Aller dans votre projet Supabase
2. Navigation : **Authentication** > **Users** > **Add user**
3. Créer un utilisateur avec email et mot de passe

Ou via SQL :

```sql
-- Créer un utilisateur admin
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES (
  'admin@example.com',
  crypt('votre_mot_de_passe', gen_salt('bf')),
  NOW()
);
```

### Accéder au dashboard

1. Aller sur `http://localhost:3000/ghost`
2. Entrer vos identifiants
3. Vous serez redirigé vers `/ghost-dashboard`

### Protéger d'autres routes

Pour protéger une nouvelle page :

```tsx
"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function MaPageProtegee() {
  return (
    <ProtectedRoute>
      <div>Contenu protégé</div>
    </ProtectedRoute>
  );
}
```

### Utiliser le hook useAuth dans un composant

```tsx
"use client";

import { useAuth } from "@/lib/useAuth";

export function MonComposant() {
  const { user, isAuthenticated, logout, loading } = useAuth();

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Connecté en tant que {user?.email}</p>
          <button onClick={logout}>Déconnexion</button>
        </div>
      ) : (
        <p>Non connecté</p>
      )}
    </div>
  );
}
```

## 🔐 Fonctionnement du JWT

### Stockage automatique

Supabase stocke automatiquement le JWT dans le localStorage du navigateur. Le token est inclus automatiquement dans toutes les requêtes vers Supabase.

### Rafraîchissement automatique

Le token est automatiquement rafraîchi par Supabase avant son expiration.

### Accès au token (si nécessaire)

```tsx
const {
  data: { session },
} = await supabase.auth.getSession();
const jwt = session?.access_token;
```

## 🛡️ Sécurité

### Bonnes pratiques mises en place :

- ✅ Mot de passe jamais stocké côté client
- ✅ JWT stocké de manière sécurisée par Supabase
- ✅ Redirection automatique si non authentifié
- ✅ Vérification de session côté client
- ✅ Support de la déconnexion propre

### Recommandations supplémentaires :

- Configurer Row Level Security (RLS) dans Supabase
- Limiter l'accès aux tables sensibles
- Utiliser des rôles pour différencier admin/utilisateur

## 📊 Exemple de politique RLS

Pour sécuriser la table `participations` :

```sql
-- Permettre la lecture seulement aux utilisateurs authentifiés
CREATE POLICY "Authenticated users can view participations"
ON participations FOR SELECT
TO authenticated
USING (true);

-- Permettre toutes les actions aux admins seulement
CREATE POLICY "Admins can do everything"
ON participations FOR ALL
TO authenticated
USING (
  auth.jwt() ->> 'email' = 'admin@example.com'
);
```

## 🔄 Flux d'authentification

```
1. Utilisateur visite /ghost-dashboard
   ↓
2. ProtectedRoute vérifie l'authentification
   ↓
3. Si non authentifié → Redirige vers /ghost
   ↓
4. Utilisateur entre ses identifiants
   ↓
5. Supabase vérifie et crée une session
   ↓
6. JWT stocké automatiquement
   ↓
7. Redirection vers /ghost-dashboard
   ↓
8. Contenu protégé affiché
```

## 🐛 Dépannage

### Le login ne fonctionne pas

- Vérifier que l'utilisateur existe dans Supabase Auth
- Vérifier les credentials Supabase dans `.env.local`
- Vérifier la console pour les erreurs

### Redirection infinie

- Vérifier que la route `/ghost` n'est pas dans un `ProtectedRoute`
- Vérifier que `useAuth` est appelé correctement

### Session perdue au rafraîchissement

- Vérifier que `supabase.auth.getSession()` est appelé au mount
- Vérifier que le localStorage n'est pas bloqué

## 📝 Variables d'environnement requises

```env
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anonyme
```

## 🎨 Personnalisation

Le style peut être modifié dans :

- `src/components/Login.tsx` - Style du formulaire
- `src/app/ghost-dashboard/page.tsx` - Style du dashboard
- Utilise Tailwind CSS pour tous les styles
