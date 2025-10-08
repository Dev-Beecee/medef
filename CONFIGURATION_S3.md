# ✅ Configuration S3 - MEDEF

## 📋 Récapitulatif de votre configuration

### Bucket S3

- **Nom** : `medef`
- **Région** : `us-east-2` (USA Est - Ohio)
- **Access Key** : `AKIAIOSFODNN7EXAMPLE` (exemple)
- **Secret Key** : `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` (exemple)

## ✅ Configuration terminée

Votre fichier `.env.local` a été créé avec les bonnes credentials.

## 🔒 Important - Sécurité

⚠️ **NE PARTAGEZ JAMAIS vos credentials AWS !**

- Le fichier `.env.local` est déjà dans `.gitignore`
- Ne commitez JAMAIS ce fichier dans Git
- Ces credentials donnent accès complet à votre bucket S3

Si vous pensez que les credentials ont été compromis :

1. Allez dans AWS IAM Console
2. Désactivez/supprimez l'ancienne clé d'accès
3. Créez une nouvelle clé d'accès
4. Mettez à jour `.env.local`

## 📂 Structure des fichiers dans S3

Les fichiers uploadés seront organisés ainsi :

```
medef/
├── videos/
│   └── [participation_id]/
│       └── 1234567890-presentation.mp4
├── documents/
│   └── [participation_id]/
│       ├── 1234567890-attestation.pdf
│       └── 1234567890-kbis.pdf
└── signatures/
    └── [participation_id]/
        └── 1234567890-signature.png
```

## 🔧 Configuration CORS requise

Pour que l'upload fonctionne depuis votre application web, vous devez configurer CORS sur votre bucket S3 :

1. Allez sur [AWS S3 Console](https://s3.console.aws.amazon.com/s3/buckets/medef?region=us-east-2&tab=permissions)
2. Cliquez sur l'onglet **"Permissions"**
3. Descendez à **"Cross-origin resource sharing (CORS)"**
4. Cliquez sur **"Edit"**
5. Collez cette configuration :

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://votre-domaine-production.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

6. Remplacez `https://votre-domaine-production.com` par votre vrai domaine de production
7. Cliquez sur **"Save changes"**

## 🌐 Politique du bucket (optionnel)

Si vous voulez que les fichiers soient accessibles publiquement (pour que les vidéos puissent être visionnées) :

1. Dans l'onglet **"Permissions"**
2. Section **"Block public access (bucket settings)"**
3. Cliquez sur **"Edit"**
4. Décochez **"Block all public access"**
5. Cliquez sur **"Save changes"**

Puis ajoutez cette politique dans **"Bucket policy"** :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::medef/*"
    }
  ]
}
```

## 🧪 Test de la configuration

Le serveur Next.js a été redémarré avec les nouvelles variables d'environnement.

### Pour tester l'upload :

1. Ouvrez votre navigateur sur `http://localhost:3000/participation`
2. Remplissez l'étape 1 et cliquez sur "Suivant"
3. Continuez jusqu'à l'étape 4 (Vidéo)
4. Uploadez une vidéo (max 500 MB)
5. Vérifiez dans la console AWS S3 que le fichier apparaît dans `medef/videos/`

### Pour vérifier que tout fonctionne :

```bash
# Dans la console développeur du navigateur (F12)
# Vous devriez voir ces logs lors d'un upload :
# ✓ "Upload progress: XX%"
# ✓ "Vidéo uploadée avec succès !"
```

## 🐛 Dépannage

### Erreur : "Access Denied"

➡️ Vérifiez que les credentials sont corrects dans `.env.local`
➡️ Vérifiez que l'utilisateur IAM a les bonnes permissions

### Erreur : "CORS policy"

➡️ Ajoutez la configuration CORS (voir section ci-dessus)
➡️ Vérifiez que `http://localhost:3000` est dans `AllowedOrigins`

### Erreur : "Bucket does not exist"

➡️ Vérifiez que le bucket `medef` existe bien dans la région `us-east-2`
➡️ Vérifiez l'orthographe du nom du bucket

### L'upload reste bloqué à 0%

➡️ Vérifiez votre connexion internet
➡️ Vérifiez que le fichier n'est pas trop volumineux (500 MB max pour vidéos)
➡️ Ouvrez la console développeur (F12) pour voir les erreurs

## 📊 URLs des fichiers

Après un upload réussi, l'URL du fichier sera :

```
https://medef.s3.us-east-2.amazonaws.com/videos/[participation_id]/[timestamp]-[nom_fichier].mp4
```

Ces URLs sont automatiquement enregistrées dans la base de données Supabase dans les colonnes :

- `video_s3_url` (vidéo de présentation)
- `attestation_regularite_s3_url` (attestation de régularité)
- `fiche_insee_kbis_s3_url` (KBIS)
- `signature_image_s3_url` (signature)

## 💰 Coûts

**Stockage S3 (us-east-2)** : ~0,023 USD/Go/mois

**Estimation pour 100 participations** :

- 100 vidéos @ 50 Mo = 5 Go = **0,115 USD/mois**
- 300 documents @ 1 Mo = 300 Mo = **0,007 USD/mois**
- **Total : < 0,15 USD/mois** (environ 0,14 €/mois)

## 🎉 C'est prêt !

Votre formulaire est maintenant configuré pour uploader les fichiers vers Amazon S3 !

Tous les uploads sont :

- ✅ Validés (taille et type)
- ✅ Organisés par participation
- ✅ Sauvegardés avec des URLs uniques
- ✅ Enregistrés dans Supabase
- ✅ Accompagnés de notifications toast

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs dans la console du navigateur (F12)
2. Vérifiez les logs du serveur Next.js
3. Vérifiez la console AWS CloudWatch pour les erreurs S3
4. Consultez `AWS_S3_SETUP.md` pour plus de détails
