/**
 * Upload client-side qui appelle l'API route Next.js
 * Plus sécurisé : les credentials AWS restent côté serveur
 */

export interface UploadResult {
  success: boolean
  url?: string
  size?: number
  type?: string
  error?: string
}

/**
 * Upload un fichier vers S3 directement via Presigned URL
 * Plus rapide et contourne les limites de timeout de Vercel
 * @param file Le fichier à uploader
 * @param folder Le dossier dans le bucket (ex: 'videos', 'documents', 'signatures')
 * @param participationId L'ID de la participation pour organiser les fichiers
 * @param onProgress Callback optionnel pour suivre la progression
 * @returns L'URL du fichier uploadé ou une erreur
 */
export async function uploadFileToS3(
  file: File,
  folder: 'videos' | 'documents' | 'signatures',
  participationId?: string,
  onProgress?: (percentage: number) => void
): Promise<UploadResult> {
  try {
    // Étape 1 : Obtenir une Presigned URL depuis notre API
    const presignedResponse = await fetch('/api/generate-presigned-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        folder,
        participationId,
      }),
    })

    if (!presignedResponse.ok) {
      const error = await presignedResponse.json()
      return {
        success: false,
        error: error.error || 'Erreur lors de la génération de l\'URL d\'upload',
      }
    }

    const { presignedUrl, fileUrl } = await presignedResponse.json()

    // Étape 2 : Upload direct vers S3 avec la Presigned URL
    return new Promise<UploadResult>((resolve) => {
      const xhr = new XMLHttpRequest()

      // Pas de limite de timeout car upload direct vers S3
      // On met quand même un timeout raisonnable (2 heures pour vidéos très volumineuses)
      xhr.timeout = 2 * 60 * 60 * 1000 // 2 heures

      // Écouter la progression de l'upload
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentage = Math.round((event.loaded / event.total) * 100)
          onProgress(percentage)
        }
      })

      // Gérer la réponse
      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({
            success: true,
            url: fileUrl,
            size: file.size,
            type: file.type,
          })
        } else {
          resolve({
            success: false,
            error: `Erreur S3 : ${xhr.status} - ${xhr.statusText}`,
          })
        }
      })

      // Gérer le timeout
      xhr.addEventListener('timeout', () => {
        resolve({
          success: false,
          error: 'Le délai d\'upload a expiré. Veuillez vérifier votre connexion et réessayer.',
        })
      })

      // Gérer les erreurs réseau
      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          error: 'Erreur réseau lors de l\'upload. Vérifiez votre connexion Internet et réessayez.',
        })
      })

      // Gérer l'annulation
      xhr.addEventListener('abort', () => {
        resolve({
          success: false,
          error: 'Upload annulé',
        })
      })

      // Envoyer le fichier directement à S3 avec PUT
      xhr.open('PUT', presignedUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    })
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Upload une image de signature (base64) vers S3
 * @param dataURL L'image en format base64 data URL
 * @param participationId L'ID de la participation
 * @param onProgress Callback optionnel pour suivre la progression
 * @returns L'URL du fichier uploadé ou une erreur
 */
export async function uploadSignatureToS3(
  dataURL: string,
  participationId?: string,
  onProgress?: (percentage: number) => void
): Promise<UploadResult> {
  try {
    // Convertir le data URL en Blob
    const response = await fetch(dataURL)
    const blob = await response.blob()

    // Créer un File object
    const file = new File([blob], 'signature.png', { type: 'image/png' })

    // Uploader vers S3 via l'API
    return await uploadFileToS3(file, 'signatures', participationId, onProgress)
  } catch (error) {
    console.error('Erreur lors de l\'upload de la signature:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}

/**
 * Valider la taille et le type d'un fichier
 * @param file Le fichier à valider
 * @param maxSizeMB La taille maximale en MB
 * @param allowedTypes Les types MIME autorisés
 * @returns true si le fichier est valide, sinon un message d'erreur
 */
export function validateFile(
  file: File,
  maxSizeMB: number,
  allowedTypes: string[]
): { valid: boolean; error?: string } {
  // Vérifier la taille
  const fileSizeMB = file.size / 1024 / 1024
  if (fileSizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `Le fichier est trop volumineux (${fileSizeMB.toFixed(2)} MB). Taille maximale : ${maxSizeMB} MB`,
    }
  }

  // Vérifier le type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Type de fichier non autorisé. Types acceptés : ${allowedTypes.join(', ')}`,
    }
  }

  return { valid: true }
}


