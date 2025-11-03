'use client'

import React, { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import type { TablesInsert } from '@/lib/database.types'
import SignatureCanvas from 'react-signature-canvas'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { uploadFileToS3, uploadSignatureToS3, validateFile } from '@/lib/s3-upload-client'
import Image from 'next/image'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

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
  const [isPacteDialogOpen, setIsPacteDialogOpen] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const signatureRef = useRef<SignatureCanvas>(null)
  
  // États pour la recherche par email
  const [showEmailSearch, setShowEmailSearch] = useState(true)
  const [searchEmail, setSearchEmail] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [participationStatus, setParticipationStatus] = useState<'none' | 'draft' | 'submitted'>('none')

  // React Hook Form - Utiliser watch uniquement pour les champs spécifiques
  const { register, getValues, setValue, watch } = useForm<Partial<ParticipationData>>({
    defaultValues: {
      etape_actuelle: 1,
      statut: 'draft'
    },
    mode: 'onBlur' // Valider seulement lors de la perte de focus
  })

  // Surveiller uniquement le champ categories_selectionnees pour l'étape 3
  const categoriesSelectionnees = watch('categories_selectionnees')

  // Fonction pour scroller vers un élément en erreur
  const scrollToError = (fieldName: string) => {
    const element = document.querySelector(`[name="${fieldName}"]`) ||
      document.querySelector(`[data-field="${fieldName}"]`)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
      // Focus sur l'élément si c'est un input
      if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
        element.focus()
      }
    }
  }

  // Fonction helper pour convertir les valeurs en string
  const getStringValue = (value: string | number | boolean | string[] | null | undefined): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'number') return value.toString()
    if (typeof value === 'boolean') return value.toString()
    if (Array.isArray(value)) return value.join(', ')
    return ''
  }

  // Fonction pour valider un champ spécifique
  const validateField = (fieldName: string, value: string | number | boolean | string[] | null | undefined): string => {
    const stringValue = getStringValue(value)

    switch (fieldName) {
      case 'nom_etablissement':
        return !stringValue || stringValue.trim() === '' ? 'Le nom de l\'établissement est obligatoire' : ''
      case 'nom_candidat':
        return !stringValue || stringValue.trim() === '' ? 'Le nom du candidat est obligatoire' : ''
      case 'prenom_candidat':
        return !stringValue || stringValue.trim() === '' ? 'Le prénom du candidat est obligatoire' : ''
      case 'qualite_agissant':
        return !stringValue || stringValue.trim() === '' ? 'La qualité d\'agissant est obligatoire' : ''
      case 'nom_structure':
        return !stringValue || stringValue.trim() === '' ? 'Le nom de la structure est obligatoire' : ''
      case 'email':
        if (!stringValue || stringValue.trim() === '') return 'L\'adresse email est obligatoire'
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return !emailRegex.test(stringValue) ? 'Veuillez saisir une adresse email valide' : ''
      case 'siret':
        return !stringValue || stringValue.trim() === '' ? 'Le numéro SIRET est obligatoire' : ''
      case 'naf':
        return !stringValue || stringValue.trim() === '' ? 'Le code NAF est obligatoire' : ''
      case 'consentement_candidature':
        return !value ? 'Vous devez accepter les conditions de candidature' : ''
      case 'denomination_commerciale':
        return !stringValue || stringValue.trim() === '' ? 'La dénomination commerciale est obligatoire' : ''
      case 'adresse_siege_social':
        return !stringValue || stringValue.trim() === '' ? 'L\'adresse du siège social est obligatoire' : ''
      case 'telephone':
        return !stringValue || stringValue.trim() === '' ? 'Le numéro de téléphone est obligatoire' : ''
      case 'date_creation':
        return !value ? 'La date de création est obligatoire' : ''
      case 'forme_juridique':
        return !stringValue || stringValue.trim() === '' ? 'La forme juridique est obligatoire' : ''
      case 'capital_social':
        return !value ? 'Le capital social est obligatoire' : ''
      case 'effectif_2023':
        return !value ? 'L\'effectif au 30 décembre 2024 est obligatoire' : ''
      case 'activite_principale':
        return !stringValue || stringValue.trim() === '' ? 'L\'activité principale est obligatoire' : ''
      case 'description_activite':
        return !stringValue || stringValue.trim() === '' ? 'La description de l\'activité est obligatoire' : ''
      case 'description_clientele':
        return !stringValue || stringValue.trim() === '' ? 'La description de la clientèle est obligatoire' : ''
      case 'description_produits_services':
        return !stringValue || stringValue.trim() === '' ? 'La description des produits et services est obligatoire' : ''
      case 'modes_communication':
        return !stringValue || stringValue.trim() === '' ? 'Les modes de communication sont obligatoires' : ''
      case 'support_martinique':
        return !stringValue || stringValue.trim() === '' ? 'Le soutien à la Martinique est obligatoire' : ''
      case 'points_forts':
        return !stringValue || stringValue.trim() === '' ? 'Les points forts sont obligatoires' : ''
      case 'points_faibles':
        return !stringValue || stringValue.trim() === '' ? 'Les points faibles et axes d\'amélioration sont obligatoires' : ''
      case 'demarche_transition_numerique':
        return !stringValue || stringValue.trim() === '' ? 'La démarche de transition numérique est obligatoire' : ''
      case 'inclusion_handicap_approche':
        return !stringValue || stringValue.trim() === '' ? 'L\'approche de l\'inclusion des personnes en situation de handicap est obligatoire' : ''
      case 'inclusion_handicap_besoins':
        return !stringValue || stringValue.trim() === '' ? 'Les besoins spécifiques pour l\'inclusion handicap sont obligatoires' : ''
      case 'pourcentage_travailleurs_handicap':
        return !stringValue || stringValue.trim() === '' ? 'Le pourcentage de travailleurs en situation de handicap est obligatoire' : ''
      case 'embauche_accompagnement_handicap':
        return !stringValue || stringValue.trim() === '' ? 'L\'accompagnement à l\'embauche de personnes en situation de handicap est obligatoire' : ''
      case 'collaboration_entreprises_adaptees':
        return !stringValue || stringValue.trim() === '' ? 'La collaboration avec des entreprises adaptées est obligatoire' : ''
      case 'raison_participation':
        return !stringValue || stringValue.trim() === '' ? 'La raison de votre participation est obligatoire' : ''
      case 'axes_progres':
        return !stringValue || stringValue.trim() === '' ? 'Les axes de progrès souhaités sont obligatoires' : ''
      case 'attestation_regularite_s3_url':
        return !value ? 'L\'attestation de régularité fiscale et sociale est obligatoire' : ''
      case 'fiche_insee_kbis_s3_url':
        return !value ? 'L\'extrait KBIS est obligatoire' : ''
      case 'categories_selectionnees':
        return !value || (Array.isArray(value) && value.length === 0) ? 'Vous devez sélectionner au moins une catégorie' : ''
      case 'video_s3_url':
        return !value ? 'Vous devez télécharger une vidéo de présentation' : ''
      case 'autorisation_diffusion_video':
        return !value ? 'Vous devez autoriser la diffusion de la vidéo' : ''
      case 'acceptation_reglement':
        return !value ? 'Vous devez accepter le règlement' : ''
      case 'signature_image_s3_url':
        return !value ? 'Vous devez signer le formulaire' : ''
      default:
        return ''
    }
  }

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

  // Fonction pour rechercher une participation existante par email
  const searchExistingParticipation = async (email: string) => {
    if (!email || !email.includes('@')) {
      toast.error('Veuillez saisir une adresse email valide')
      return
    }

    setIsSearching(true)
    try {
      const { data, error } = await supabase
        .from('participations')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows found
      
      if (data) {
        setParticipationId(data.id)
        
        // Déterminer le statut de la participation
        if (data.formulaire_complete && data.statut === 'en attente') {
          setParticipationStatus('submitted')
          toast.info('Une participation a déjà été soumise avec cet email. Vous ne pouvez pas la modifier.')
          return
        } else if (data.statut === 'draft' || !data.formulaire_complete) {
          setParticipationStatus('draft')
          setEtapeActuelle(data.etape_actuelle || 1)
          
          // Pré-remplir le formulaire avec les données existantes
          Object.keys(data).forEach(key => {
            const typedKey = key as keyof ParticipationData
            if (data[typedKey] !== null && data[typedKey] !== undefined) {
              setValue(typedKey, data[typedKey])
            }
          })
          
          toast.success('Participation en brouillon trouvée ! Vous pouvez reprendre où vous vous êtes arrêté.')
          setShowEmailSearch(false)
        }
      } else {
        setParticipationStatus('none')
        toast.info('Aucune participation trouvée pour cet email. Vous pouvez commencer une nouvelle participation.')
        setShowEmailSearch(false)
      }
    } catch (error) {
      console.error('Erreur recherche participation:', error)
      toast.error('Erreur lors de la recherche de votre participation')
    } finally {
      setIsSearching(false)
    }
  }

  // Fonction pour sauvegarder la participation en brouillon
  const saveDraftParticipation = async () => {
    setLoading(true)
    try {
      const currentData = { 
        ...getValues(), 
        etape_actuelle: etapeActuelle,
        statut: 'draft',
        formulaire_complete: false
      }
      
      await saveParticipation(currentData)
      toast.success('Participation sauvegardée en brouillon !', {
        description: 'Vous pouvez reprendre votre participation plus tard en saisissant votre email.'
      })
    } catch (error) {
      console.error('Erreur lors de la sauvegarde en brouillon:', error)
      toast.error('Erreur lors de la sauvegarde', {
        description: 'Veuillez vérifier votre connexion et réessayer.'
      })
    } finally {
      setLoading(false)
    }
  }

  const validateEtape = (etape: number): { isValid: boolean; firstErrorField?: string } => {
    const values = getValues()
    const errors: Record<string, string> = {}
    let firstErrorField: string | undefined

    switch (etape) {
      case 1:
        const fieldsEtape1 = [
          'nom_etablissement', 'nom_candidat', 'prenom_candidat',
          'qualite_agissant', 'nom_structure', 'denomination_commerciale',
          'adresse_siege_social', 'email', 'telephone', 'date_creation',
          'forme_juridique', 'siret', 'naf', 'capital_social',
          'effectif_2023', 'activite_principale', 'consentement_candidature'
        ]
        fieldsEtape1.forEach(field => {
          const error = validateField(field, values[field as keyof typeof values])
          if (error) {
            errors[field] = error
            if (!firstErrorField) firstErrorField = field
          }
        })
        break
      case 2:
        const fieldsEtape2 = [
          'description_activite', 'description_clientele', 'description_produits_services',
          'modes_communication', 'support_martinique', 'points_forts', 'points_faibles',
          'demarche_transition_numerique', 'inclusion_handicap_approche', 'inclusion_handicap_besoins',
          'pourcentage_travailleurs_handicap', 'embauche_accompagnement_handicap',
          'collaboration_entreprises_adaptees', 'raison_participation', 'axes_progres'
        ]
        fieldsEtape2.forEach(field => {
          const error = validateField(field, values[field as keyof typeof values])
          if (error) {
            errors[field] = error
            if (!firstErrorField) firstErrorField = field
          }
        })
        break
      case 3:
        const errorCategories = validateField('categories_selectionnees', values.categories_selectionnees)
        if (errorCategories) {
          errors['categories_selectionnees'] = errorCategories
          firstErrorField = 'categories_selectionnees'
        }
        break
      case 4:
        const fieldsEtape4 = ['video_s3_url', 'autorisation_diffusion_video']
        fieldsEtape4.forEach(field => {
          const error = validateField(field, values[field as keyof typeof values])
          if (error) {
            errors[field] = error
            if (!firstErrorField) firstErrorField = field
          }
        })
        break
      case 5:
        const fieldsEtape5 = ['attestation_regularite_s3_url', 'fiche_insee_kbis_s3_url', 'acceptation_reglement', 'signature_image_s3_url']
        fieldsEtape5.forEach(field => {
          const error = validateField(field, values[field as keyof typeof values])
          if (error) {
            errors[field] = error
            if (!firstErrorField) firstErrorField = field
          }
        })
        break
    }

    setValidationErrors(errors)
    return { isValid: Object.keys(errors).length === 0, firstErrorField }
  }

  const handleNext = async () => {
    const validation = validateEtape(etapeActuelle)
    if (!validation.isValid) {
      toast.error('Veuillez remplir tous les champs obligatoires avant de continuer.')
      if (validation.firstErrorField) {
        scrollToError(validation.firstErrorField)
      }
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
    const validation = validateEtape(5)
    if (!validation.isValid) {
      toast.error('Veuillez remplir tous les champs obligatoires avant de soumettre.')
      if (validation.firstErrorField) {
        scrollToError(validation.firstErrorField)
      }
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

  // Composant pour afficher les messages d'erreur
  const ErrorMessage = ({ fieldName }: { fieldName: string }) => {
    const error = validationErrors[fieldName]
    if (!error) return null

    return (
      <p className="text-red-400 text-sm mt-1 flex items-center gap-1">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {error}
      </p>
    )
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
        <p className="text-lg font-semibold" style={{ backgroundColor: '#DBB572', color: '#10214B', width: 'max-content', padding: '3px 14px', margin: 'auto', borderRadius: '5px' }}>Étape 1</p>
        <h1 className="text-3xl font-bold mb-4 mt-4 uppercase" style={{ color: '#DBB572' }}>Candidature</h1>
        <div className="text-center mb-8" style={{ backgroundColor: '#DBB572', color: '#10214B', padding: '40px', borderRadius: '20px' }}>
          <p>
            Présentez les informations essentielles de votre entreprise ou établissement.
          </p>
          <p>Remplissez tous les champs obligatoires avant de passer à l&apos;étape suivante.</p>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M31.501 14.9969H4.50098M31.501 18.7469V13.1969C31.501 10.6767 31.501 9.41659 31.0105 8.45399C30.5791 7.60726 29.8907 6.91885 29.0439 6.48742C28.0813 5.99695 26.8212 5.99695 24.301 5.99695H11.701C9.18074 5.99695 7.92062 5.99695 6.95802 6.48742C6.11129 6.91885 5.42288 7.60726 4.99145 8.45399C4.50098 9.41659 4.50098 10.6767 4.50098 13.1969V25.7969C4.50098 28.3172 4.50098 29.5773 4.99145 30.5399C5.42288 31.3866 6.11129 32.075 6.95802 32.5065C7.92062 32.9969 9.18074 32.9969 11.701 32.9969H18.001M24.001 2.99695V8.99695M12.001 2.99695V8.99695M21.751 28.4969L24.751 31.4969L31.501 24.7469" stroke="#10214B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <p><strong>Date limite de dépôt du dossier :</strong></p>
          <p><strong>4 novembre 2025 à 23h59</strong></p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: '#DBB572' }}>Informations générales du candidat/établissement</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Nom de l&apos;établissement *</label>
            <input
              type="text"
              required
              className="w-full p-3 rounded-md bg-white"
              style={{ border: validationErrors.nom_etablissement ? '2px solid #ef4444' : '1px solid #DBB572' }}
              {...register('nom_etablissement', { required: true })}
              data-field="nom_etablissement"
            />
            <ErrorMessage fieldName="nom_etablissement" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Nom du candidat *</label>
            <input
              type="text"
              required
              className="w-full p-3 rounded-md bg-white"
              style={{ border: validationErrors.nom_candidat ? '2px solid #ef4444' : '1px solid #DBB572' }}
              {...register('nom_candidat', { required: true })}
              data-field="nom_candidat"
            />
            <ErrorMessage fieldName="nom_candidat" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Prénom du candidat *</label>
            <input
              type="text"
              required
              className="w-full p-3 rounded-md bg-white"
              style={{ border: validationErrors.prenom_candidat ? '2px solid #ef4444' : '1px solid #DBB572' }}
              {...register('prenom_candidat', { required: true })}
              data-field="prenom_candidat"
            />
            <ErrorMessage fieldName="prenom_candidat" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Agissant en qualité de *</label>
            <input
              type="text"
              required
              className="w-full p-3 rounded-md bg-white"
              style={{ border: validationErrors.qualite_agissant ? '2px solid #ef4444' : '1px solid #DBB572' }}
              {...register('qualite_agissant', { required: true })}
              data-field="qualite_agissant"
            />
            <ErrorMessage fieldName="qualite_agissant" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: '#DBB572' }}>Présentation de votre établissement</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Nom de la structure *</label>
            <input
              type="text"
              required
              className="w-full p-3 rounded-md bg-white"
              style={{ border: validationErrors.nom_structure ? '2px solid #ef4444' : '1px solid #DBB572' }}
              {...register('nom_structure', { required: true })}
              data-field="nom_structure"
            />
            <ErrorMessage fieldName="nom_structure" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Dénomination commerciale *</label>
            <input
              type="text"
              required
              className="w-full p-3 rounded-md bg-white"
              style={{ border: validationErrors.denomination_commerciale ? '2px solid #ef4444' : '1px solid #DBB572' }}
              {...register('denomination_commerciale', { required: true })}
              data-field="denomination_commerciale"
            />
            <ErrorMessage fieldName="denomination_commerciale" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Adresse (siège social) *</label>
            <textarea
              required
              className="w-full p-3 rounded-md bg-white"
              style={{ border: validationErrors.adresse_siege_social ? '2px solid #ef4444' : '1px solid #DBB572' }}
              rows={3}
              {...register('adresse_siege_social', { required: true })}
              data-field="adresse_siege_social"
            />
            <ErrorMessage fieldName="adresse_siege_social" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Adresse email *</label>
            <input
              type="email"
              required
              className="w-full p-3 rounded-md bg-white"
              style={{ border: validationErrors.email ? '2px solid #ef4444' : '1px solid #DBB572' }}
              {...register('email', { required: true })}
              data-field="email"
            />
            <ErrorMessage fieldName="email" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Numéro de téléphone *</label>
            <input
              type="tel"
              required
              className="w-full p-3 rounded-md bg-white"
              style={{ border: validationErrors.telephone ? '2px solid #ef4444' : '1px solid #DBB572' }}
              {...register('telephone', { required: true })}
              data-field="telephone"
            />
            <ErrorMessage fieldName="telephone" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Date de création *</label>
            <input
              type="date"
              required
              className="w-full p-3 rounded-md bg-white"
              style={{ border: validationErrors.date_creation ? '2px solid #ef4444' : '1px solid #DBB572' }}
              {...register('date_creation', { required: true })}
              data-field="date_creation"
            />
            <ErrorMessage fieldName="date_creation" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Forme juridique *</label>
            <input
              type="text"
              required
              className="w-full p-3 rounded-md bg-white"
              style={{ border: validationErrors.forme_juridique ? '2px solid #ef4444' : '1px solid #DBB572' }}
              {...register('forme_juridique', { required: true })}
              data-field="forme_juridique"
            />
            <ErrorMessage fieldName="forme_juridique" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>N° SIRET *</label>
            <input
              type="text"
              required
              className="w-full p-3 rounded-md bg-white"
              style={{ border: validationErrors.siret ? '2px solid #ef4444' : '1px solid #DBB572' }}
              {...register('siret', { required: true })}
              data-field="siret"
            />
            <ErrorMessage fieldName="siret" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>N° NAF *</label>
            <input
              type="text"
              required
              className="w-full p-3 rounded-md bg-white"
              style={{ border: validationErrors.naf ? '2px solid #ef4444' : '1px solid #DBB572' }}
              {...register('naf', { required: true })}
              data-field="naf"
            />
            <ErrorMessage fieldName="naf" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Capital social *</label>
            <input
              type="number"
              required
              className="w-full p-3 rounded-md bg-white"
              style={{ border: validationErrors.capital_social ? '2px solid #ef4444' : '1px solid #DBB572' }}
              {...register('capital_social', { required: true, valueAsNumber: true })}
              data-field="capital_social"
            />
            <ErrorMessage fieldName="capital_social" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Effectif de l&apos;établissement au 30 décembre 2024 *</label>
            <input
              type="number"
              required
              className="w-full p-3 rounded-md bg-white"
              style={{ border: validationErrors.effectif_2023 ? '2px solid #ef4444' : '1px solid #DBB572' }}
              {...register('effectif_2023', { required: true, valueAsNumber: true })}
              data-field="effectif_2023"
            />
            <ErrorMessage fieldName="effectif_2023" />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Activité principale *</label>
            <textarea
              required
              className="w-full p-3 rounded-md bg-white"
              style={{ border: validationErrors.activite_principale ? '2px solid #ef4444' : '1px solid #DBB572' }}
              rows={3}
              {...register('activite_principale', { required: true })}
              data-field="activite_principale"
            />
            <ErrorMessage fieldName="activite_principale" />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <label className="flex items-start space-x-3">
          <input
            type="checkbox"
            required
            className="mt-1"
            style={{ accentColor: validationErrors.consentement_candidature ? '#ef4444' : '#DBB572' }}
            {...register('consentement_candidature', { required: true })}
            data-field="consentement_candidature"
          />
          <span className="text-sm" style={{ color: 'white' }}>
            Oui, je souhaite la candidature de mon établissements au concours : Les Trophées des administrateurs &amp; entreprises inclusives de Bpifrance. J&apos;ai pris connaissance du règlement de ce concours, et j&apos;en accepte les termes.
          </span>
        </label>
        <ErrorMessage fieldName="consentement_candidature" />
      </div>
    </div>
  )

  // ÉTAPE 2: Informations entreprise
  const Etape2 = () => (
    <div className="space-y-6">


      <div className="text-center mb-8">
        <p className="text-lg font-semibold" style={{ backgroundColor: '#DBB572', color: '#10214B', width: 'max-content', padding: '3px 14px', margin: 'auto', borderRadius: '5px' }}>Étape 2</p>
        <h1 className="text-3xl font-bold mb-4 mt-4 uppercase" style={{ color: '#DBB572' }}>Informations entreprise</h1>
        <div className="text-center mb-8" style={{ backgroundColor: '#DBB572', color: '#10214B', padding: '40px', borderRadius: '20px' }}>
          <p>
            Décrivez votre entreprise ou établissement et précisez <strong>comment la dimension du handicap est intégrée dans votre fonctionnement</strong> (recrutement, sensibilisation, accompagnement, aménagements…).
            Ces éléments permettront au jury d’apprécier et d’évaluer votre démarche inclusive.<br></br><br></br>
            Remplissez l’ensemble des champs obligatoires avant de poursuivre.

          </p>

        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#DBB572' }}>Présentation de l’entreprise / établissement</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Description générale de l’activité de votre entreprise / établissement *
              </label>
              <textarea
                required
                className="w-full p-3 rounded-md bg-white"
                style={{ border: validationErrors.description_activite ? '2px solid #ef4444' : '1px solid #DBB572' }}
                rows={4}
                {...register('description_activite', { required: true })}
                data-field="description_activite"
              />
              <ErrorMessage fieldName="description_activite" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Description de la clientèle (localisation, type de clientèle) ou de votre activité (Fonction publique) *
              </label>
              <textarea
                required
                className="w-full p-3 rounded-md bg-white"
                style={{ border: validationErrors.description_clientele ? '2px solid #ef4444' : '1px solid #DBB572' }}
                rows={4}
                {...register('description_clientele', { required: true })}
                data-field="description_clientele"
              />
              <ErrorMessage fieldName="description_clientele" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Description de vos produits / votre prestation de service / (“produits”: provenance ou fabriqués par vous) / Vos missions *
              </label>
              <textarea
                required
                className="w-full p-3 rounded-md bg-white"
                style={{ border: validationErrors.description_produits_services ? '2px solid #ef4444' : '1px solid #DBB572' }}
                rows={4}
                {...register('description_produits_services', { required: true })}
                data-field="description_produits_services"
              />
              <ErrorMessage fieldName="description_produits_services" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Quels sont vos modes de communication (carte de visite, presse écrite, réseaux sociaux, site internet, etc...)*
              </label>
              <textarea
                required
                className="w-full p-3 rounded-md bg-white"
                style={{ border: validationErrors.modes_communication ? '2px solid #ef4444' : '1px solid #DBB572' }}
                rows={4}
                {...register('modes_communication', { required: true })}
                data-field="modes_communication"
              />
              <ErrorMessage fieldName="modes_communication" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Expliquez votre apport pour le territoire de la Martinique (inclusion, stage, partenariat etc..)*
              </label>
              <textarea
                required
                className="w-full p-3 rounded-md bg-white"
                style={{ border: validationErrors.support_martinique ? '2px solid #ef4444' : '1px solid #DBB572' }}
                rows={4}
                {...register('support_martinique', { required: true })}
                data-field="support_martinique"
              />
              <ErrorMessage fieldName="support_martinique" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Points forts de votre établissement *
              </label>
              <textarea
                required
                className="w-full p-3 rounded-md bg-white"
                style={{ border: validationErrors.points_forts ? '2px solid #ef4444' : '1px solid #DBB572' }}
                rows={4}
                {...register('points_forts', { required: true })}
                data-field="points_forts"
              />
              <ErrorMessage fieldName="points_forts" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Points faibles et axes d&apos;amélioration *
              </label>
              <textarea
                required
                className="w-full p-3 rounded-md bg-white"
                style={{ border: validationErrors.points_faibles ? '2px solid #ef4444' : '1px solid #DBB572' }}
                rows={4}
                {...register('points_faibles', { required: true })}
                data-field="points_faibles"
              />
              <ErrorMessage fieldName="points_faibles" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Avez-vous amorcé une démarche de transition numérique ? *
              </label>
              <textarea
                required
                className="w-full p-3 rounded-md bg-white"
                style={{ border: validationErrors.demarche_transition_numerique ? '2px solid #ef4444' : '1px solid #DBB572' }}
                rows={4}
                {...register('demarche_transition_numerique', { required: true })}
                data-field="demarche_transition_numerique"
              />
              <ErrorMessage fieldName="demarche_transition_numerique" />
            </div>
            <div> <h3 className="text-lg font-semibold mb-4" style={{ color: '#DBB572' }}>Inclusion du handicap</h3></div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Comment avez-vous inclus la dimension du handicap au sein de l’entreprise / établissement (action de sensibilisation, adaptation au poste de travail etc..) ? *
                (Cette information sera affichée publiquement pour la présentation de la vidéo) *
              </label>
              <textarea
                required
                className="w-full p-3 rounded-md bg-white"
                style={{ border: validationErrors.inclusion_handicap_approche ? '2px solid #ef4444' : '1px solid #DBB572' }}
                rows={4}
                {...register('inclusion_handicap_approche', { required: true })}
                data-field="inclusion_handicap_approche"
              />
              <ErrorMessage fieldName="inclusion_handicap_approche" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Quels sont vos besoins (matériel / financiers / ressources humaines) dans le cadre de l’inclusion du handicap au sein de votre établissement ?*
              </label>
              <textarea
                required
                className="w-full p-3 rounded-md bg-white"
                style={{ border: validationErrors.inclusion_handicap_besoins ? '2px solid #ef4444' : '1px solid #DBB572' }}
                rows={4}
                {...register('inclusion_handicap_besoins', { required: true })}
                data-field="inclusion_handicap_besoins"
              />
              <ErrorMessage fieldName="inclusion_handicap_besoins" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Quel est le pourcentage de travailleurs en situation de handicap, au sein de votre structure ? *
              </label>
              <textarea
                required
                className="w-full p-3 rounded-md bg-white"
                style={{ border: validationErrors.pourcentage_travailleurs_handicap ? '2px solid #ef4444' : '1px solid #DBB572' }}
                rows={4}
                {...register('pourcentage_travailleurs_handicap', { required: true })}
                data-field="pourcentage_travailleurs_handicap"
              />
              <ErrorMessage fieldName="pourcentage_travailleurs_handicap" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Avez-vous embouché en alternance, des travailleurs en situation handicap ? *
              </label>
              <textarea
                required
                className="w-full p-3 rounded-md bg-white"
                style={{ border: validationErrors.embauche_accompagnement_handicap ? '2px solid #ef4444' : '1px solid #DBB572' }}
                rows={4}
                {...register('embauche_accompagnement_handicap', { required: true })}
                data-field="embauche_accompagnement_handicap"
              />
              <ErrorMessage fieldName="embauche_accompagnement_handicap" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Si vous avez choisi de faire appel à des entreprises adaptées ou établissements et services d’aide par le travail, expliquez pour quelles raisons ?*
              </label>
              <textarea
                required
                className="w-full p-3 rounded-md bg-white"
                style={{ border: validationErrors.collaboration_entreprises_adaptees ? '2px solid #ef4444' : '1px solid #DBB572' }}
                rows={4}
                {...register('collaboration_entreprises_adaptees', { required: true })}
                data-field="collaboration_entreprises_adaptees"
              />
              <ErrorMessage fieldName="collaboration_entreprises_adaptees" />
            </div>
            <div> <h3 className="text-lg font-semibold mb-4" style={{ color: '#DBB572' }}>Le concours “Les trophées des
              administrations & entreprises
              inclusives de Martinique” : Vos attentes</h3></div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Pourquoi participer à ce concours ? *
              </label>
              <textarea
                required
                className="w-full p-3 rounded-md bg-white"
                style={{ border: validationErrors.raison_participation ? '2px solid #ef4444' : '1px solid #DBB572' }}
                rows={4}
                {...register('raison_participation', { required: true })}
                data-field="raison_participation"
              />
              <ErrorMessage fieldName="raison_participation" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Quels seraient à votre avis vos axes de progrès (améliorations, freins, etc...) ? *
              </label>
              <textarea
                required
                className="w-full p-3 rounded-md bg-white"
                style={{ border: validationErrors.axes_progres ? '2px solid #ef4444' : '1px solid #DBB572' }}
                rows={4}
                {...register('axes_progres', { required: true })}
                data-field="axes_progres"
              />
              <ErrorMessage fieldName="axes_progres" />
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
        <p className="text-lg font-semibold" style={{ backgroundColor: '#DBB572', color: '#10214B', width: 'max-content', padding: '3px 14px', margin: 'auto', borderRadius: '5px' }}>Étape 3</p>
        <h1 className="text-3xl font-bold mb-4 mt-4 uppercase" style={{ color: '#DBB572' }}>Sélection de la catégorie</h1>
        <div className="text-center mb-8" style={{ backgroundColor: '#DBB572', color: '#10214B', padding: '40px', borderRadius: '20px' }}>
          <p>
            Choisissez la ou les catégories correspondant à votre démarche.
            Il est possible de candidater dans plusieurs catégories selon vos actions et votre engagement.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="mb-4" style={{ color: '#DBB572' }}>
          Sélectionnez la ou les catégories qui correspondent le mieux à votre établissement :
        </h2>

        <div data-field="categories_selectionnees" className="mt-3">
          {CATEGORIES.map((categorie, index) => (
            <label key={index} className="flex items-start space-x-3 p-4 rounded-lg cursor-pointer mt-3" style={{ border: validationErrors.categories_selectionnees ? '2px solid #ef4444' : '1px solid #DBB572', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
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
                <p className="font-medium" style={{ color: '#DBB572' }}>{categorie}</p>
                <p className="text-sm mt-1" style={{ color: 'white' }}>
                  {index === 0 && "L'entreprise a recruté une ou plusieurs personnes en situation de handicap en contrat à durée indéterminée (CDI) ou en contrat à durée déterminée (CDD) d'au moins 6 mois."}
                  {index === 1 && "L'entreprise a mis en place des actions pour maintenir dans l'emploi un salarié devenu handicapé (aménagement de poste, formation, etc.)."}
                  {index === 2 && "L'entreprise a recruté un ou plusieurs alternants (apprentissage, contrat de professionnalisation) en situation de handicap."}
                  {index === 3 && "Les petites et moyennes entreprises (PME), les grandes entreprises et les administrations ont la possibilité de sous-traiter certaines activités à des établissements du secteur adapté et protégé. Ce mécanisme leur permet de soutenir activement l'emploi des personnes en situation de handicap et, le cas échéant, de réduire leur contribution à l'Agefiph/FIPHFP."}
                </p>
              </div>
            </label>
          ))}
        </div>
        <ErrorMessage fieldName="categories_selectionnees" />
      </div>
    </div>
  )

  // ÉTAPE 4: Chargement vidéo
  const Etape4 = () => {
    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [isUploading, setIsUploading] = useState(false)
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)

    // Récupérer l'URL de la vidéo depuis les données du formulaire si elle existe déjà
    const existingVideoUrl = watch('video_s3_url')

    // Mettre à jour videoPreviewUrl si une vidéo existe déjà dans la base de données
    React.useEffect(() => {
      if (existingVideoUrl && !videoPreviewUrl) {
        setVideoPreviewUrl(existingVideoUrl)
      }
    }, [existingVideoUrl, videoPreviewUrl])

    const onDrop = async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]

      // Valider le fichier
      const validation = validateFile(file, 5000, ['video/mp4'])
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
        'video/mp4': ['.mp4']
      },
      maxFiles: 1
    })

    return (
      <div className="space-y-6">


        <div className="text-center mb-8">
          <p className="text-lg font-semibold" style={{ backgroundColor: '#DBB572', color: '#10214B', width: 'max-content', padding: '3px 14px', margin: 'auto', borderRadius: '5px' }}>Étape 4</p>
          <h1 className="text-3xl font-bold mb-4 mt-4 uppercase" style={{ color: '#DBB572' }}>Vidéo de présentation</h1>
          <div className="text-center mb-8" style={{ backgroundColor: '#DBB572', color: '#10214B', padding: '40px', borderRadius: '20px' }}>
            <p>
              Déposez une courte vidéo illustrant la façon dont votre entreprise ou établissement intègre la dimension du handicap dans son fonctionnement.<br></br>
              Répondez de manière simple et sincère à la question :<br></br>
              « Comment avez-vous inclus la dimension du handicap au sein de votre entreprise ou établissement ? »<br></br>
              La vidéo doit aborder la ou les catégories pour lesquelles vous présentez votre candidature :<br></br>
              <ul>
                <li>Embauche de salari&eacute;&middot;e&middot;s en situation de handicap</li>
                <li>Maintien dans l&apos;emploi</li>
                <li>Embauche en alternance</li>
                <li>Collaboration avec des Entreprises Adaptées ou ESAT</li>
              </ul>
              Si vous concourez dans plusieurs cat&eacute;gories, veillez &agrave; pr&eacute;senter l&apos;ensemble de vos actions dans une seule et m&ecirc;me vid&eacute;o.
            </p>


          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#DBB572' }}>Téléchargez votre vidéo</h3>
            <p className="text-sm mb-4" style={{ color: 'white' }}>
              Format accepté : MP4 - Taille maximale : 5 GB
            </p>

            <div
              {...getVideoRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isVideoDragActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
              style={{
                borderColor: validationErrors.video_s3_url ? '#ef4444' : '#DBB572',
                backgroundColor: isVideoDragActive ? 'rgba(219, 181, 114, 0.1)' : 'rgba(255, 255, 255, 0.05)'
              }}
              data-field="video_s3_url"
            >
              <input {...getVideoInputProps()} disabled={isUploading} />
              <div className="space-y-2">
                <svg className="mx-auto h-12 w-12" stroke="#DBB572" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="text-sm" style={{ color: 'white' }}>
                  {isVideoDragActive ? 'Déposez la vidéo ici...' : 'Glissez-déposez votre vidéo ici, ou cliquez pour sélectionner'}
                </p>
                {videoFile && (
                  <p className="text-sm font-medium" style={{ color: '#DBB572' }}>
                    ✓ Fichier sélectionné : {videoFile.name}
                  </p>
                )}
              </div>
            </div>
            <ErrorMessage fieldName="video_s3_url" />

            {/* Barre de progression */}
            {isUploading && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2" style={{ color: 'white' }}>
                  <span>Upload en cours...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%`, backgroundColor: '#DBB572' }}
                  />
                </div>
              </div>
            )}

            {/* Prévisualisation de la vidéo */}
            {videoPreviewUrl && !isUploading && (
              <div className="mt-6">
                <h4 className="text-md font-semibold mb-3" style={{ color: '#DBB572' }}>Aperçu de votre vidéo</h4>
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
                    <p className="text-sm" style={{ color: '#DBB572' }}>
                      ✓ Vidéo uploadée avec succès
                    </p>
                    {existingVideoUrl && (
                      <p className="text-xs mt-1" style={{ color: '#DBB572' }}>
                        Vous pouvez remplacer cette vidéo en uploadant une nouvelle
                      </p>
                    )}
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
                style={{ accentColor: validationErrors.autorisation_diffusion_video ? '#ef4444' : '#DBB572' }}
                {...register('autorisation_diffusion_video', { required: true })}
                data-field="autorisation_diffusion_video"
              />
              <span className="text-sm" style={{ color: 'white' }}>
                J&apos;autorise la diffusion des vidéos sur la plateforme publique *
              </span>
            </label>
            <ErrorMessage fieldName="autorisation_diffusion_video" />
          </div>
        </div>
      </div>
    )
  }

  // Composant pour l'upload de fichiers complémentaires
  const ComplementaryFilesUploader = () => {
    const [complementaryFiles, setComplementaryFiles] = useState<File[]>([])
    const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set())
    const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

    // Récupérer les URLs existantes depuis les données du formulaire
    const existingUrls = getValues('fichiers_complementaires_s3_urls') || []

    const onDrop = async (acceptedFiles: File[]) => {
      const newFiles = [...complementaryFiles, ...acceptedFiles]
      setComplementaryFiles(newFiles)

      // Upload chaque fichier
      for (const file of acceptedFiles) {
        const fileId = `${file.name}-${file.size}-${Date.now()}`
        setUploadingFiles(prev => new Set(prev).add(fileId))
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }))

        // Valider le fichier
        const validation = validateFile(file, 10, ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
        if (!validation.valid) {
          toast.error(`Fichier invalide: ${file.name}`, {
            description: validation.error
          })
          setUploadingFiles(prev => {
            const newSet = new Set(prev)
            newSet.delete(fileId)
            return newSet
          })
          continue
        }

        try {
          const result = await uploadFileToS3(
            file,
            'documents',
            participationId || undefined,
            (percentage) => {
              setUploadProgress(prev => ({ ...prev, [fileId]: percentage }))
            }
          )

          if (result.success && result.url) {
            const updatedUrls = [...existingUrls, result.url]
            setValue('fichiers_complementaires_s3_urls', updatedUrls)

            // Sauvegarder automatiquement dans la base de données
            const currentData = { ...getValues(), fichiers_complementaires_s3_urls: updatedUrls }
            await saveParticipation(currentData)

            toast.success(`Fichier uploadé: ${file.name}`)
          } else {
            throw new Error(result.error || 'Erreur inconnue')
          }
        } catch (error) {
          console.error('Erreur upload fichier complémentaire:', error)
          toast.error(`Erreur lors de l'upload de ${file.name}`)
        } finally {
          setUploadingFiles(prev => {
            const newSet = new Set(prev)
            newSet.delete(fileId)
            return newSet
          })
          setUploadProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[fileId]
            return newProgress
          })
        }
      }
    }

    const removeFile = async (index: number) => {
      let fileName = ''
      
      if (index < existingUrls.length) {
        // Supprimer un fichier existant (déjà uploadé)
        fileName = `Document complémentaire ${index + 1}`
        const updatedUrls = existingUrls.filter((_: string, i: number) => i !== index)
        setValue('fichiers_complementaires_s3_urls', updatedUrls)
        
        const currentData = { ...getValues(), fichiers_complementaires_s3_urls: updatedUrls }
        await saveParticipation(currentData)
      } else {
        // Supprimer un nouveau fichier (pas encore uploadé)
        const fileIndex = index - existingUrls.length
        const fileToRemove = complementaryFiles[fileIndex]
        fileName = fileToRemove.name
        const newFiles = complementaryFiles.filter((_, i) => i !== fileIndex)
        setComplementaryFiles(newFiles)
      }

      toast.info(`Fichier supprimé: ${fileName}`)
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop,
      accept: {
        'application/pdf': ['.pdf'],
        'image/*': ['.jpg', '.jpeg', '.png'],
        'application/msword': ['.doc'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
      },
      multiple: true
    })

    return (
      <div className="space-y-4">
        {/* Zone de drop */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive ? 'bg-blue-50' : 'hover:bg-gray-50'
          }`}
          style={{
            borderColor: '#DBB572',
            backgroundColor: isDragActive ? 'rgba(219, 181, 114, 0.1)' : 'rgba(255, 255, 255, 0.05)'
          }}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12" stroke="#DBB572" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="text-sm" style={{ color: 'white' }}>
              {isDragActive ? 'Déposez vos fichiers ici...' : 'Glissez-déposez vos fichiers ici, ou cliquez pour sélectionner'}
            </p>
            <p className="text-xs" style={{ color: '#DBB572' }}>
              Formats acceptés : PDF, JPG, PNG, DOC, DOCX - Taille max : 10 MB par fichier
            </p>
          </div>
        </div>

        {/* Liste des fichiers */}
        {(complementaryFiles.length > 0 || existingUrls.length > 0) && (
          <div className="space-y-2">
            <h4 className="text-md font-semibold" style={{ color: '#DBB572' }}>Fichiers ajoutés :</h4>
            <div className="space-y-2">
              {/* Fichiers existants */}
              {existingUrls.map((url: string, index: number) => (
                <div key={`existing-${index}`} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid #DBB572' }}>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" style={{ color: '#DBB572' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm" style={{ color: 'white' }}>
                      Document complémentaire {index + 1}
                    </span>
                    <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#DBB572', color: '#10214B' }}>
                      ✓ Uploadé
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Supprimer
                  </button>
                </div>
              ))}

              {/* Nouveaux fichiers */}
              {complementaryFiles.map((file, index) => {
                const fileId = `${file.name}-${file.size}-${Date.now()}`
                const isUploading = uploadingFiles.has(fileId)
                const progress = uploadProgress[fileId] || 0
                const globalIndex = existingUrls.length + index

                return (
                  <div key={`new-${index}`} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid #DBB572' }}>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5" style={{ color: '#DBB572' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm" style={{ color: 'white' }}>
                        {file.name}
                      </span>
                      <span className="text-xs">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                      {isUploading ? (
                        <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#DBB572', color: '#10214B' }}>
                          Upload: {progress}%
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#DBB572', color: '#10214B' }}>
                          ✓ Uploadé
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeFile(globalIndex)}
                      className="text-red-400 hover:text-red-300 text-sm"
                      disabled={isUploading}
                    >
                      Supprimer
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ÉTAPE 5: Documents et signature
  const Etape5 = () => {
    const [attestationFile, setAttestationFile] = useState<File | null>(null)
    const [kbisFile, setKbisFile] = useState<File | null>(null)

    // Récupérer les URLs des documents depuis les données du formulaire si elles existent déjà
    const existingAttestationUrl = watch('attestation_regularite_s3_url')
    const existingKbisUrl = watch('fiche_insee_kbis_s3_url')
    const existingSignatureUrl = watch('signature_image_s3_url')

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
          <p className="text-lg font-semibold" style={{ backgroundColor: '#DBB572', color: '#10214B', width: 'max-content', padding: '3px 14px', margin: 'auto', borderRadius: '5px' }}>Étape 5</p>
          <h1 className="text-3xl font-bold mb-4 mt-4 uppercase" style={{ color: '#DBB572' }}>Documents et signature</h1>
          <div className="text-center mb-8" style={{ backgroundColor: '#DBB572', color: '#10214B', padding: '40px', borderRadius: '20px' }}>
            <p>
              Avant de valider, vérifiez que toutes les pièces demandées sont jointes. Un dossier complet garantit la bonne prise en compte de votre participation.
            </p>



          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4 uppercase" style={{ color: '#DBB572' }}>Documents complémentaire de l’établissement</h3>
            <p className='text-white text-center mt-12 '>Les informations et documents transmis dans le cadre de votre candidature sont strictement confidentiels et ne seront pas communiqués publiquement. Seuls seront rendus publics : votre vidéo et la réponse à la question “Comment avez-vous inclus la dimension du handicap au sein de votre entreprise ou établissement” </p>
            <div className="space-y-4 mt-12 ">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                  Attestation de régularité fiscale et sociale *
                </label>
                <div
                  {...getAttestationRootProps()}
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
                  style={{ borderColor: validationErrors.attestation_regularite_s3_url ? '#ef4444' : '#DBB572', backgroundColor: isAttestationDragActive ? 'rgba(219, 181, 114, 0.1)' : 'rgba(255, 255, 255, 0.05)' }}
                  data-field="attestation_regularite_s3_url"
                >
                  <input {...getAttestationInputProps()} />
                  <p className="text-sm" style={{ color: 'white' }}>
                    {isAttestationDragActive ? 'Déposez le document ici...' : 'Cliquez ou glissez-déposez votre attestation (PDF, JPG, PNG)'}
                  </p>
                  {attestationFile && (
                    <p className="text-sm font-medium mt-2" style={{ color: '#DBB572' }}>
                      ✓ {attestationFile.name}
                    </p>
                  )}
                  {existingAttestationUrl && !attestationFile && (
                    <p className="text-sm font-medium mt-2" style={{ color: '#DBB572' }}>
                      ✓ Document déjà uploadé
                    </p>
                  )}
                </div>
                <ErrorMessage fieldName="attestation_regularite_s3_url" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                  Extrait KBIS (moins de 3 mois) *
                </label>
                <div
                  {...getKBISRootProps()}
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
                  style={{ borderColor: validationErrors.fiche_insee_kbis_s3_url ? '#ef4444' : '#DBB572', backgroundColor: isKBISDragActive ? 'rgba(219, 181, 114, 0.1)' : 'rgba(255, 255, 255, 0.05)' }}
                  data-field="fiche_insee_kbis_s3_url"
                >
                  <input {...getKBISInputProps()} />
                  <p className="text-sm" style={{ color: 'white' }}>
                    {isKBISDragActive ? 'Déposez le document ici...' : 'Cliquez ou glissez-déposez votre KBIS (PDF, JPG, PNG)'}
                  </p>
                  {kbisFile && (
                    <p className="text-sm font-medium mt-2" style={{ color: '#DBB572' }}>
                      ✓ {kbisFile.name}
                    </p>
                  )}
                  {existingKbisUrl && !kbisFile && (
                    <p className="text-sm font-medium mt-2" style={{ color: '#DBB572' }}>
                      ✓ Document déjà uploadé
                    </p>
                  )}
                </div>
                <ErrorMessage fieldName="fiche_insee_kbis_s3_url" />
              </div>
            </div>
          </div>

          {/* Section fichiers complémentaires */}
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#DBB572' }}>Fichiers complémentaires (optionnel)</h3>
            <p className="text-sm mb-4" style={{ color: 'white' }}>
              Vous pouvez ajouter des documents complémentaires qui appuient votre candidature (certificats, attestations, photos, etc.)
            </p>
            <ComplementaryFilesUploader />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#DBB572' }}>Règlement et engagement</h3>

            <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid #DBB572' }}>
              <p className="text-sm mb-2" style={{ color: 'white' }}>
                Documents à consulter :
              </p>
              <ul className="text-sm space-y-1">
                <li style={{ color: 'white' }}>• <a href="/MEDEF_SEMAINE_DU_HANDICAP_REGLEMENT.pdf" target="_blank" className="hover:underline" style={{ color: '#DBB572', textDecoration: 'underline' }}>Règlement du concours trophées des entreprises et administrations inclusives de Martinique.</a></li>
                <li style={{ color: 'white' }}>• <button type="button" onClick={() => setIsPacteDialogOpen(true)} className="hover:underline" style={{ color: '#DBB572', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline' }}>Le pacte d&apos;engagement</button></li>
              </ul>
            </div>

            <label className="flex items-start space-x-3 mb-4">
              <input
                type="checkbox"
                required
                className="mt-1"
                style={{ accentColor: validationErrors.acceptation_reglement ? '#ef4444' : '#DBB572' }}
                {...register('acceptation_reglement', { required: true })}
                data-field="acceptation_reglement"
              />
              <span className="text-sm" style={{ color: 'white' }}>J&apos;ai lu et accepté le règlement *</span>
            </label>
            <ErrorMessage fieldName="acceptation_reglement" />

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Votre signature *</label>
              <div className="rounded-lg p-4" style={{ border: validationErrors.signature_image_s3_url ? '2px solid #ef4444' : '2px solid #DBB572' }} data-field="signature_image_s3_url">
                {existingSignatureUrl ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <Image
                        src={existingSignatureUrl}
                        alt="Signature existante"
                        width={400}
                        height={160}
                        className="mx-auto max-w-full h-40 object-contain bg-white rounded border"
                        style={{ border: '1px solid #DBB572' }}
                      />
                      <p className="text-sm mt-2" style={{ color: '#DBB572' }}>
                        ✓ Signature déjà enregistrée
                      </p>
                    </div>
                    <div className="flex gap-2 justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setValue('signature_image_s3_url', null)
                          toast.info('Signature supprimée, vous pouvez en créer une nouvelle')
                        }}
                        className="px-4 py-2 text-sm rounded"
                        style={{ border: '1px solid #DBB572', color: 'white' }}
                      >
                        Supprimer la signature
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <SignatureCanvas
                      ref={signatureRef}
                      canvasProps={{
                        className: 'w-full h-40 rounded bg-white',
                        style: { border: '1px solid #DBB572' }
                      }}
                    />
                    <div className="flex gap-2 mt-2 justify-center">
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="px-4 py-2 text-sm rounded "
                        style={{ border: '1px solid #DBB572', color: 'white' }}
                      >
                        Effacer la signature
                      </button>
                      <button
                        type="button"
                        onClick={saveSignature}
                        className="px-4 py-2 text-sm rounded"
                        style={{ backgroundColor: '#DBB572', color: '#10214B' }}
                      >
                        Enregistrer la signature
                      </button>
                    </div>
                  </div>
                )}

                {!existingSignatureUrl && etapeActuelle === 5 && (
                  <div className="mt-2 text-center">
                    <p className="text-sm" style={{ color: '#DBB572' }}>
                      ⚠️ Vous devez signer et enregistrer votre signature avant de soumettre
                    </p>
                  </div>
                )}
              </div>
              <ErrorMessage fieldName="signature_image_s3_url" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderEtape = () => {
    // Si une participation est déjà soumise, ne pas afficher le formulaire
    if (participationStatus === 'submitted') {
      return null
    }
    
    // Si on est en train de rechercher et qu'aucune participation n'a été trouvée, ne pas afficher le formulaire
    if (showEmailSearch && participationStatus === 'none') {
      return null
    }
    
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
    <div className="min-h-screen py-8" style={{ backgroundColor: '#10214B' }}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Barre de progression - affichée seulement si le formulaire est visible */}
        {(!showEmailSearch || participationStatus === 'draft') && participationStatus !== 'submitted' && (
          <div className="mb-8">
            <div className="flex justify-between text-sm font-bold mb-2" style={{ color: '#DBB572' }}>
              <span>Étape {etapeActuelle} sur 5</span>
              <span>{Math.round((etapeActuelle / 5) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{ width: `${(etapeActuelle / 5) * 100}%`, backgroundColor: '#DBB572' }}
              />
            </div>
          </div>
        )}

        {/* Section de recherche par email */}
        {showEmailSearch && (
          <div className="mb-8 p-6 rounded-lg" style={{ backgroundColor: 'rgba(219, 181, 114, 0.1)', border: '2px solid #DBB572' }}>
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#DBB572' }}>
                Reprendre une participation existante
              </h3>
              <p className="text-sm" style={{ color: 'white' }}>
                Si vous avez déjà commencé à remplir votre participation, saisissez votre adresse email pour la récupérer et reprendre où vous vous êtes arrêté.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Votre adresse email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="flex-1 p-3 rounded-md bg-white"
                style={{ border: '1px solid #DBB572' }}
                disabled={isSearching}
              />
              <button
                onClick={() => searchExistingParticipation(searchEmail)}
                disabled={isSearching || !searchEmail}
                className="w-full sm:w-auto px-6 py-3 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#DBB572', color: '#10214B' }}
              >
                {isSearching ? 'Recherche...' : 'Rechercher'}
              </button>
            </div>
            
            <div className="text-center mt-3">
              <button
                onClick={() => setShowEmailSearch(false)}
                className="text-sm underline"
                style={{ color: '#DBB572' }}
              >
                Commencer une nouvelle participation
              </button>
            </div>
          </div>
        )}

        {/* Message si participation déjà soumise */}
        {participationStatus === 'submitted' && (
          <div className="mb-8 p-6 rounded-lg text-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '2px solid #ef4444' }}>
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#ef4444' }}>
              Participation déjà enregistrée
            </h3>
            <p className="text-sm" style={{ color: 'white' }}>
              Une participation a déjà été soumise avec cet email. Vous ne pouvez pas modifier une participation déjà enregistrée.
            </p>
            <button
              onClick={() => {
                setParticipationStatus('none')
                setSearchEmail('')
                setShowEmailSearch(true)
              }}
              className="mt-3 px-4 py-2 rounded-md"
              style={{ backgroundColor: '#DBB572', color: '#10214B' }}
            >
              Utiliser un autre email
            </button>
          </div>
        )}

        {/* Contenu de l'étape */}
        <div className="rounded-lg shadow-sm p-8" style={{ backgroundColor: 'transparent' }}>
          {renderEtape()}
        </div>

        {/* Navigation - affichée seulement si le formulaire est visible */}
        {(!showEmailSearch || participationStatus === 'draft') && participationStatus !== 'submitted' && (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-0 sm:justify-between items-center mt-8">
            {/* Ligne 1 sur mobile : Précédent et Suivant */}
            <div className="flex justify-between items-center w-full sm:w-auto gap-3 sm:gap-0">
              <button
                onClick={handlePrevious}
                disabled={etapeActuelle === 1}
                className="px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ border: '1px solid rgba(255, 255, 255, 0.19)', color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.16)' }}
              >
                <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <mask id="mask0_121_33149" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="25" height="24">
                    <rect width="24" height="24" transform="matrix(-1 0 0 1 24.5 0)" fill="#D9D9D9" />
                  </mask>
                  <g mask="url(#mask0_121_33149)">
                    <path d="M12.5 21C13.75 21 14.9208 20.7625 16.0125 20.2875C17.1042 19.8125 18.0542 19.1708 18.8625 18.3625C19.6708 17.5542 20.3125 16.6042 20.7875 15.5125C21.2625 14.4208 21.5 13.25 21.5 12C21.5 10.75 21.2625 9.57917 20.7875 8.4875C20.3125 7.39583 19.6708 6.44583 18.8625 5.6375C18.0542 4.82917 17.1042 4.1875 16.0125 3.7125C14.9208 3.2375 13.75 3 12.5 3V5C14.45 5 16.1042 5.67917 17.4625 7.0375C18.8208 8.39583 19.5 10.05 19.5 12C19.5 13.95 18.8208 15.6042 17.4625 16.9625C16.1042 18.3208 14.45 19 12.5 19V21ZM8.5 17L9.9 15.575L7.325 13H15.5V11H7.325L9.9 8.4L8.5 7L3.5 12L8.5 17Z" fill="white" />
                  </g>
                </svg>
                Précédent
              </button>

              {etapeActuelle < 5 ? (
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="px-6 py-3 rounded-lg disabled:opacity-50 flex items-center gap-2"
                  style={{ backgroundColor: '#DBB572', color: '#10214B', border: '1px solid white' }}
                >
                  {loading ? 'Sauvegarde...' : 'Suivant'}
                  <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <mask id="mask0_183_6845" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="25" height="24">
                      <rect x="0.5" width="24" height="24" fill="#D9D9D9" />
                    </mask>
                    <g mask="url(#mask0_183_6845)">
                      <path d="M12.5 21C11.25 21 10.0792 20.7625 8.9875 20.2875C7.89583 19.8125 6.94583 19.1708 6.1375 18.3625C5.32917 17.5542 4.6875 16.6042 4.2125 15.5125C3.7375 14.4208 3.5 13.25 3.5 12C3.5 10.75 3.7375 9.57917 4.2125 8.4875C4.6875 7.39583 5.32917 6.44583 6.1375 5.6375C6.94583 4.82917 7.89583 4.1875 8.9875 3.7125C10.0792 3.2375 11.25 3 12.5 3V5C10.55 5 8.89583 5.67917 7.5375 7.0375C6.17917 8.39583 5.5 10.05 5.5 12C5.5 13.95 6.17917 15.6042 7.5375 16.9625C8.89583 18.3208 10.55 19 12.5 19V21ZM16.5 17L15.1 15.575L17.675 13H9.5V11H17.675L15.1 8.4L16.5 7L21.5 12L16.5 17Z" fill="#10214B" />
                    </g>
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleFinalSubmit}
                  disabled={loading || !getValues('signature_image_s3_url')}
                  className="px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{ backgroundColor: '#DBB572', color: '#10214B', border: '1px solid white' }}
                >
                  {loading ? 'Envoi...' : "Valider l'inscription"}
                  <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <mask id="mask0_183_6845_submit" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="25" height="24">
                      <rect x="0.5" width="24" height="24" fill="#D9D9D9" />
                    </mask>
                    <g mask="url(#mask0_183_6845_submit)">
                      <path d="M12.5 21C11.25 21 10.0792 20.7625 8.9875 20.2875C7.89583 19.8125 6.94583 19.1708 6.1375 18.3625C5.32917 17.5542 4.6875 16.6042 4.2125 15.5125C3.7375 14.4208 3.5 13.25 3.5 12C3.5 10.75 3.7375 9.57917 4.2125 8.4875C4.6875 7.39583 5.32917 6.44583 6.1375 5.6375C6.94583 4.82917 7.89583 4.1875 8.9875 3.7125C10.0792 3.2375 11.25 3 12.5 3V5C10.55 5 8.89583 5.67917 7.5375 7.0375C6.17917 8.39583 5.5 10.05 5.5 12C5.5 13.95 6.17917 15.6042 7.5375 16.9625C8.89583 18.3208 10.55 19 12.5 19V21ZM16.5 17L15.1 15.575L17.675 13H9.5V11H17.675L15.1 8.4L16.5 7L21.5 12L16.5 17Z" fill="#10214B" />
                    </g>
                  </svg>
                </button>
              )}
            </div>

            {/* Bouton Enregistrer en brouillon - centré en dessous sur mobile, au centre sur desktop */}
            <button
              onClick={saveDraftParticipation}
              disabled={loading}
              className="px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full sm:w-auto justify-center"
              style={{ border: '1px solid #DBB572', color: '#DBB572', backgroundColor: 'rgba(219, 181, 114, 0.1)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16L21 8V19C21 20.1046 20.1046 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {loading ? 'Sauvegarde...' : 'Enregistrer en brouillon'}
            </button>
          </div>
        )}
      </div>

      {/* Dialog Pacte d'engagement */}
      <Dialog open={isPacteDialogOpen} onOpenChange={setIsPacteDialogOpen}>
        <DialogContent className="max-w-2xl bg-[#10214B] text-white border border-[#DBB572]/40 rounded-2xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-[#DBB572] text-lg font-semibold">
              Pacte d&apos;engagement – Trophées des entreprises et administrations inclusives de Martinique
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm leading-relaxed mt-3">
            <p>L&apos;entreprise s&apos;engage à :</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Organiser au moins une réunion par an de sensibilisation sur le handicap.</li>
              <li>Désigner et former un référent handicap pour l&apos;entreprise.</li>
              <li>Participer au Duo Day et publier ses offres d&apos;emploi également sur le site de l&apos;Agefiph.</li>
              <li>Communiquer sur le handicap auprès des collaborateurs.</li>
              <li>Intégrer le handicap dans sa politique de ressources humaines.</li>
              <li>Proposer des immersions professionnelles.</li>
              <li>Devenir activateur de progrès.</li>
            </ul>
            <p className="pt-2 italic text-[#DBB572]/90 text-center">
              Ensemble, contribuons à un monde professionnel plus inclusif et équitable pour tous.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
