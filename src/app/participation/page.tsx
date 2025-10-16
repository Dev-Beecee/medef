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
        <p className="text-lg font-semibold" style={{ backgroundColor: '#DBB572', color: '#10214B', width: 'max-content', padding: '3px 14px', margin: 'auto', borderRadius: '5px' }}>Étape 1</p>
        <h1 className="text-3xl font-bold mb-4 mt-4 uppercase" style={{ color: '#DBB572' }}>Candidature</h1>
        <div className="text-center mb-8" style={{ backgroundColor: '#DBB572', color: '#10214B', padding: '40px', borderRadius: '20px' }}>
          <p>
            Présentez les informations essentielles de votre entreprise ou établissement. 
          </p>
          <p>Remplissez tous les champs obligatoires avant de passer à l&apos;étape suivante.</p>
          
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M31.501 14.9969H4.50098M31.501 18.7469V13.1969C31.501 10.6767 31.501 9.41659 31.0105 8.45399C30.5791 7.60726 29.8907 6.91885 29.0439 6.48742C28.0813 5.99695 26.8212 5.99695 24.301 5.99695H11.701C9.18074 5.99695 7.92062 5.99695 6.95802 6.48742C6.11129 6.91885 5.42288 7.60726 4.99145 8.45399C4.50098 9.41659 4.50098 10.6767 4.50098 13.1969V25.7969C4.50098 28.3172 4.50098 29.5773 4.99145 30.5399C5.42288 31.3866 6.11129 32.075 6.95802 32.5065C7.92062 32.9969 9.18074 32.9969 11.701 32.9969H18.001M24.001 2.99695V8.99695M12.001 2.99695V8.99695M21.751 28.4969L24.751 31.4969L31.501 24.7469" stroke="#10214B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <p><strong>Date limite de dépôt du dossier :</strong></p>
          <p><strong>2 novembre 2025 à 23h59</strong></p>
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
              style={{ border: '1px solid #DBB572' }}
              {...register('nom_etablissement', { required: true })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Nom du candidat *</label>
            <input
              type="text"
              required
              className="w-full p-3 rounded-md bg-white"
              style={{ border: '1px solid #DBB572' }}
              {...register('nom_candidat', { required: true })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Prénom du candidat *</label>
            <input
              type="text"
              required
              className="w-full p-3 rounded-md bg-white"
              style={{ border: '1px solid #DBB572' }}
              {...register('prenom_candidat', { required: true })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Agissant en qualité de *</label>
            <input
              type="text"
              required
              className="w-full p-3 rounded-md bg-white"
              style={{ border: '1px solid #DBB572' }}
              {...register('qualite_agissant', { required: true })}
            />
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
              style={{ border: '1px solid #DBB572' }}
              {...register('nom_structure', { required: true })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Dénomination commerciale</label>
            <input
              type="text"
              className="w-full p-3 rounded-md bg-white"
              style={{ border: '1px solid #DBB572' }}
              {...register('denomination_commerciale')}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Adresse (siège social)</label>
            <textarea
              className="w-full p-3 rounded-md bg-white"
              style={{ border: '1px solid #DBB572' }}
              rows={3}
              {...register('adresse_siege_social')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Adresse email *</label>
            <input
              type="email"
              required
              className="w-full p-3 rounded-md bg-white"
              style={{ border: '1px solid #DBB572' }}
              {...register('email', { required: true })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Numéro de téléphone</label>
            <input
              type="tel"
              className="w-full p-3 rounded-md bg-white"
              style={{ border: '1px solid #DBB572' }}
              {...register('telephone')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Date de création</label>
            <input
              type="date"
              className="w-full p-3 rounded-md bg-white"
              style={{ border: '1px solid #DBB572' }}
              {...register('date_creation')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Forme juridique</label>
            <input
              type="text"
              className="w-full p-3 rounded-md bg-white"
              style={{ border: '1px solid #DBB572' }}
              {...register('forme_juridique')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>N° SIRET *</label>
            <input
              type="text"
              required
              className="w-full p-3 rounded-md bg-white"
              style={{ border: '1px solid #DBB572' }}
              {...register('siret', { required: true })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>N° NAF *</label>
            <input
              type="text"
              required
              className="w-full p-3 rounded-md bg-white"
              style={{ border: '1px solid #DBB572' }}
              {...register('naf', { required: true })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Capital social</label>
            <input
              type="number"
              className="w-full p-3 rounded-md bg-white"
              style={{ border: '1px solid #DBB572' }}
              {...register('capital_social', { valueAsNumber: true })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Effectif de l&apos;établissement au 30 septembre 2023</label>
            <input
              type="number"
              className="w-full p-3 rounded-md bg-white"
              style={{ border: '1px solid #DBB572' }}
              {...register('effectif_2023', { valueAsNumber: true })}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Activité principale</label>
            <textarea
              className="w-full p-3 rounded-md bg-white"
              style={{ border: '1px solid #DBB572' }}
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
          <span className="text-sm" style={{ color: 'white' }}>
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
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#DBB572' }}>Questions sur votre entreprise</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Décrivez l&apos;activité de votre établissement
              </label>
              <textarea
                className="w-full p-3 rounded-md bg-white"
                style={{ border: '1px solid #DBB572' }}
                rows={4}
                {...register('description_activite')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Décrivez votre clientèle
              </label>
              <textarea
                className="w-full p-3 rounded-md bg-white"
                style={{ border: '1px solid #DBB572' }}
                rows={4}
                {...register('description_clientele')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Décrivez vos produits et services
              </label>
              <textarea
                className="w-full p-3 rounded-md bg-white"
                style={{ border: '1px solid #DBB572' }}
                rows={4}
                {...register('description_produits_services')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Modes de communication utilisés
              </label>
              <textarea
                className="w-full p-3 rounded-md bg-white"
                style={{ border: '1px solid #DBB572' }}
                rows={4}
                {...register('modes_communication')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Comment soutenez-vous la Martinique ?
              </label>
              <textarea
                className="w-full p-3 rounded-md bg-white"
                style={{ border: '1px solid #DBB572' }}
                rows={4}
                {...register('support_martinique')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Points forts de votre établissement
              </label>
              <textarea
                className="w-full p-3 rounded-md bg-white"
                style={{ border: '1px solid #DBB572' }}
                rows={4}
                {...register('points_forts')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Points faibles et axes d&apos;amélioration
              </label>
              <textarea
                className="w-full p-3 rounded-md bg-white"
                style={{ border: '1px solid #DBB572' }}
                rows={4}
                {...register('points_faibles')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Démarche de transition numérique
              </label>
              <textarea
                className="w-full p-3 rounded-md bg-white"
                style={{ border: '1px solid #DBB572' }}
                rows={4}
                {...register('demarche_transition_numerique')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Approche de l&apos;inclusion des personnes en situation de handicap
              </label>
              <textarea
                className="w-full p-3 rounded-md bg-white"
                style={{ border: '1px solid #DBB572' }}
                rows={4}
                {...register('inclusion_handicap_approche')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Besoins spécifiques pour l&apos;inclusion handicap
              </label>
              <textarea
                className="w-full p-3 rounded-md bg-white"
                style={{ border: '1px solid #DBB572' }}
                rows={4}
                {...register('inclusion_handicap_besoins')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Pourcentage de travailleurs en situation de handicap
              </label>
              <textarea
                className="w-full p-3 rounded-md bg-white"
                style={{ border: '1px solid #DBB572' }}
                rows={4}
                {...register('pourcentage_travailleurs_handicap')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Accompagnement à l&apos;embauche de personnes en situation de handicap
              </label>
              <textarea
                className="w-full p-3 rounded-md bg-white"
                style={{ border: '1px solid #DBB572' }}
                rows={4}
                {...register('embauche_accompagnement_handicap')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Collaboration avec des entreprises adaptées
              </label>
              <textarea
                className="w-full p-3 rounded-md bg-white"
                style={{ border: '1px solid #DBB572' }}
                rows={4}
                {...register('collaboration_entreprises_adaptees')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Raison de votre participation
              </label>
              <textarea
                className="w-full p-3 rounded-md bg-white"
                style={{ border: '1px solid #DBB572' }}
                rows={4}
                {...register('raison_participation')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                Axes de progrès souhaités
              </label>
              <textarea
                className="w-full p-3 rounded-md bg-white"
                style={{ border: '1px solid #DBB572' }}
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
        
        {CATEGORIES.map((categorie, index) => (
          <label key={index} className="flex items-start space-x-3 p-4 rounded-lg cursor-pointer" style={{ border: '1px solid #DBB572', backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
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
       <p className="text-lg font-semibold" style={{ backgroundColor: '#DBB572', color: '#10214B', width: 'max-content', padding: '3px 14px', margin: 'auto', borderRadius: '5px' }}>Étape 4</p>
       <h1 className="text-3xl font-bold mb-4 mt-4 uppercase" style={{ color: '#DBB572' }}>Vidéo de présentation</h1>
       <div className="text-center mb-8" style={{ backgroundColor: '#DBB572', color: '#10214B', padding: '40px', borderRadius: '20px' }}>
         <p>
         Déposez une <strong>vidéo</strong> présentant <strong>comment votre entreprise ou établissement intègre la dimension du handicap</strong>.<br></br>
Cette vidéo servira à illustrer concrètement votre engagement auprès du jury et du public.

         </p>
        
         
       </div>
     </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#DBB572' }}>Téléchargez votre vidéo</h3>
            <p className="text-sm mb-4" style={{ color: 'white' }}>
              Formats acceptés : MP4, MOV, AVI - Taille maximale : 500 MB
            </p>

            <div
              {...getVideoRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isVideoDragActive ? 'bg-blue-50' : 'hover:bg-gray-50'
              } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
              style={{ borderColor: '#DBB572', backgroundColor: isVideoDragActive ? 'rgba(219, 181, 114, 0.1)' : 'rgba(255, 255, 255, 0.05)' }}
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
                      ✓ Vidéo uploadée avec succès sur S3
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
                {...register('autorisation_diffusion_video', { required: true })}
              />
              <span className="text-sm" style={{ color: 'white' }}>
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
                  style={{ borderColor: '#DBB572', backgroundColor: isAttestationDragActive ? 'rgba(219, 181, 114, 0.1)' : 'rgba(255, 255, 255, 0.05)' }}
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
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>
                  Extrait KBIS (moins de 3 mois) *
                </label>
                <div
                  {...getKBISRootProps()}
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
                  style={{ borderColor: '#DBB572', backgroundColor: isKBISDragActive ? 'rgba(219, 181, 114, 0.1)' : 'rgba(255, 255, 255, 0.05)' }}
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
              </div>
            </div>
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
                {...register('acceptation_reglement', { required: true })}
              />
              <span className="text-sm" style={{ color: 'white' }}>J&apos;ai lu et accepté le règlement</span>
            </label>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'white' }}>Votre signature *</label>
              <div className="rounded-lg p-4" style={{ border: '2px solid #DBB572' }}>
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
    <div className="min-h-screen py-8" style={{ backgroundColor: '#10214B', backgroundImage: 'url(/seeph-bg-top.png)', backgroundPosition: '50% -80%', backgroundRepeat: 'no-repeat', backgroundSize: 'cover' }}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Barre de progression */}
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

        {/* Contenu de l'étape */}
        <div className="rounded-lg shadow-sm p-8" style={{ backgroundColor: 'transparent' }}>
          {renderEtape()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrevious}
            disabled={etapeActuelle === 1}
            className="px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{ border: '1px solid rgba(255, 255, 255, 0.19)', color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.16)' }}
          >
            <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <mask id="mask0_121_33149" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="25" height="24">
                <rect width="24" height="24" transform="matrix(-1 0 0 1 24.5 0)" fill="#D9D9D9"/>
              </mask>
              <g mask="url(#mask0_121_33149)">
                <path d="M12.5 21C13.75 21 14.9208 20.7625 16.0125 20.2875C17.1042 19.8125 18.0542 19.1708 18.8625 18.3625C19.6708 17.5542 20.3125 16.6042 20.7875 15.5125C21.2625 14.4208 21.5 13.25 21.5 12C21.5 10.75 21.2625 9.57917 20.7875 8.4875C20.3125 7.39583 19.6708 6.44583 18.8625 5.6375C18.0542 4.82917 17.1042 4.1875 16.0125 3.7125C14.9208 3.2375 13.75 3 12.5 3V5C14.45 5 16.1042 5.67917 17.4625 7.0375C18.8208 8.39583 19.5 10.05 19.5 12C19.5 13.95 18.8208 15.6042 17.4625 16.9625C16.1042 18.3208 14.45 19 12.5 19V21ZM8.5 17L9.9 15.575L7.325 13H15.5V11H7.325L9.9 8.4L8.5 7L3.5 12L8.5 17Z" fill="white"/>
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
                  <rect x="0.5" width="24" height="24" fill="#D9D9D9"/>
                </mask>
                <g mask="url(#mask0_183_6845)">
                  <path d="M12.5 21C11.25 21 10.0792 20.7625 8.9875 20.2875C7.89583 19.8125 6.94583 19.1708 6.1375 18.3625C5.32917 17.5542 4.6875 16.6042 4.2125 15.5125C3.7375 14.4208 3.5 13.25 3.5 12C3.5 10.75 3.7375 9.57917 4.2125 8.4875C4.6875 7.39583 5.32917 6.44583 6.1375 5.6375C6.94583 4.82917 7.89583 4.1875 8.9875 3.7125C10.0792 3.2375 11.25 3 12.5 3V5C10.55 5 8.89583 5.67917 7.5375 7.0375C6.17917 8.39583 5.5 10.05 5.5 12C5.5 13.95 6.17917 15.6042 7.5375 16.9625C8.89583 18.3208 10.55 19 12.5 19V21ZM16.5 17L15.1 15.575L17.675 13H9.5V11H17.675L15.1 8.4L16.5 7L21.5 12L16.5 17Z" fill="#10214B"/>
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
                  <rect x="0.5" width="24" height="24" fill="#D9D9D9"/>
                </mask>
                <g mask="url(#mask0_183_6845_submit)">
                  <path d="M12.5 21C11.25 21 10.0792 20.7625 8.9875 20.2875C7.89583 19.8125 6.94583 19.1708 6.1375 18.3625C5.32917 17.5542 4.6875 16.6042 4.2125 15.5125C3.7375 14.4208 3.5 13.25 3.5 12C3.5 10.75 3.7375 9.57917 4.2125 8.4875C4.6875 7.39583 5.32917 6.44583 6.1375 5.6375C6.94583 4.82917 7.89583 4.1875 8.9875 3.7125C10.0792 3.2375 11.25 3 12.5 3V5C10.55 5 8.89583 5.67917 7.5375 7.0375C6.17917 8.39583 5.5 10.05 5.5 12C5.5 13.95 6.17917 15.6042 7.5375 16.9625C8.89583 18.3208 10.55 19 12.5 19V21ZM16.5 17L15.1 15.575L17.675 13H9.5V11H17.675L15.1 8.4L16.5 7L21.5 12L16.5 17Z" fill="#10214B"/>
                </g>
              </svg>
            </button>
          )}
        </div>
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
