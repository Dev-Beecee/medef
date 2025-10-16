import VoteComponent from '@/components/VoteComponent';

export default function VotePage() {
  return (
    <div className="min-h-screen bg-[#10214b]">
      <div className="container mx-auto py-8">
        <div 
          className="text-center mb-8 py-8 px-6 rounded-lg max-w-3xl mx-auto"
          style={{
            backgroundColor: '#dbb572',
            color: '#10214b'
          }}
        >
          <h1 className="text-3xl font-bold mb-6">
            Votez pour les vidéos les plus inspirantes et soutenez les entreprises qui font avancer l&apos;inclusion en Martinique.
          </h1>
          <p className="text-lg mb-4">
            Découvrez les initiatives des entreprises et administrations locales engagées pour l&apos;intégration des personnes en situation de handicap : recrutement, accompagnement, alternance ou collaboration.
          </p>
          <p className="text-lg font-semibold">
            Vous disposez d&apos;un vote par catégorie, ouvert jusqu&apos;au 13 novembre 2025.
          </p>
        </div>
        
        <VoteComponent />
      </div>
    </div>
  );
}

