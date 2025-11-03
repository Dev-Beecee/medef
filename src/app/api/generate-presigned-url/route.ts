import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

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
    const body = await request.json()
    const { fileName, fileType, folder, participationId } = body

    if (!fileName || !fileType || !folder) {
      return NextResponse.json(
        { success: false, error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    if (!['videos', 'documents', 'signatures'].includes(folder)) {
      return NextResponse.json(
        { success: false, error: 'Dossier invalide' },
        { status: 400 }
      )
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now()
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const key = participationId 
      ? `${folder}/${participationId}/${timestamp}-${sanitizedFileName}`
      : `${folder}/${timestamp}-${sanitizedFileName}`

    // Créer la commande pour upload
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    })

    // Générer une URL signée valide pendant 1 heure
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 heure
    })

    // URL finale du fichier (après upload)
    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`

    return NextResponse.json({
      success: true,
      presignedUrl,
      fileUrl,
      key,
    })
  } catch (error) {
    console.error('[Server] Erreur génération Presigned URL:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    )
  }
}

// Cette fonction est très rapide (< 1 seconde), pas besoin de maxDuration élevé
export const maxDuration = 10 // 10 secondes suffisent

