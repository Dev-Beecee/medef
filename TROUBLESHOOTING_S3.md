# Dépannage S3 - MEDEF

## ✅ Problème résolu : Erreur de checksum CRC32

### Symptôme

```
InvalidRequest: The upload was created using a crc32 checksum.
The complete request must include the checksum for each part.
It was missing for part 1 in the request.
```

### Cause

AWS S3 SDK version 3.x utilise par défaut des checksums CRC32 pour les multipart uploads. Cependant, le processus d'upload multipart peut ne pas inclure le checksum pour chaque partie, ce qui cause cette erreur.

### Solution appliquée (v3 - FINALE)

**Approche correcte** : Spécifier explicitement `ChecksumAlgorithm: 'CRC32'` pour les deux modes d'upload.

```typescript
const fileSizeMB = file.size / (1024 * 1024);

if (fileSizeMB < 100) {
  // Upload simple avec PutObjectCommand
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: file,
    ContentType: file.type,
    ChecksumAlgorithm: "CRC32", // ✅ Spécifier CRC32
  });
  await s3Client.send(command);
} else {
  // Upload multipart pour gros fichiers
  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file,
      ContentType: file.type,
      ChecksumAlgorithm: "CRC32", // ✅ Spécifier CRC32 pour toutes les parts
    },
    partSize: 1024 * 1024 * 10,
  });
  await upload.done();
}
```

**Explication** :

- AWS S3 SDK v3 initialise automatiquement les uploads multipart avec CRC32
- Chaque part doit envoyer son checksum `x-amz-checksum-crc32`
- En spécifiant explicitement `ChecksumAlgorithm: 'CRC32'`, le SDK calcule et envoie le checksum pour chaque part

**Avantages** :

- ✅ Résout définitivement l'erreur de checksum CRC32
- ✅ Upload optimisé selon la taille du fichier
- ✅ Checksums corrects pour simple et multipart uploads

### Fichiers modifiés

- `src/lib/s3-upload.ts` :
  - Ajout de `PutObjectCommand` pour upload simple
  - Logique hybride selon taille du fichier
  - Seuil : 100 MB

---

## Autres problèmes courants

### 1. Erreur CORS

**Symptôme :**

```
Access to fetch at 'https://medef.s3.us-east-2.amazonaws.com/...'
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution :**

1. Allez dans AWS S3 Console → Bucket `medef` → Permissions
2. Section "Cross-origin resource sharing (CORS)"
3. Ajoutez :

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### 2. Erreur Access Denied

**Symptôme :**

```
AccessDenied: Access Denied
```

**Solutions possibles :**

**A. Vérifier les credentials dans `.env.local` :**

```bash
NEXT_PUBLIC_AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

**B. Vérifier les permissions IAM :**
L'utilisateur IAM doit avoir ces permissions :

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
      "Resource": ["arn:aws:s3:::medef/*", "arn:aws:s3:::medef"]
    }
  ]
}
```

**C. Vérifier le nom du bucket :**
Le bucket doit s'appeler exactement `medef` dans la région `us-east-2`.

### 3. Upload bloqué à 0%

**Symptômes possibles :**

- L'upload ne démarre jamais
- Toast de loading reste affiché indéfiniment
- Aucune erreur dans la console

**Solutions :**

**A. Vérifier la connexion internet**

```bash
ping s3.us-east-2.amazonaws.com
```

**B. Vérifier la taille du fichier**

- Vidéos : max 500 MB
- Documents : max 10 MB

**C. Vérifier les logs du navigateur (F12)**
Recherchez des erreurs réseau ou JavaScript.

**D. Redémarrer le serveur Next.js**

```bash
# Arrêter
Ctrl + C

# Relancer
npm run dev
```

### 4. Fichier non visible dans S3

**Symptôme :**
Upload réussi selon l'app, mais fichier introuvable dans S3 Console.

**Solutions :**

**A. Vérifier la région**
Assurez-vous d'être dans la région `us-east-2` (Ohio) dans AWS Console.

**B. Vérifier le dossier**
Les fichiers sont dans des sous-dossiers :

- `videos/[participation_id]/`
- `documents/[participation_id]/`
- `signatures/[participation_id]/`

**C. Rafraîchir la console S3**
Cliquez sur le bouton de rafraîchissement dans AWS Console.

### 5. URL du fichier non accessible

**Symptôme :**
L'URL est enregistrée en base mais retourne 403 Forbidden.

**Solution :**
Rendre le bucket public (ou au moins les objets) :

1. **Désactiver le blocage d'accès public :**

   - Bucket → Permissions
   - Block public access → Edit
   - Décochez "Block all public access"

2. **Ajouter une politique de bucket :**

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

⚠️ **Attention :** Cela rend TOUS les fichiers du bucket publics.

### 6. Erreur de validation de fichier

**Symptôme :**

```
Fichier invalide: Le fichier est trop volumineux
```

**Solution :**
Respecter les limites :

- **Vidéos** : 5 GB max, formats `.mp4`, `.mov`, `.avi`
- **Documents** : 10 MB max, formats `.pdf`, `.jpg`, `.jpeg`, `.png`

**Modifier les limites :**
Dans `src/lib/s3-upload.ts`, fonction `validateFile()` :

```typescript
// Exemple : augmenter la limite vidéo à 10 GB
const validation = validateFile(file, 10000, [...])
```

### 7. Variables d'environnement non chargées

**Symptôme :**

```
Error: Missing credentials in config
```

**Solutions :**

**A. Vérifier que `.env.local` existe**

```bash
ls -la .env.local
```

**B. Redémarrer Next.js après modification de `.env.local`**

```bash
# Ctrl+C puis
npm run dev
```

**C. Vérifier le format des variables**
Elles doivent commencer par `NEXT_PUBLIC_` pour être accessibles côté client.

---

## Outils de diagnostic

### Vérifier la configuration S3

```bash
# Dans le terminal de développement
# Ouvrir la console du navigateur (F12)
console.log({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
  hasAccessKey: !!process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
})
```

### Tester l'accès S3 depuis AWS CLI

```bash
# Lister les objets du bucket
aws s3 ls s3://medef/ --region us-east-2

# Uploader un fichier test
echo "test" > test.txt
aws s3 cp test.txt s3://medef/test.txt --region us-east-2
```

### Logs détaillés

Activer les logs détaillés dans `src/lib/s3-upload.ts` :

```typescript
upload.on("httpUploadProgress", (progress) => {
  console.log("Upload progress:", progress);
});
```

---

## Contacts et ressources

- **Documentation AWS S3** : https://docs.aws.amazon.com/s3/
- **AWS SDK JS v3** : https://docs.aws.amazon.com/sdk-for-javascript/v3/
- **Problèmes checksums** : https://github.com/aws/aws-sdk-js-v3/issues

---

## Changelog des corrections

### 2024-10-07 - v3 (FINALE) ✅

- ✅ **Solution définitive** : Ajout de `ChecksumAlgorithm: 'CRC32'` dans PutObject et Upload
- ✅ **Explication correcte** : Le SDK AWS initialise avec CRC32, il faut le spécifier explicitement
- ✅ **Upload hybride** : Simple pour < 100 MB, multipart pour ≥ 100 MB
- ✅ **Checksums corrects** pour tous les types d'upload

### 2024-10-07 - v2

- ⚠️ **Approche partielle** : Upload simple (PutObject) sans spécifier checksum
- ⚠️ **Problème** : Multipart continuait à générer l'erreur

### 2024-10-07 - v1

- ⚠️ **Tentative 1** : Ajout de `ChecksumAlgorithm: undefined` (erreur de compréhension)
- ⚠️ **Tentative 2** : Configuration multipart avec `partSize: 5MB` (insuffisant)
- ✅ **Credentials configurés** : Région `us-east-2`, bucket `medef`
