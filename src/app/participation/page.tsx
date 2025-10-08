'use client'

import React, { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import type { TablesInsert } from '@/lib/database.types'
import SignatureCanvas from 'react-signature-canvas'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { uploadFileToS3, uploadSignatureToS3, validateFile } from '@/lib/s3-upload-client'

type ParticipationData = TablesInsert<'participations'>

const CATEGORIES = [
  'Embauche de salarié/agent en situation de handicap',
  'Maintien dans l\'emploi d\'un salarié/agent en situation de handicap',
  'Embauche en alternance d\'un salarié/agent en situation de handicap',
  'Collaboration de l\'établissement avec des Entreprises adaptées et/ou ESAT'
]

export default function FormulaireParticipation() {
  const [etapeActuelle, setEtapeActuelle] = useState(1)
  const [loading, setLoading] = useState(false)
  const [participationId, setParticipationId] = useState<string | null>(null)
  const signatureRef = useRef<SignatureCanvas>(null)
  
  // React Hook Form - Utiliser watch uniquement pour les champs spécifiques
  const { register, getValues, setValue, watch, formState: { errors } } = useForm<Partial<ParticipationData>>({
    defaultValues: {
      etape_actuelle: 1,
      statut: 'draft'
    },
    mode: 'onBlur' // Valider seulement lors de la perte de focus
  })

  // Surveiller uniquement le champ categories_selectionnees pour l'étape 3
  const categoriesSelectionnees = watch('categories_selectionnees')

  const saveParticipation = async (data: Partial<ParticipationData>) => {
    try {
      if (participationId) {
        const { error } = await supabase
          .from('participations')
          .update(data)
          .eq('id', participationId)
        
        if (error) throw error
      } else {
        const insertData = {
          ...data,
          nom_etablissement: data.nom_etablissement || '',
          email: data.email || '',
          nom_candidat: data.nom_candidat || '',
          prenom_candidat: data.prenom_candidat || '',
          qualite_agissant: data.qualite_agissant || '',
          nom_structure: data.nom_structure || '',
          siret: data.siret || '',
          naf: data.naf || '',
          consentement_candidature: data.consentement_candidature || false
        }
        
        const { data: newParticipation, error } = await supabase
          .from('participations')
          .insert(insertData)
          .select()
          .single()
        
        if (error) throw error
        if (newParticipation) {
          setParticipationId(newParticipation.id)
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      throw error
    }
  }

  const validateEtape = (etape: number): boolean => {
    const values = getValues()
    switch (etape) {
      case 1:
        return !!(
          values.nom_etablissement &&
          values.nom_candidat &&
          values.prenom_candidat &&
          values.qualite_agissant &&
          values.nom_structure &&
          values.email &&
          values.siret &&
          values.naf &&
          values.consentement_candidature
        )
      case 2:
        return true
      case 3:
        return !!(values.categories_selectionnees && values.categories_selectionnees.length > 0)
      case 4:
        return !!(values.video_s3_url && values.autorisation_diffusion_video)
      case 5:
        return !!(values.acceptation_reglement && values.signature_image_s3_url)
      default:
        return true
    }
  }

  const handleNext = async () => {
    if (!validateEtape(etapeActuelle)) {
      toast.error('Veuillez remplir tous les champs obligatoires avant de continuer.')
      return
    }

    setLoading(true)
    try {
      const currentData = { ...getValues(), etape_actuelle: etapeActuelle + 1 }
      await saveParticipation(currentData)
      toast.success('Étape sauvegardée avec succès !')
      setEtapeActuelle(prev => prev + 1)
    } catch {
      toast.error('Erreur lors de la sauvegarde. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrevious = () => {
    if (etapeActuelle > 1) {
      setEtapeActuelle(prev => prev - 1)
    }
  }

  const handleFinalSubmit = async () => {
    if (!validateEtape(5)) {
      toast.error('Veuillez accepter le règlement avant de soumettre.')
      return
    }

    setLoading(true)
    try {
      const finalData = { 
        ...getValues(), 
        formulaire_complete: true,
        statut: 'en attente',
        etape_actuelle: 5
      }
      await saveParticipation(finalData)
      toast.success('🎉 Formulaire soumis avec succès !', {
        description: 'Votre candidature a été enregistrée et sera traitée dans les plus brefs délais.',
        duration: 5000
      })
      
      // Rediriger vers la page de confirmation avec les données
      setTimeout(() => {
        const params = new URLSearchParams({
          nom_etablissement: finalData.nom_etablissement || '',
          nom_candidat: finalData.nom_candidat || '',
          prenom_candidat: finalData.prenom_candidat || '',
          email: finalData.email || '',
          participation_id: participationId || ''
        })
        window.location.href = `/participation-confirmation?${params.toString()}`
      }, 2000)
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      toast.error('Erreur lors de la soumission', {
        description: 'Veuillez vérifier votre connexion et réessayer.',
        duration: 4000
      })
    } finally {
      setLoading(false)
    }
  }

  const clearSignature = () => {
    signatureRef.current?.clear()
    setValue('signature_image_s3_url', null)
    toast.info('Signature effacée')
  }

  const saveSignature = async () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast.error('Aucune signature à enregistrer')
      return
    }

    const signatureDataURL = signatureRef.current.toDataURL()
    
    // Upload vers S3
    const uploadToastId = toast.loading('Enregistrement de la signature...', {
      description: 'Upload en cours'
    })
    
    try {
      const result = await uploadSignatureToS3(signatureDataURL, participationId || undefined)
      
      if (result.success && result.url) {
        setValue('signature_image_s3_url', result.url)
        
        // Sauvegarder automatiquement l'URL dans la base de données
        const currentData = { ...getValues(), signature_image_s3_url: result.url }
        await saveParticipation(currentData)
        
        toast.success('Signature enregistrée avec succès !', {
          id: uploadToastId,
          description: 'Signature uploadée sur S3'
        })
      } else {
        throw new Error(result.error || 'Erreur inconnue')
      }
    } catch (error) {
      console.error('Erreur upload signature:', error)
      toast.error('Erreur lors de l\'enregistrement', {
        id: uploadToastId,
        description: error instanceof Error ? error.message : 'Veuillez réessayer'
      })
    }
  }

  // ÉTAPE 1: Informations générales
  const Etape1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Candidature</h1>
        <p className="text-lg font-semibold">Étape 1</p>
        <p className="text-sm text-gray-600 mt-4">
          Date limite de dépôt du présent dossier de candidature : Vendredi 28 octobre 2024 à 12h00
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Informations générales du candidat/établissement</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom de l&apos;établissement *</label>
            <input
              type="text"
              required
              className="w-full p-3 border border-gray-300 rounded-md"
              {...register('nom_etablissement', { required: true })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Nom du candidat *</label>
            <input
              type="text"
              required
              className="w-full p-3 border border-gray-300 rounded-md"
              {...register('nom_candidat', { required: true })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Prénom du candidat *</label>
            <input
              type="text"
              required
              className="w-full p-3 border border-gray-300 rounded-md"
              {...register('prenom_candidat', { required: true })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Agissant en qualité de *</label>
            <input
              type="text"
              required
              className="w-full p-3 border border-gray-300 rounded-md"
              {...register('qualite_agissant', { required: true })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Présentation de votre établissement</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom de la structure *</label>
            <input
              type="text"
              required
              className="w-full p-3 border border-gray-300 rounded-md"
              {...register('nom_structure', { required: true })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Dénomination commerciale</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-md"
              {...register('denomination_commerciale')}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Adresse (siège social)</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md"
              rows={3}
              {...register('adresse_siege_social')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Adresse email *</label>
            <input
              type="email"
              required
              className="w-full p-3 border border-gray-300 rounded-md"
              {...register('email', { required: true })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Numéro de téléphone</label>
            <input
              type="tel"
              className="w-full p-3 border border-gray-300 rounded-md"
              {...register('telephone')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Date de création</label>
            <input
              type="date"
              className="w-full p-3 border border-gray-300 rounded-md"
              {...register('date_creation')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Forme juridique</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-md"
              {...register('forme_juridique')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">N° SIRET *</label>
            <input
              type="text"
              required
              className="w-full p-3 border border-gray-300 rounded-md"
              {...register('siret', { required: true })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">N° NAF *</label>
            <input
              type="text"
              required
              className="w-full p-3 border border-gray-300 rounded-md"
              {...register('naf', { required: true })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Capital social</label>
            <input
              type="number"
              className="w-full p-3 border border-gray-300 rounded-md"
              {...register('capital_social', { valueAsNumber: true })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Effectif de l&apos;établissement au 30 septembre 2023</label>
            <input
              type="number"
              className="w-full p-3 border border-gray-300 rounded-md"
              {...register('effectif_2023', { valueAsNumber: true })}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2">Activité principale</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-md"
              rows={3}
              {...register('activite_principale')}
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <label className="flex items-start space-x-3">
          <input
            type="checkbox"
            required
            className="mt-1"
            {...register('consentement_candidature', { required: true })}
          />
          <span className="text-sm">
            Oui, je souhaite la candidature de mon établissement au concours : Les Trophées des administrateurs &amp; entreprises inclusives de Bpifrance. J&apos;ai pris connaissance du règlement de ce concours, et j&apos;en accepte les termes.
          </span>
        </label>
      </div>
    </div>
  )

  // ÉTAPE 2: Informations entreprise
  const Etape2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Informations entreprise</h1>
        <p className="text-lg font-semibold">Étape 2</p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Questions sur votre entreprise</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Décrivez l&apos;activité de votre établissement
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={4}
                {...register('description_activite')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Décrivez votre clientèle
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={4}
                {...register('description_clientele')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Décrivez vos produits et services
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={4}
                {...register('description_produits_services')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Modes de communication utilisés
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={4}
                {...register('modes_communication')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Comment soutenez-vous la Martinique ?
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={4}
                {...register('support_martinique')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Points forts de votre établissement
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={4}
                {...register('points_forts')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Points faibles et axes d&apos;amélioration
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={4}
                {...register('points_faibles')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Démarche de transition numérique
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={4}
                {...register('demarche_transition_numerique')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Approche de l&apos;inclusion des personnes en situation de handicap
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={4}
                {...register('inclusion_handicap_approche')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Besoins spécifiques pour l&apos;inclusion handicap
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={4}
                {...register('inclusion_handicap_besoins')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Pourcentage de travailleurs en situation de handicap
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={4}
                {...register('pourcentage_travailleurs_handicap')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Accompagnement à l&apos;embauche de personnes en situation de handicap
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={4}
                {...register('embauche_accompagnement_handicap')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Collaboration avec des entreprises adaptées
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={4}
                {...register('collaboration_entreprises_adaptees')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Raison de votre participation
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={4}
                {...register('raison_participation')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Axes de progrès souhaités
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md"
                rows={4}
                {...register('axes_progres')}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // ÉTAPE 3: Sélection des catégories
  const Etape3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Sélection de la catégorie</h1>
        <p className="text-lg font-semibold">Étape 3</p>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-600 mb-4">
          Sélectionnez la ou les catégories qui correspondent le mieux à votre établissement :
        </p>
        
        {CATEGORIES.map((categorie, index) => (
          <label key={index} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1"
              value={categorie}
              onChange={(e) => {
                const categories = categoriesSelectionnees || []
                if (e.target.checked) {
                  setValue('categories_selectionnees', [...categories, categorie])
                } else {
                  setValue('categories_selectionnees', categories.filter(c => c !== categorie))
                }
              }}
              checked={categoriesSelectionnees?.includes(categorie) || false}
            />
            <div>
              <p className="font-medium">{categorie}</p>
              <p className="text-sm text-gray-600 mt-1">
                {index === 0 && "L'entreprise a recruté une ou plusieurs personnes en situation de handicap en contrat à durée indéterminée (CDI) ou en contrat à durée déterminée (CDD) d'au moins 6 mois."}
                {index === 1 && "L'entreprise a mis en place des actions pour maintenir dans l'emploi un salarié devenu handicapé (aménagement de poste, formation, etc.)."}
                {index === 2 && "L'entreprise a recruté un ou plusieurs alternants (apprentissage, contrat de professionnalisation) en situation de handicap."}
                {index === 3 && "Les petites et moyennes entreprises (PME), les grandes entreprises et les administrations ont la possibilité de sous-traiter certaines activités à des établissements du secteur adapté et protégé. Ce mécanisme leur permet de soutenir activement l'emploi des personnes en situation de handicap et, le cas échéant, de réduire leur contribution à l'Agefiph/FIPHFP."}
              </p>
            </div>
          </label>
        ))}
      </div>
    </div>
  )

  // ÉTAPE 4: Chargement vidéo
  const Etape4 = () => {
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [isUploading, setIsUploading] = useState(false)
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)

    const onDrop = async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      
      // Valider le fichier
      const validation = validateFile(file, 500, ['video/mp4', 'video/quicktime', 'video/x-msvideo'])
      if (!validation.valid) {
        toast.error('Fichier invalide', {
          description: validation.error
        })
        return
      }
      
      setVideoFile(file)
      setIsUploading(true)
      setUploadProgress(0)
      
      // Créer une URL de prévisualisation locale
      const localPreviewUrl = URL.createObjectURL(file)
      setVideoPreviewUrl(localPreviewUrl)
      
      // Upload vers S3 via API avec progression
      let uploadToastId: string | number = ''
      
      try {
        const result = await uploadFileToS3(
          file, 
          'videos', 
          participationId || undefined,
          (percentage) => {
            setUploadProgress(percentage)
            // Mettre à jour le toast avec la progression
            if (uploadToastId) {
              toast.loading(`Upload de la vidéo: ${percentage}%`, {
                id: uploadToastId,
                description: `${file.name} - ${(file.size / 1024 / 1024).toFixed(2)} MB`
              })
            } else {
              uploadToastId = toast.loading(`Upload de la vidéo: ${percentage}%`, {
                description: `${file.name} - ${(file.size / 1024 / 1024).toFixed(2)} MB`
              })
            }
          }
        )
        
        if (result.success && result.url) {
          setValue('video_s3_url', result.url)
          
          // Sauvegarder automatiquement l'URL dans la base de données
          const currentData = { ...getValues(), video_s3_url: result.url }
          await saveParticipation(currentData)
          
          toast.success('Vidéo uploadée avec succès !', {
            id: uploadToastId,
            description: `${file.name} - ${(file.size / 1024 / 1024).toFixed(2)} MB`
          })
        } else {
          throw new Error(result.error || 'Erreur inconnue')
        }
      } catch (error) {
        console.error('Erreur upload vidéo:', error)
        toast.error('Erreur lors de l\'upload', {
          id: uploadToastId,
          description: error instanceof Error ? error.message : 'Veuillez réessayer'
        })
        setVideoFile(null)
        setVideoPreviewUrl(null)
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    }

    const { getRootProps: getVideoRootProps, getInputProps: getVideoInputProps, isDragActive: isVideoDragActive } = useDropzone({
      onDrop,
      accept: {
        'video/*': ['.mp4', '.mov', '.avi']
      },
      maxFiles: 1
    })

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Vidéo de présentation</h1>
          <p className="text-lg font-semibold">Étape 4</p>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Téléchargez votre vidéo</h3>
            <p className="text-sm text-gray-600 mb-4">
              Formats acceptés : MP4, MOV, AVI - Taille maximale : 500 MB
            </p>

            <div
              {...getVideoRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isVideoDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
              } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
            >
              <input {...getVideoInputProps()} disabled={isUploading} />
              <div className="space-y-2">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm text-gray-600">
                  {isVideoDragActive ? 'Déposez la vidéo ici...' : 'Glissez-déposez votre vidéo ici, ou cliquez pour sélectionner'}
                </p>
                {videoFile && (
                  <p className="text-sm font-medium text-green-600">
                    ✓ Fichier sélectionné : {videoFile.name}
                  </p>
                )}
              </div>
            </div>

            {/* Barre de progression */}
            {isUploading && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Upload en cours...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Prévisualisation de la vidéo */}
            {videoPreviewUrl && !isUploading && (
              <div className="mt-6">
                <h4 className="text-md font-semibold mb-3">Aperçu de votre vidéo</h4>
                <div className="relative">
                  <video
                    src={videoPreviewUrl}
                    controls
                    className="w-full max-w-2xl mx-auto rounded-lg shadow-sm"
                    preload="metadata"
                  >
                    Votre navigateur ne supporte pas la lecture de vidéos.
                  </video>
                  <div className="mt-2 text-center">
                    <p className="text-sm text-gray-600">
                      ✓ Vidéo uploadée avec succès sur S3
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                required
                className="mt-1"
                {...register('autorisation_diffusion_video', { required: true })}
              />
              <span className="text-sm">
                J&apos;autorise la diffusion des vidéos sur la plateforme publique *
              </span>
            </label>
            {errors.autorisation_diffusion_video && (
              <p className="text-red-500 text-sm mt-1">
                Vous devez autoriser la diffusion pour continuer
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ÉTAPE 5: Documents et signature
  const Etape5 = () => {
    const [attestationFile, setAttestationFile] = useState<File | null>(null)
    const [kbisFile, setKbisFile] = useState<File | null>(null)

    const onDropAttestation = async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      
      // Valider le fichier
      const validation = validateFile(file, 10, ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'])
      if (!validation.valid) {
        toast.error('Fichier invalide', {
          description: validation.error
        })
        return
      }
      
      setAttestationFile(file)
      
      // Upload vers S3
      const uploadToastId = toast.loading('Upload de l\'attestation en cours...', {
        description: `Fichier : ${file.name}`
      })
      
      try {
        const result = await uploadFileToS3(file, 'documents', participationId || undefined)
        
        if (result.success && result.url) {
          setValue('attestation_regularite_s3_url', result.url)
          
          // Sauvegarder automatiquement l'URL dans la base de données
          const currentData = { ...getValues(), attestation_regularite_s3_url: result.url }
          await saveParticipation(currentData)
          
          toast.success('Attestation uploadée avec succès !', {
            id: uploadToastId,
            description: `${file.name} - ${(file.size / 1024).toFixed(2)} KB`
          })
        } else {
          throw new Error(result.error || 'Erreur inconnue')
        }
      } catch (error) {
        console.error('Erreur upload attestation:', error)
        toast.error('Erreur lors de l\'upload', {
          id: uploadToastId,
          description: error instanceof Error ? error.message : 'Veuillez réessayer'
        })
        setAttestationFile(null)
      }
    }

    const onDropKBIS = async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      
      // Valider le fichier
      const validation = validateFile(file, 10, ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'])
      if (!validation.valid) {
        toast.error('Fichier invalide', {
          description: validation.error
        })
        return
      }
      
      setKbisFile(file)
      
      // Upload vers S3
      const uploadToastId = toast.loading('Upload du KBIS en cours...', {
        description: `Fichier : ${file.name}`
      })
      
      try {
        const result = await uploadFileToS3(file, 'documents', participationId || undefined)
        
        if (result.success && result.url) {
          setValue('fiche_insee_kbis_s3_url', result.url)
          
          // Sauvegarder automatiquement l'URL dans la base de données
          const currentData = { ...getValues(), fiche_insee_kbis_s3_url: result.url }
          await saveParticipation(currentData)
          
          toast.success('KBIS uploadé avec succès !', {
            id: uploadToastId,
            description: `${file.name} - ${(file.size / 1024).toFixed(2)} KB`
          })
        } else {
          throw new Error(result.error || 'Erreur inconnue')
        }
      } catch (error) {
        console.error('Erreur upload KBIS:', error)
        toast.error('Erreur lors de l\'upload', {
          id: uploadToastId,
          description: error instanceof Error ? error.message : 'Veuillez réessayer'
        })
        setKbisFile(null)
      }
    }

    const { getRootProps: getAttestationRootProps, getInputProps: getAttestationInputProps, isDragActive: isAttestationDragActive } = useDropzone({
      onDrop: onDropAttestation,
      accept: {
        'application/pdf': ['.pdf'],
        'image/*': ['.jpg', '.jpeg', '.png']
      },
      maxFiles: 1
    })

    const { getRootProps: getKBISRootProps, getInputProps: getKBISInputProps, isDragActive: isKBISDragActive } = useDropzone({
      onDrop: onDropKBIS,
      accept: {
        'application/pdf': ['.pdf'],
        'image/*': ['.jpg', '.jpeg', '.png']
      },
      maxFiles: 1
    })

    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Documents et signature</h1>
          <p className="text-lg font-semibold">Étape 5</p>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Documents requis</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Attestation de régularité fiscale et sociale *
                </label>
                <div
                  {...getAttestationRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isAttestationDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <input {...getAttestationInputProps()} />
                  <p className="text-sm text-gray-600">
                    {isAttestationDragActive ? 'Déposez le document ici...' : 'Cliquez ou glissez-déposez votre attestation (PDF, JPG, PNG)'}
                  </p>
                  {attestationFile && (
                    <p className="text-sm font-medium text-green-600 mt-2">
                      ✓ {attestationFile.name}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Extrait KBIS (moins de 3 mois) *
                </label>
                <div
                  {...getKBISRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isKBISDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                  }`}
                >
                  <input {...getKBISInputProps()} />
                  <p className="text-sm text-gray-600">
                    {isKBISDragActive ? 'Déposez le document ici...' : 'Cliquez ou glissez-déposez votre KBIS (PDF, JPG, PNG)'}
                  </p>
                  {kbisFile && (
                    <p className="text-sm font-medium text-green-600 mt-2">
                      ✓ {kbisFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Règlement et engagement</h3>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm mb-2">
                Documents à consulter :
              </p>
              <ul className="text-sm space-y-1">
                <li>• <a href="#" className="text-blue-600 hover:underline">Le règlement complet du concours</a></li>
                <li>• <a href="#" className="text-blue-600 hover:underline">La fiche d&apos;engagement</a></li>
              </ul>
            </div>

            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                required
                className="mt-1"
                {...register('acceptation_reglement', { required: true })}
              />
              <span className="text-sm">J&apos;ai lu et accepté le règlement</span>
            </label>

            <div>
              <label className="block text-sm font-medium mb-2">Votre signature *</label>
              <div className="border-2 border-gray-300 rounded-lg p-4">
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    className: 'w-full h-40 border border-gray-200 rounded',
                  }}
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                  >
                    Effacer
                  </button>
                  <button
                    type="button"
                    onClick={saveSignature}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Enregistrer la signature
                  </button>
                </div>
                {getValues('signature_image_s3_url') && (
                  <div className="mt-2 text-center">
                    <p className="text-sm text-green-600">
                      ✓ Signature enregistrée avec succès
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderEtape = () => {
    switch (etapeActuelle) {
      case 1: return <Etape1 />
      case 2: return <Etape2 />
      case 3: return <Etape3 />
      case 4: return <Etape4 />
      case 5: return <Etape5 />
      default: return <Etape1 />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Barre de progression */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Étape {etapeActuelle} sur 5</span>
            <span>{Math.round((etapeActuelle / 5) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(etapeActuelle / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Contenu de l'étape */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {renderEtape()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={etapeActuelle === 1}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          
          {etapeActuelle < 5 ? (
            <button
              onClick={handleNext}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Sauvegarde...' : 'Suivant'}
            </button>
          ) : (
            <div className="flex flex-col items-end space-y-2">
              {!getValues('signature_image_s3_url') && (
                <p className="text-sm text-red-600">
                  ⚠️ Vous devez signer et enregistrer votre signature avant de soumettre
                </p>
              )}
              <button
                onClick={handleFinalSubmit}
                disabled={loading || !getValues('signature_image_s3_url')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Envoi...' : 'Soumettre le formulaire'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
