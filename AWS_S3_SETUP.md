# Configuration AWS S3 pour le projet MEDEF

Ce document explique comment configurer AWS S3 pour l'upload des fichiers (vidéos, documents, signatures).

## Prérequis

1. Un compte AWS actif
2. Les permissions pour créer des buckets S3 et des utilisateurs IAM

## Étapes de configuration

### 1. Créer un bucket S3

1. Connectez-vous à la [Console AWS](https://console.aws.amazon.com/)
2. Allez dans **S3** (Services → Stockage → S3)
3. Cliquez sur **"Créer un compartiment"**
4. Configuration du bucket :
   - **Nom du bucket** : `medef-participations` (ou un nom unique de votre choix)
   - **Région AWS** : Choisissez la région la plus proche (ex: `eu-west-1` pour Paris)
   - **Bloquer tout accès public** : Décochez cette option si vous voulez que les fichiers soient publics
   - **Versionnage** : Activé (recommandé pour conserver l'historique)
   - **Chiffrement** : Activé (recommandé)
5. Cliquez sur **"Créer un compartiment"**

### 2. Configurer les permissions CORS du bucket

Pour permettre les uploads depuis votre application web :

1. Sélectionnez votre bucket
2. Allez dans l'onglet **"Autorisations"**
3. Descendez à la section **"Partage de ressources d'origine croisée (CORS)"**
4. Cliquez sur **"Modifier"**
5. Ajoutez cette configuration :

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://votre-domaine.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

6. Cliquez sur **"Enregistrer les modifications"**

### 3. Créer un utilisateur IAM pour l'accès programmatique

1. Allez dans **IAM** (Services → Sécurité, identité et conformité → IAM)
2. Cliquez sur **"Utilisateurs"** dans le menu de gauche
3. Cliquez sur **"Créer un utilisateur"**
4. Configuration :
   - **Nom d'utilisateur** : `medef-s3-uploader`
   - **Type d'accès** : Cochez "Accès par programmation"
5. Cliquez sur **"Suivant : Autorisations"**
6. Cliquez sur **"Attacher directement les stratégies existantes"**
7. Créez une stratégie personnalisée :
   - Cliquez sur **"Créer une stratégie"**
   - Sélectionnez l'onglet **JSON**
   - Collez cette politique :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::medef-participations/*",
        "arn:aws:s3:::medef-participations"
      ]
    }
  ]
}
```

- Remplacez `medef-participations` par le nom de votre bucket
- Nommez la stratégie : `MedefS3UploaderPolicy`
- Cliquez sur **"Créer une stratégie"**

8. Revenez à la création de l'utilisateur et attachez la stratégie que vous venez de créer
9. Cliquez sur **"Suivant : Balises"** (optionnel)
10. Cliquez sur **"Suivant : Vérifier"**
11. Cliquez sur **"Créer un utilisateur"**
12. **IMPORTANT** : Téléchargez les credentials (Access Key ID et Secret Access Key)
    - Ces informations ne seront plus accessibles après cette étape !

### 4. Configurer les variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` :

```bash
# AWS S3 Configuration
NEXT_PUBLIC_AWS_REGION=eu-west-1
NEXT_PUBLIC_AWS_ACCESS_KEY_ID=VOTRE_ACCESS_KEY_ID
NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=VOTRE_SECRET_ACCESS_KEY
NEXT_PUBLIC_S3_BUCKET_NAME=medef-participations
```

**⚠️ SÉCURITÉ** :

- Ne commitez JAMAIS le fichier `.env.local` dans Git
- Ces credentials donnent accès complet à votre bucket S3
- Pour la production, utilisez plutôt un système de gestion des secrets (AWS Secrets Manager, etc.)

### 5. Structure des dossiers dans S3

Les fichiers seront organisés automatiquement comme suit :

```
medef-participations/
├── videos/
│   └── [participation_id]/
│       └── [timestamp]-[nom_fichier].mp4
├── documents/
│   └── [participation_id]/
│       ├── [timestamp]-attestation.pdf
│       └── [timestamp]-kbis.pdf
└── signatures/
    └── [participation_id]/
        └── [timestamp]-signature.png
```

### 6. Configuration optionnelle : Politique de cycle de vie

Pour optimiser les coûts, vous pouvez configurer une politique de cycle de vie :

1. Dans votre bucket S3, allez dans **"Gestion"**
2. Cliquez sur **"Créer une règle de cycle de vie"**
3. Exemples de règles :
   - Archiver les fichiers vers Glacier après 90 jours
   - Supprimer les fichiers après 365 jours (si requis par RGPD)

### 7. Monitoring et logs

Pour suivre les accès à vos fichiers :

1. Activez **"Journalisation d'accès au serveur"** dans les propriétés du bucket
2. Activez **CloudWatch** pour les métriques S3

## Test de la configuration

Après avoir configuré tout cela :

1. Redémarrez votre serveur de développement Next.js
2. Allez sur `http://localhost:3000/participation`
3. Essayez d'uploader une vidéo ou un document
4. Vérifiez dans la console S3 que le fichier apparaît bien

## Dépannage

### Erreur CORS

- Vérifiez que votre domaine est bien dans `AllowedOrigins`
- Vérifiez que les méthodes HTTP sont autorisées

### Erreur d'accès refusé

- Vérifiez que la politique IAM est correctement configurée
- Vérifiez que les credentials sont corrects dans `.env.local`

### Fichiers non visibles

- Vérifiez les permissions du bucket (public/privé)
- Vérifiez que l'upload s'est bien terminé (logs dans la console)

## Coûts estimés

Pour référence (tarifs eu-west-1) :

- **Stockage** : ~0,023 USD/Go/mois
- **Requêtes PUT** : ~0,005 USD pour 1000 requêtes
- **Requêtes GET** : ~0,0004 USD pour 1000 requêtes
- **Transfert de données sortantes** : Premiers 100 Go/mois gratuits

**Estimation pour 100 participations/mois** :

- 100 vidéos @ 50 Mo = 5 Go stockage = ~0,12 USD/mois
- 300 documents @ 1 Mo = 300 Mo = ~0,007 USD/mois
- Total : **< 1 USD/mois**

## Ressources

- [Documentation AWS S3](https://docs.aws.amazon.com/s3/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/welcome.html)
- [CORS Configuration](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html)
