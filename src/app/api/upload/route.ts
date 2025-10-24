import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

// Configuration S3 côté serveur (sécurisé)
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'medef'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string
    const participationId = formData.get('participationId') as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    if (!folder || !['videos', 'documents', 'signatures'].includes(folder)) {
      return NextResponse.json(
        { success: false, error: 'Dossier invalide' },
        { status: 400 }
      )
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = participationId 
      ? `${folder}/${participationId}/${timestamp}-${sanitizedFileName}`
      : `${folder}/${timestamp}-${sanitizedFileName}`

    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`

    // Convertir le File en Buffer pour Node.js
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const fileSizeMB = file.size / (1024 * 1024)

    if (fileSizeMB < 100) {
      // Upload simple pour petits fichiers
      console.log(`[Server] Upload simple pour ${file.name} (${fileSizeMB.toFixed(2)} MB)`)
      
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: file.type,
        ChecksumAlgorithm: 'CRC32',
      })

      await s3Client.send(command)

      return NextResponse.json({
        success: true,
        url: fileUrl,
        size: file.size,
        type: file.type,
      })
    } else {
      // Upload multipart pour gros fichiers
      console.log(`[Server] Upload multipart pour ${file.name} (${fileSizeMB.toFixed(2)} MB)`)
      
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: BUCKET_NAME,
          Key: fileName,
          Body: buffer,
          ContentType: file.type,
          ChecksumAlgorithm: 'CRC32',
        },
        queueSize: 4,
        partSize: 1024 * 1024 * 10, // 10MB par partie
        leavePartsOnError: false,
      })

      // Suivre la progression (optionnel pour logs serveur)
      upload.on('httpUploadProgress', (progress) => {
        if (progress.loaded && progress.total) {
          const percentage = Math.round((progress.loaded / progress.total) * 100)
          console.log(`[Server] Upload progress: ${percentage}%`)
        }
      })

      await upload.done()

      return NextResponse.json({
        success: true,
        url: fileUrl,
        size: file.size,
        type: file.type,
      })
    }
  } catch (error) {
    console.error('[Server] Erreur upload S3:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}

// Limiter la taille maximale des uploads (5 GB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5gb',
    },
  },
}


