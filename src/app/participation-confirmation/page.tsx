'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Mail, Calendar, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

function ParticipationConfirmationContent() {
  const searchParams = useSearchParams()
  const [participationData, setParticipationData] = useState<{
    nom_etablissement?: string
    nom_candidat?: string
    prenom_candidat?: string
    email?: string
    participationId?: string
  }>({})

  useEffect(() => {
    // Récupérer les données de la participation depuis les paramètres URL
    const nomEtablissement = searchParams.get('nom_etablissement')
    const nomCandidat = searchParams.get('nom_candidat')
    const prenomCandidat = searchParams.get('prenom_candidat')
    const email = searchParams.get('email')
    const participationId = searchParams.get('participation_id')

    setParticipationData({
      nom_etablissement: nomEtablissement || undefined,
      nom_candidat: nomCandidat || undefined,
      prenom_candidat: prenomCandidat || undefined,
      email: email || undefined,
      participationId: participationId || undefined
    })
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header avec icône de succès */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Participation confirmée !
          </h1>
          <p className="text-lg text-gray-600">
            Votre candidature a été soumise avec succès
          </p>
        </div>

        {/* Carte principale */}
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl text-gray-800">
              Les Trophées des administrations & entreprises inclusives de Martinique
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informations de la participation */}
            {participationData.nom_etablissement && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Détails de votre participation
                </h3>
                <div className="space-y-1 text-sm text-blue-800">
                  {participationData.nom_etablissement && (
                    <p><strong>Établissement :</strong> {participationData.nom_etablissement}</p>
                  )}
                  {participationData.prenom_candidat && participationData.nom_candidat && (
                    <p><strong>Candidat :</strong> {participationData.prenom_candidat} {participationData.nom_candidat}</p>
                  )}
                  {participationData.participationId && (
                    <p><strong>ID de participation :</strong> {participationData.participationId}</p>
                  )}
                </div>
              </div>
            )}

            {/* Message de confirmation */}
            <div className="text-center space-y-4">
              <p className="text-gray-700">
                Félicitations ! Votre candidature aux Trophées des administrations & entreprises inclusives de Martinique a été enregistrée avec succès.
              </p>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium">
                  Votre dossier sera examiné par notre jury dans les plus brefs délais.
                </p>
              </div>
            </div>

            {/* Prochaines étapes */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Prochaines étapes
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-semibold text-xs">1</span>
                  </div>
                  <p>Vous recevrez un email de confirmation à l&apos;adresse <strong>{participationData.email}</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-semibold text-xs">2</span>
                  </div>
                  <p>Notre équipe examinera votre dossier et vous contactera si nécessaire</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 font-semibold text-xs">3</span>
                  </div>
                  <p>Les résultats seront communiqués selon le calendrier prévu</p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Besoin d&apos;aide ?
              </h3>
              <p className="text-sm text-gray-600">
                Si vous avez des questions concernant votre participation, n&apos;hésitez pas à nous contacter.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button asChild className="flex-1">
                <Link href="/">
                  Retour à l&apos;accueil
                </Link>
              </Button>
              <Button variant="outline" asChild className="flex-1">
                <Link href="/participation">
                  Nouvelle participation
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Merci de votre participation aux Trophées des administrations & entreprises inclusives de Martinique</p>
        </div>
      </div>
    </div>
  )
}

export default function ParticipationConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <ParticipationConfirmationContent />
    </Suspense>
  )
}
