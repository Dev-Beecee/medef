'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';

interface VoteConfirmationData {
  email: string;
  totalVotes: number;
  votedParticipations: string[];
}

export default function VoteConfirmationPage() {
  const searchParams = useSearchParams();
  const [confirmationData, setConfirmationData] = useState<VoteConfirmationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Récupérer les données de confirmation depuis les paramètres URL
    const email = searchParams.get('email');
    const totalVotes = searchParams.get('totalVotes');
    const votedParticipations = searchParams.get('votedParticipations');

    if (email && totalVotes && votedParticipations) {
      setConfirmationData({
        email,
        totalVotes: parseInt(totalVotes),
        votedParticipations: JSON.parse(decodeURIComponent(votedParticipations))
      });
    }
    setIsLoading(false);
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!confirmationData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h1 className="text-xl font-bold text-red-600 mb-4">Erreur</h1>
            <p className="text-gray-600 mb-4">Données de confirmation non trouvées</p>
            <Link href="/vote">
              <Button className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au vote
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center bg-green-50 border-b">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-700">
              Vote enregistré avec succès !
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Merci pour votre participation au concours
            </p>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            {/* Résumé du vote */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Résumé de votre vote</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Email :</span> {confirmationData.email}</p>
                <p><span className="font-medium">Nombre de votes :</span> {confirmationData.totalVotes}</p>
                <p><span className="font-medium">Candidatures soutenues :</span> {confirmationData.votedParticipations.length}</p>
              </div>
            </div>

            {/* Message de confirmation */}
            <div className="text-center space-y-4">
              <p className="text-gray-700">
                Votre vote a été enregistré avec succès. Vous avez soutenu <strong>{confirmationData.totalVotes}</strong> candidature(s).
              </p>
              <p className="text-sm text-gray-600">
                Les résultats seront communiqués après la clôture du vote.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/vote" className="flex-1">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voir les statistiques
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Retour à l&apos;accueil
                </Button>
              </Link>
            </div>

            {/* Note importante */}
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note :</strong> Chaque adresse email ne peut voter qu&apos;une seule fois. 
                Votre vote est définitif et ne peut être modifié.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
