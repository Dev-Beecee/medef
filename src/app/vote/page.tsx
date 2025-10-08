import VoteComponent from '@/components/VoteComponent';

export default function VotePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Système de Vote
          </h1>
          <p className="text-lg text-gray-600">
            Votez pour vos vidéos préférées dans chaque catégorie
          </p>
        </div>
        
        <VoteComponent />
      </div>
    </div>
  );
}

