'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Hero from '@/components/Hero';
import Link from 'next/link';

interface VoteConfirmationData {
  email: string;
  totalVotes: number;
  votedParticipations: string[];
}

function VoteConfirmationContent() {
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#10214B' }}>
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
    <>
      <Hero />
      <div className="py-12 px-4 bg-[#10214B] bg-[url(/seeph-bg_confirmationvote.png)] bg-[50%_100%] bg-[50%] bg-no-repeat min-h-[500px] md:bg-[50%_100%] md:bg-[50%] [background-position:50%_80%] [background-size:100%] md:[background-position:50%_100%] md:[background-size:50%]" style={{ 
        backgroundColor: '#10214B',
         backgroundImage: 'url(/seeph-bg_confirmationvote.png)',
          backgroundPosition: '50% 80%',
          backgroundSize: '100%',
          backgroundRepeat: 'no-repeat',
          minHeight: '500px'
        }}>
      <div className="max-w-4xl mx-auto">
       <h2 className="text-2xl font-bold mb-2 text-center uppercase mt-24" style={{ color: '#dbb572' }}>
       Votre vote a bien été enregistré !
       </h2>
         <div className="w-max mx-auto uppercase mt-24 text-[15px] md:text-[40px]" style={{ 
          color: '#10214B', 
          textAlign: 'center', 
          fontFamily: 'Poppins', 
          fontStyle: 'normal', 
          fontWeight: 700,
          backgroundColor: '#dbb572',
          padding: '10px 20px',
          borderRadius: '10px'
        }}>
         <h3>
         Merci pour votre participation
         </h3>
        </div>
      </div>
      </div>
    </>
  );
}

export default function VoteConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <VoteConfirmationContent />
    </Suspense>
  );
}
