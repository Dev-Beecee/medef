# Upload côté serveur - Architecture sécurisée

## 🎯 Pourquoi l'upload côté serveur ?

### ❌ Problèmes de l'upload client-side

1. **Sécurité** : Les credentials AWS sont exposés dans le code JavaScript

   ```javascript
   // DANGEREUX : Visible dans le navigateur !
   NEXT_PUBLIC_AWS_ACCESS_KEY_ID=AKIAS252...
   NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=hzjBn...
   ```

2. **Risques** :

   - N'importe qui peut voir vos credentials dans les DevTools
   - Les credentials peuvent être extraits et utilisés malicieusement
   - Impossibilité de révoquer l'accès sans redéployer l'app

3. **CORS** : Nécessite une configuration CORS sur S3 pour autoriser les uploads depuis le navigateur

### ✅ Avantages de l'upload server-side

1. **Sécurité maximale** :

   - Credentials AWS **jamais exposés** au client
   - Variables d'environnement **sans préfixe NEXT*PUBLIC***
   - Contrôle total sur qui peut uploader

2. **Contrôle** :

   - Validation côté serveur impossible à contourner
   - Logs serveur des uploads
   - Possibilité d'ajouter de l'authentification

3. **Simplicité** :
   - **Pas besoin de CORS** sur S3 (upload depuis le serveur)
   - API unifiée pour tous les types d'upload

## 🏗️ Architecture implémentée

```
Client (Navigateur)                 Serveur Next.js                 AWS S3
     │                                    │                            │
     │  FormData (file + metadata)       │                            │
     ├──────────────────────────────────>│                            │
     │   POST /api/upload                 │                            │
     │                                    │  PutObject / Upload        │
     │                                    ├───────────────────────────>│
     │                                    │                            │
     │                                    │<───────────────────────────┤
     │                                    │  URL du fichier            │
     │<──────────────────────────────────┤                            │
     │   JSON { success, url }            │                            │
```

## 📁 Fichiers créés

### 1. **`src/app/api/upload/route.ts`** - API Route Next.js

Route serveur qui gère les uploads vers S3.

**Fonctionnalités** :

- Réception de fichiers via FormData
- Validation des paramètres
- Upload vers S3 avec checksums CRC32
- Upload hybride (simple < 100 MB, multipart ≥ 100 MB)
- Logs serveur de progression
- Gestion d'erreurs complète

**Variables d'environnement utilisées** (serveur uniquement) :

```bash
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET_NAME=medef
```

### 2. **`src/lib/s3-upload-client.ts`** - Client-side wrapper

Wrapper côté client qui appelle l'API route.

**Fonctionnalités** :

- Envoi de fichiers via FormData à `/api/upload`
- **Suivi de progression** via `XMLHttpRequest`
- Callback `onProgress(percentage)` pour les toasts
- Conversion de signatures base64 en fichiers
- Validation côté client (pré-upload)

**Usage** :

```typescript
import { uploadFileToS3 } from "@/lib/s3-upload-client";

const result = await uploadFileToS3(
  file,
  "videos",
  participationId,
  (percentage) => {
    console.log(`Upload: ${percentage}%`);
  }
);
```

### 3. **Modifications du formulaire**

Import changé de `s3-upload` vers `s3-upload-client` :

```typescript
import { uploadFileToS3 } from "@/lib/s3-upload-client";
```

## 🔒 Configuration de sécurité

### Variables d'environnement (`.env.local`)

```bash
# ✅ Variables SERVEUR (sans NEXT_PUBLIC_)
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET_NAME=medef

# ❌ Anciennes variables CLIENT (À NE PLUS UTILISER)
# NEXT_PUBLIC_AWS_REGION=...
# NEXT_PUBLIC_AWS_ACCESS_KEY_ID=...
# NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=...
```

**Important** :

- Variables **SANS** `NEXT_PUBLIC_` = uniquement côté serveur
- Variables **AVEC** `NEXT_PUBLIC_` = exposées au client (à éviter pour secrets)

### Bucket S3 - CORS

**Plus besoin de CORS sur S3 !** ✅

L'upload se fait depuis le serveur Next.js, pas depuis le navigateur.
Vous pouvez **supprimer ou laisser** la configuration CORS, elle n'est plus utilisée.

## 📊 Comparaison

| Aspect                   | Client-side       | Server-side ✅             |
| ------------------------ | ----------------- | -------------------------- |
| **Sécurité credentials** | ❌ Exposés        | ✅ Protégés                |
| **CORS nécessaire**      | ✅ Oui            | ❌ Non                     |
| **Validation**           | ⚠️ Contournable   | ✅ Fiable                  |
| **Progression**          | ✅ XMLHttpRequest | ✅ XMLHttpRequest          |
| **Taille max upload**    | ~5 GB             | ~5 GB                      |
| **Logs**                 | ❌ Client only    | ✅ Serveur + Client        |
| **Bande passante**       | 1x (client → S3)  | 2x (client → serveur → S3) |

**Trade-off** : L'upload server-side utilise 2x la bande passante (client → serveur → S3), mais les avantages de sécurité valent largement le coût.

## 🧪 Test de la nouvelle implémentation

### 1. Redémarrer le serveur Next.js

```bash
# Arrêter (Ctrl+C)
# Relancer
npm run dev
```

Les nouvelles variables d'environnement seront chargées.

### 2. Tester un upload

1. Ouvrir http://localhost:3000/participation
2. Aller à l'étape 4 (Vidéo)
3. Uploader une vidéo
4. Observer :
   - **Toast client** : "Upload de la vidéo: X%"
   - **Logs serveur** : `[Server] Upload simple pour ...`
   - **Succès** : URL S3 retournée

### 3. Vérifier dans S3

1. Aller sur AWS S3 Console
2. Bucket `medef`
3. Dossier `videos/[participation_id]/`
4. Le fichier devrait être là !

## 🔍 Débogage

### Logs serveur

Dans le terminal où tourne `npm run dev` :

```bash
[Server] Upload simple pour video.mp4 (45.23 MB)
[Server] Upload progress: 100%
```

### Logs client

Dans la console du navigateur (F12) :

```bash
Upload: 10%
Upload: 25%
Upload: 50%
Upload: 100%
✓ Vidéo uploadée avec succès !
```

### Erreurs communes

**1. "Missing credentials"**
➡️ Variables d'environnement mal configurées dans `.env.local`
➡️ Redémarrer le serveur Next.js

**2. "Payload too large"**
➡️ Fichier > 5 GB
➡️ Augmenter `sizeLimit` dans `route.ts`

**3. "Network error"**
➡️ Connexion internet
➡️ Vérifier que le serveur Next.js tourne

## 🎯 Prochaines améliorations possibles

### 1. Authentification

Ajouter une vérification d'authentification dans l'API route :

```typescript
export async function POST(request: NextRequest) {
  // Vérifier que l'utilisateur est authentifié
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { success: false, error: "Non autorisé" },
      { status: 401 }
    );
  }

  // ... reste du code
}
```

### 2. Rate limiting

Limiter le nombre d'uploads par utilisateur :

```typescript
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 h"),
});
```

### 3. Scan antivirus

Intégrer un scan antivirus avant l'upload :

```typescript
import { scanFile } from "@/lib/antivirus";

const scanResult = await scanFile(buffer);
if (scanResult.infected) {
  return NextResponse.json(
    { success: false, error: "Fichier suspect" },
    { status: 400 }
  );
}
```

### 4. Compression automatique

Compresser les vidéos avant upload :

```typescript
import ffmpeg from "fluent-ffmpeg";

if (file.type.startsWith("video/")) {
  buffer = await compressVideo(buffer);
}
```

## 📚 Ressources

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
- [AWS SDK v3 - S3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)
- [FormData API](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [XMLHttpRequest](https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest)

## ✅ Résumé

L'upload côté serveur est maintenant opérationnel avec :

- ✅ **Credentials AWS sécurisés** (jamais exposés au client)
- ✅ **API route `/api/upload`** pour gérer les uploads
- ✅ **Progression en temps réel** via XMLHttpRequest
- ✅ **Upload hybride** (simple/multipart) avec checksums CRC32
- ✅ **Validation serveur** fiable
- ✅ **Logs serveur** pour monitoring
- ✅ **Plus besoin de CORS** sur S3

**C'est maintenant la méthode recommandée pour tous les uploads !** 🚀
