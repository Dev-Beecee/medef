# Configuration de l'API Admin Supabase

## 🔑 Problème résolu

L'erreur "User not allowed" était causée par l'utilisation de l'API admin Supabase côté client. L'API admin nécessite des permissions spéciales et ne peut être utilisée que côté serveur.

## ✅ Solution implémentée

### **API Routes côté serveur :**

- ✅ `/api/create-admin-user` : Création d'utilisateurs admin
- ✅ `/api/sync-admin-users` : Synchronisation des utilisateurs existants
- ✅ Utilisation de la clé service role côté serveur

## 🔧 Configuration requise

### **1. Variables d'environnement :**

Créez un fichier `.env.local` avec :

```bash
# Configuration Supabase existante
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# NOUVELLE : Clé service role pour l'API admin
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### **2. Obtenir la clé service role :**

1. **Dashboard Supabase** : Aller sur [supabase.com](https://supabase.com)
2. **Sélectionner le projet** : Choisir votre projet MEDEF
3. **Settings > API** : Aller dans les paramètres API
4. **Copier la service_role key** : (pas l'anon key)
5. **Coller dans .env.local** : Remplacer `your_service_role_key_here`

### **3. Redémarrer le serveur :**

```bash
npm run dev
```

## 🚀 Fonctionnalités disponibles

### **Création d'administrateurs :**

- ✅ Création dans Supabase Auth ET table personnalisée
- ✅ Vérification d'existence dans les deux systèmes
- ✅ Métadonnées avec rôle et statut admin
- ✅ Email confirmé automatiquement

### **Synchronisation :**

- ✅ Synchronisation en lot des utilisateurs existants
- ✅ Gestion des utilisateurs déjà existants dans Auth
- ✅ Gestion des erreurs individuelles
- ✅ Feedback détaillé (succès/erreurs)

### **Sécurité :**

- ✅ API admin utilisée côté serveur uniquement
- ✅ Clé service role protégée côté serveur
- ✅ Validation des données côté serveur
- ✅ Gestion des erreurs sécurisée

## 🔒 Sécurité

### **Clé service role :**

- ⚠️ **NE JAMAIS** exposer côté client
- ⚠️ **NE JAMAIS** commiter dans Git
- ✅ Utiliser uniquement côté serveur
- ✅ Ajouter à `.gitignore`

### **Permissions :**

- ✅ Accès complet à l'API admin Supabase
- ✅ Création/suppression d'utilisateurs
- ✅ Modification des métadonnées utilisateur
- ✅ Accès aux tables de la base de données

## 🎯 Utilisation

### **Créer un administrateur :**

1. Aller sur `/ghost-dashboard/admin`
2. Cliquer sur "Nouvel Admin"
3. Remplir le formulaire
4. L'utilisateur sera créé dans les deux systèmes

### **Synchroniser les utilisateurs existants :**

1. Aller sur `/ghost-dashboard/admin`
2. Cliquer sur "Sync avec Auth"
3. Le système synchronisera automatiquement
4. Vérifier les badges "✓ Auth" / "✗ Auth"

## 🔄 Prochaines étapes

1. **Configurer la clé service role** dans `.env.local`
2. **Tester la création** d'un nouvel administrateur
3. **Tester la synchronisation** des utilisateurs existants
4. **Vérifier les badges** de statut dans l'interface
5. **Créer une page de login** pour les administrateurs

