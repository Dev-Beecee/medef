'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useEmailCheck } from '@/hooks/useEmailCheck';
import StepIndicator from './StepIndicator';
import VideoGrid from './VideoGrid';
import VoteSummary from './VoteSummary';
import EmailInput from './EmailInput';

interface Participation {
  id: string;
  nom_etablissement: string;
  nom_candidat: string;
  prenom_candidat: string;
  video_s3_url: string;
  categories_selectionnees: number[];
  statut: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  order_index: number;
}

interface VoteData {
  participationId: string;
  categoryId: number;
  voteValue: number;
}

interface VoteSummary {
  participation: Participation;
  votes: { [categoryId: number]: number };
}

const VoteComponent: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentVotes, setCurrentVotes] = useState<VoteData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [voteSummary, setVoteSummary] = useState<VoteSummary[]>([]);
  
  const emailCheck = useEmailCheck();

  useEffect(() => {
    fetchData();
  }, []);


  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer les catégories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('vote_categories')
        .select('*')
        .order('order_index');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Récupérer les participations validées avec vidéos
      const { data: participationsData, error: participationsError } = await supabase
        .from('participations')
        .select('*')
        .eq('statut', 'validé')
        .not('video_s3_url', 'is', null)
        .order('created_at');

      if (participationsError) throw participationsError;
      setParticipations(participationsData || []);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = (participationId: string, categoryId: number, voteValue: number) => {
    const existingVoteIndex = currentVotes.findIndex(
      vote => vote.participationId === participationId && vote.categoryId === categoryId
    );

    if (existingVoteIndex >= 0) {
      // Mettre à jour le vote existant
      const updatedVotes = [...currentVotes];
      updatedVotes[existingVoteIndex].voteValue = voteValue;
      setCurrentVotes(updatedVotes);
    } else {
      // Ajouter un nouveau vote
      setCurrentVotes([...currentVotes, { participationId, categoryId, voteValue }]);
    }
  };

  const getVoteForParticipation = (participationId: string, categoryId: number): number => {
    const vote = currentVotes.find(
      v => v.participationId === participationId && v.categoryId === categoryId
    );
    return vote ? vote.voteValue : -1; // -1 = pas de vote, 0 = non, 1 = oui
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };


  const submitVotes = async () => {
    if (!emailCheck.email) {
      toast.error('Veuillez saisir votre email');
      return;
    }

    // Vérifier que l'email n'a pas déjà voté
    const emailValid = await emailCheck.checkEmail(emailCheck.email);
    if (!emailValid) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Préparer les votes à insérer
      const votesToInsert = currentVotes.map(vote => ({
        video_id: vote.participationId, // Utiliser l'ID de participation comme video_id
        category_id: vote.categoryId,
        email: emailCheck.email,
        vote_value: vote.voteValue
      }));

      // Insérer tous les votes
      const { error } = await supabase
        .from('votes')
        .insert(votesToInsert);

      if (error) throw error;

      // Préparer les données pour la page de confirmation
      const votedParticipations = currentVotes
        .filter(vote => vote.voteValue === 1)
        .map(vote => {
          const participation = participations.find(p => p.id === vote.participationId);
          return participation?.nom_etablissement || 'Candidature inconnue';
        });

      // Rediriger vers la page de confirmation
      const confirmationParams = new URLSearchParams({
        email: emailCheck.email,
        totalVotes: currentVotes.filter(v => v.voteValue === 1).length.toString(),
        votedParticipations: encodeURIComponent(JSON.stringify(votedParticipations))
      });

      window.location.href = `/vote-confirmation?${confirmationParams.toString()}`;
      
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement des votes:', error);
      toast.error('Erreur lors de l\'enregistrement des votes');
    } finally {
      setIsLoading(false);
    }
  };

  const generateVoteSummary = () => {
    const summary: VoteSummary[] = [];
    
    participations.forEach(participation => {
      const votes: { [categoryId: number]: number } = {};
      
      participation.categories_selectionnees.forEach(categoryId => {
        const vote = currentVotes.find(
          v => v.participationId === participation.id && v.categoryId === parseInt(categoryId)
        );
        if (vote) {
          votes[parseInt(categoryId)] = vote.voteValue;
        }
      });
      
      if (Object.keys(votes).length > 0) {
        summary.push({ participation, votes });
      }
    });
    
    setVoteSummary(summary);
  };

  useEffect(() => {
    if (currentStep === 5) {
      generateVoteSummary();
    }
  }, [currentStep, currentVotes, participations, generateVoteSummary]);

  const renderCategoryStep = (categoryIndex: number) => {
    const category = categories[categoryIndex];
    if (!category) return null;

    const categoryParticipations = participations.filter(participation => 
      participation.categories_selectionnees.includes(category.id.toString())
    );

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">{category.name}</h2>
          <p className="text-gray-600">{category.description}</p>
        </div>

        <VideoGrid
          participations={categoryParticipations}
          categoryId={category.id}
          getVoteForParticipation={getVoteForParticipation}
          onVote={handleVote}
        />
      </div>
    );
  };

  const renderValidationStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Récapitulatif des votes</h2>
        <p className="text-gray-600">Vérifiez vos votes avant de les soumettre</p>
      </div>

      <VoteSummary 
        voteSummary={voteSummary} 
        categories={categories} 
      />

      <EmailInput
        email={emailCheck.email}
        isLoading={emailCheck.isLoading}
        onEmailChange={emailCheck.setEmail}
        onSubmit={submitVotes}
      />
    </div>
  );

  if (isLoading && participations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des candidatures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <StepIndicator currentStep={currentStep} totalSteps={5} />

      <div className="mb-8">
        {currentStep <= 4 && renderCategoryStep(currentStep - 1)}
        {currentStep === 5 && renderValidationStep()}
      </div>

      <div className="flex justify-between">
        <Button
          onClick={handlePrevious}
          disabled={currentStep === 1}
          variant="outline"
        >
          <ChevronLeft size={20} className="mr-2" />
          Précédent
        </Button>

        {currentStep < 5 ? (
          <Button onClick={handleNext}>
            Suivant
            <ChevronRight size={20} className="ml-2" />
          </Button>
        ) : (
          <Button 
            onClick={submitVotes} 
            disabled={voteSummary.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            Soumettre les votes
          </Button>
        )}
      </div>
    </div>
  );
};

export default VoteComponent;
