import VoteStatsComponent from '@/components/VoteStats';

export default function VoteStatsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Statistiques des Votes
          </h1>
          <p className="text-lg text-gray-600">
            Vue d&apos;ensemble des votes enregistrés dans le système
          </p>
        </div>
        
        <VoteStatsComponent />
      </div>
    </div>
  );
}
