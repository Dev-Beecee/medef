#!/bin/bash

# Script de test pour vérifier la configuration Supabase Admin API

echo "🔍 Vérification de la configuration Supabase Admin API..."
echo ""

# Vérifier si le fichier .env.local existe
if [ ! -f ".env.local" ]; then
    echo "❌ Fichier .env.local non trouvé"
    echo "📝 Créez le fichier .env.local avec les variables suivantes :"
    echo ""
    echo "NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here"
    echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here"
    echo ""
    echo "📖 Voir SUPABASE_ADMIN_API_SETUP.md pour les instructions détaillées"
    exit 1
fi

echo "✅ Fichier .env.local trouvé"

# Vérifier les variables d'environnement
if ! grep -q "SUPABASE_SERVICE_ROLE_KEY=" .env.local; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY non configurée dans .env.local"
    echo "📝 Ajoutez cette ligne dans .env.local :"
    echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here"
    exit 1
fi

echo "✅ SUPABASE_SERVICE_ROLE_KEY configurée"

# Vérifier que la clé n'est pas la valeur par défaut
if grep -q "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here" .env.local; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY contient encore la valeur par défaut"
    echo "📝 Remplacez 'your_service_role_key_here' par votre vraie clé service role"
    exit 1
fi

echo "✅ SUPABASE_SERVICE_ROLE_KEY semble configurée correctement"

# Vérifier les autres variables
if ! grep -q "NEXT_PUBLIC_SUPABASE_URL=" .env.local; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL non configurée"
    exit 1
fi

if ! grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local; then
    echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY non configurée"
    exit 1
fi

echo "✅ Toutes les variables Supabase sont configurées"

echo ""
echo "🎉 Configuration Supabase Admin API prête !"
echo ""
echo "🚀 Prochaines étapes :"
echo "1. Redémarrer le serveur : npm run dev"
echo "2. Aller sur /ghost-dashboard/admin"
echo "3. Tester la création d'un administrateur"
echo "4. Tester la synchronisation des utilisateurs existants"
echo ""
echo "📖 Voir SUPABASE_ADMIN_API_SETUP.md pour plus de détails"

