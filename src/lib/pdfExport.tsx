import React from 'react'
import { pdf } from '@react-pdf/renderer'
import JSZip from 'jszip'
import { ParticipationPDFTemplate } from '@/components/ParticipationPDFTemplate'
import { convertImageToBase64, convertS3ImageToBase64 } from '@/lib/imageUtils'
import { supabase } from '@/lib/supabase'

type Participation = {
  id: string
  nom_etablissement: string
  nom_candidat: string
  prenom_candidat: string
  qualite_agissant: string
  nom_structure: string
  denomination_commerciale: string | null
  email: string
  telephone: string | null
  statut: string | null
  video_s3_url: string | null
  adresse_siege_social: string | null
  date_creation: string | null
  forme_juridique: string | null
  siret: string
  naf: string
  capital_social: number | null
  effectif_2023: number | null
  activite_principale: string | null
  description_activite: string | null
  description_clientele: string | null
  description_produits_services: string | null
  modes_communication: string | null
  support_martinique: string | null
  points_forts: string | null
  points_faibles: string | null
  demarche_transition_numerique: string | null
  inclusion_handicap_approche: string | null
  inclusion_handicap_besoins: string | null
  pourcentage_travailleurs_handicap: string | null
  embauche_accompagnement_handicap: string | null
  collaboration_entreprises_adaptees: string | null
  raison_participation: string | null
  axes_progres: string | null
  categories_selectionnees: string[] | null
  autorisation_diffusion_video: boolean | null
  attestation_regularite_s3_url: string | null
  fiche_insee_kbis_s3_url: string | null
  signature_image_s3_url: string | null
  attestation_dirigeant_s3_url: string | null
  acceptation_reglement: boolean | null
  etape_actuelle: number | null
  formulaire_complete: boolean | null
  created_at: string | null
  updated_at: string | null
  user_id: string | null
}

// Fonction pour récupérer les noms des catégories depuis la base de données
const getCategoryNames = async (): Promise<{ [key: string]: string }> => {
  try {
    const { data: categories, error } = await supabase
      .from('vote_categories')
      .select('id, name')
    
    if (error) {
      console.warn('Erreur lors de la récupération des catégories:', error)
      return {}
    }
    
    // Créer un mapping ID -> nom
    const categoryMap: { [key: string]: string } = {}
    categories?.forEach(category => {
      categoryMap[category.id.toString()] = category.name
    })
    
    return categoryMap
  } catch (error) {
    console.warn('Erreur lors de la récupération des catégories:', error)
    return {}
  }
}

export const exportParticipationsToPDF = async (
  participations: Participation[],
  onProgress?: (progress: {
    current: number
    total: number
    currentFileName: string
    stage: 'preparing' | 'generating' | 'zipping' | 'completed' | 'error'
    completedFiles: string[]
    failedFiles: string[]
  }) => void
) => {
  // État de progression
  let progressState: {
    current: number
    total: number
    currentFileName: string
    stage: 'preparing' | 'generating' | 'zipping' | 'completed' | 'error'
    completedFiles: string[]
    failedFiles: string[]
  } = {
    current: 0,
    total: 0,
    currentFileName: '',
    stage: 'preparing',
    completedFiles: [],
    failedFiles: []
  }

  // Callback de progression
  const updateProgress = (updates: Partial<typeof progressState>) => {
    progressState = { ...progressState, ...updates }
    onProgress?.(progressState)
  }

  try {

    // Pré-charger l'image header en base64
    let headerImageBase64: string | null = null
    try {
      headerImageBase64 = await convertImageToBase64('/header-pdf.png')
    } catch (error) {
      console.warn('Impossible de charger l\'image header:', error)
      // Continuer sans l'image
    }

    // Récupérer les noms des catégories
    const categoryNames = await getCategoryNames()

    // Filtrer seulement les participations validées
    const validatedParticipations = participations.filter(
      participation => participation.statut === 'validé'
    )

    if (validatedParticipations.length === 0) {
      throw new Error('Aucune participation validée à exporter')
    }

    updateProgress({
      total: validatedParticipations.length,
      stage: 'generating'
    })

    // Créer une instance JSZip
    const zip = new JSZip()

    // Générer un PDF pour chaque participation validée
    const pdfPromises = validatedParticipations.map(async (participation, index) => {
      try {
        // Créer un nom de fichier sécurisé
        const safeName = participation.denomination_commerciale 
          ? participation.denomination_commerciale
              .replace(/[^a-zA-Z0-9\s-_]/g, '') // Supprimer les caractères spéciaux
              .replace(/\s+/g, '_') // Remplacer les espaces par des underscores
              .substring(0, 50) // Limiter la longueur
          : participation.nom_structure
              .replace(/[^a-zA-Z0-9\s-_]/g, '')
              .replace(/\s+/g, '_')
              .substring(0, 50)

        const fileName = `participation_${safeName}_${participation.id.substring(0, 8)}.pdf`
        
        // Mettre à jour la progression
        updateProgress({
          current: index + 1,
          currentFileName: fileName
        })

        // Pré-charger l'image de signature si disponible
        let signatureImageBase64: string | null = null
        if (participation.signature_image_s3_url) {
          try {
            signatureImageBase64 = await convertS3ImageToBase64(participation.signature_image_s3_url)
          } catch (error) {
            console.warn('Impossible de charger l\'image de signature:', error)
            // Continuer sans l'image
          }
        }

        // Générer le PDF
        const pdfBlob = await pdf(<ParticipationPDFTemplate participation={participation} headerImageBase64={headerImageBase64} categoryNames={categoryNames} signatureImageBase64={signatureImageBase64} />).toBlob()
        
        // Ajouter le PDF au ZIP
        zip.file(fileName, pdfBlob)
        
        // Marquer comme réussi
        updateProgress({
          completedFiles: [...progressState.completedFiles, fileName]
        })
        
        return { success: true, fileName, participationId: participation.id }
      } catch (error) {
        console.error(`Erreur lors de la génération du PDF pour la participation ${participation.id}:`, error)
        
        // Marquer comme échoué
        const fileName = `participation_${participation.id.substring(0, 8)}.pdf`
        updateProgress({
          failedFiles: [...progressState.failedFiles, fileName]
        })
        
        return { success: false, fileName: null, participationId: participation.id, error }
      }
    })

    // Attendre que tous les PDFs soient générés
    const results = await Promise.all(pdfPromises)
    
    // Vérifier s'il y a eu des erreurs
    const failedGenerations = results.filter(result => !result.success)
    if (failedGenerations.length > 0) {
      console.warn(`${failedGenerations.length} PDF(s) n'ont pas pu être générés:`, failedGenerations)
    }

    // Mettre à jour la progression pour la création du ZIP
    updateProgress({
      stage: 'zipping',
      currentFileName: 'Création du fichier ZIP...'
    })

    // Générer le ZIP
    const zipBlob = await zip.generateAsync({ type: 'blob' })
    
    // Créer et télécharger le fichier ZIP
    const link = document.createElement('a')
    const url = URL.createObjectURL(zipBlob)
    link.setAttribute('href', url)
    link.setAttribute('download', `participations_validees_${new Date().toISOString().split('T')[0]}.zip`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    // Marquer comme terminé
    updateProgress({
      stage: 'completed',
      currentFileName: 'Export terminé !'
    })

    return {
      success: true,
      totalParticipations: validatedParticipations.length,
      successfulGenerations: results.filter(result => result.success).length,
      failedGenerations: failedGenerations.length
    }

  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error)
    updateProgress({
      stage: 'error',
      currentFileName: 'Erreur lors de l\'export'
    })
    throw error
  }
}

// Fonction utilitaire pour exporter une seule participation
export const exportSingleParticipationToPDF = async (participation: Participation) => {
  try {
    // Pré-charger l'image header en base64
    let headerImageBase64: string | null = null
    try {
      headerImageBase64 = await convertImageToBase64('/header-pdf.png')
    } catch (error) {
      console.warn('Impossible de charger l\'image header:', error)
      // Continuer sans l'image
    }

    // Récupérer les noms des catégories
    const categoryNames = await getCategoryNames()

    // Pré-charger l'image de signature si disponible
    let signatureImageBase64: string | null = null
    if (participation.signature_image_s3_url) {
      try {
        signatureImageBase64 = await convertS3ImageToBase64(participation.signature_image_s3_url)
      } catch (error) {
        console.warn('Impossible de charger l\'image de signature:', error)
        // Continuer sans l'image
      }
    }

    // Générer le PDF
    const pdfBlob = await pdf(<ParticipationPDFTemplate participation={participation} headerImageBase64={headerImageBase64} categoryNames={categoryNames} signatureImageBase64={signatureImageBase64} />).toBlob()
    
    // Créer un nom de fichier sécurisé
    const safeName = participation.denomination_commerciale 
      ? participation.denomination_commerciale
          .replace(/[^a-zA-Z0-9\s-_]/g, '')
          .replace(/\s+/g, '_')
          .substring(0, 50)
      : participation.nom_structure
          .replace(/[^a-zA-Z0-9\s-_]/g, '')
          .replace(/\s+/g, '_')
          .substring(0, 50)

    const fileName = `participation_${safeName}_${participation.id.substring(0, 8)}.pdf`
    
    // Créer et télécharger le fichier PDF
    const link = document.createElement('a')
    const url = URL.createObjectURL(pdfBlob)
    link.setAttribute('href', url)
    link.setAttribute('download', fileName)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    return { success: true, fileName }

  } catch (error) {
    console.error('Erreur lors de l\'export PDF de la participation:', error)
    throw error
  }
}
