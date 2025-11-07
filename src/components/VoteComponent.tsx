'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
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
  categories_selectionnees: string[];
  statut: string;
  activite_principale: string;
  inclusion_handicap_approche: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  order_index: number;
  created_at?: string | null;
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
      
      // Récupérer les participations validées avec vidéos
      const { data: participationsData, error: participationsError } = await supabase
        .from('participations')
        .select('*')
        .eq('statut', 'validé')
        .not('video_s3_url', 'is', null)
        .order('created_at');

      if (participationsError) throw participationsError;
      // Les participations filtrées ont toujours video_s3_url non null
      console.log('=== PARTICIPATIONS LOADED ===', participationsData);
      console.log('Number of participations:', participationsData?.length);
      if (participationsData && participationsData.length > 0) {
        console.log('First participation categories:', participationsData[0].categories_selectionnees);
      }
      setParticipations((participationsData || []) as Participation[]);

      // Récupérer les catégories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('vote_categories')
        .select('*')
        .order('id');

      console.log('=== CATEGORIES REQUEST ===');
      console.log('Categories data:', categoriesData);
      console.log('Categories error:', categoriesError);
      
      let categoriesToUse: Category[] = [];
      
      if (categoriesError) {
        console.error('Erreur lors du chargement des catégories:', categoriesError);
        // Si erreur, on crée les catégories depuis les participations
        if (participationsData && participationsData.length > 0) {
          const uniqueCategories = new Set<string>();
          participationsData.forEach((participation: any) => {
            if (participation.categories_selectionnees && Array.isArray(participation.categories_selectionnees)) {
              participation.categories_selectionnees.forEach((cat: string) => {
                uniqueCategories.add(cat);
              });
            }
          });
          
          categoriesToUse = Array.from(uniqueCategories).map((name, index) => ({
            id: index + 1,
            name: name,
            description: '',
            order_index: index + 1,
            created_at: null
          }));
        }
      } else if (!categoriesData || categoriesData.length === 0) {
        // Si la table est vide, créer les catégories depuis les participations
        console.log('Table vote_categories est vide, création des catégories depuis les participations');
        if (participationsData && participationsData.length > 0) {
          const uniqueCategories = new Set<string>();
          participationsData.forEach((participation: any) => {
            if (participation.categories_selectionnees && Array.isArray(participation.categories_selectionnees)) {
              participation.categories_selectionnees.forEach((cat: string) => {
                uniqueCategories.add(cat);
              });
            }
          });
          
          // Créer les catégories dans la base de données
          const categoriesToInsert = Array.from(uniqueCategories).map((name, index) => ({
            name: name,
            description: '',
            order_index: index + 1
          }));
          
          const { error: insertError } = await supabase
            .from('vote_categories')
            .insert(categoriesToInsert);
          
          if (insertError) {
            console.error('Erreur lors de la création des catégories:', insertError);
            // Utiliser les catégories en mémoire même si l'insertion échoue
            categoriesToUse = Array.from(uniqueCategories).map((name, index) => ({
              id: index + 1,
              name: name,
              description: '',
              order_index: index + 1,
              created_at: null
            }));
          } else {
            // Recharger les catégories depuis la base
            const { data: newCategoriesData, error: reloadError } = await supabase
              .from('vote_categories')
              .select('*')
              .order('id');
            
            if (!reloadError && newCategoriesData) {
              categoriesToUse = newCategoriesData.map((cat: any, index: number) => ({
                id: cat.id,
                name: cat.name,
                description: cat.description || '',
                order_index: cat.order_index !== undefined ? cat.order_index : index + 1,
                created_at: cat.created_at
              }));
            }
          }
        }
      } else {
        // Mapper les données pour s'assurer que description et order_index existent
        categoriesToUse = categoriesData.map((cat: any, index: number) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description || '',
          order_index: cat.order_index !== undefined ? cat.order_index : index + 1,
          created_at: cat.created_at
        }));
      }
      
      console.log('=== CATEGORIES LOADED ===', categoriesToUse);
      setCategories(categoriesToUse);

    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = (participationId: string, categoryId: number, voteValue: number) => {
    // Supprimer tous les votes existants pour cette catégorie
    // Garder les votes des autres catégories
    const votesForOtherCategories = currentVotes.filter(
      vote => vote.categoryId !== categoryId
    );
    
    if (voteValue === 1) {
      // Ajouter le nouveau vote
      setCurrentVotes([
        ...votesForOtherCategories,
        { participationId, categoryId, voteValue: 1 }
      ]);
    } else {
      // Si on désélectionne, garder seulement les votes des autres catégories
      setCurrentVotes(votesForOtherCategories);
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

  const generateVoteSummary = useCallback(() => {
    const summary: VoteSummary[] = [];
    
    participations.forEach(participation => {
      const votes: { [categoryId: number]: number } = {};
      
      participation.categories_selectionnees.forEach(categoryName => {
        // Trouver l'ID de la catégorie à partir de son nom
        const category = categories.find(cat => cat.name === categoryName);
        if (category) {
          const vote = currentVotes.find(
            v => v.participationId === participation.id && v.categoryId === category.id
          );
          if (vote) {
            votes[category.id] = vote.voteValue;
          }
        }
      });
      
      if (Object.keys(votes).length > 0) {
        summary.push({ participation, votes });
      }
    });
    
    setVoteSummary(summary);
  }, [participations, currentVotes, categories]);

  useEffect(() => {
    if (currentStep === 5) {
      generateVoteSummary();
    }
  }, [currentStep, currentVotes, participations, generateVoteSummary]);

  const renderCategoryStep = (categoryIndex: number) => {
    const category = categories[categoryIndex];
    if (!category) return null;

    console.log('=== DEBUG CATEGORY STEP ===');
    console.log('Current category:', category);
    console.log('Total participations:', participations.length);
    console.log('Participations data:', participations);
    
    const categoryParticipations = participations.filter(participation => {
      console.log(`Checking participation ${participation.nom_etablissement}:`, {
        categories_selectionnees: participation.categories_selectionnees,
        includes: participation.categories_selectionnees.includes(category.name)
      });
      return participation.categories_selectionnees.includes(category.name);
    });
    
    console.log('Filtered participations:', categoryParticipations.length);
    console.log('Category participations:', categoryParticipations);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-left" style={{ color: '#dbb572' }}>Catégorie : {category.name}</h2>
          <p className="text-white text-left">{category.description}</p>
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
        <h2 className="text-2xl font-bold mb-2 text-left" style={{ color: '#dbb572' }}>Récapitulatif des votes</h2>
        <p className="text-white text-left">Vérifiez vos votes avant de les soumettre</p>
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
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des candidatures...</p>
        </div>
      </div>
    );
  }

  console.log('=== RENDER VOTECOMPONENT ===');
  console.log('Current step:', currentStep);
  console.log('Categories count:', categories.length);
  console.log('Participations count:', participations.length);
  console.log('Categories:', categories);
  console.log('Participations:', participations);

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
          style={{
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.19)',
            background: 'rgba(255, 255, 255, 0.16)',
            backdropFilter: 'blur(40px)',
            color: 'white'
          }}
        >
          <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <mask id="mask0_132_61537" style={{maskType:"alpha"}} maskUnits="userSpaceOnUse" x="0" y="0" width="25" height="24">
              <rect width="24" height="24" transform="matrix(-1 0 0 1 24.5 0)" fill="#D9D9D9"/>
            </mask>
            <g mask="url(#mask0_132_61537)">
              <path d="M12.5 21C13.75 21 14.9208 20.7625 16.0125 20.2875C17.1042 19.8125 18.0542 19.1708 18.8625 18.3625C19.6708 17.5542 20.3125 16.6042 20.7875 15.5125C21.2625 14.4208 21.5 13.25 21.5 12C21.5 10.75 21.2625 9.57917 20.7875 8.4875C20.3125 7.39583 19.6708 6.44583 18.8625 5.6375C18.0542 4.82917 17.1042 4.1875 16.0125 3.7125C14.9208 3.2375 13.75 3 12.5 3V5C14.45 5 16.1042 5.67917 17.4625 7.0375C18.8208 8.39583 19.5 10.05 19.5 12C19.5 13.95 18.8208 15.6042 17.4625 16.9625C16.1042 18.3208 14.45 19 12.5 19V21ZM8.5 17L9.9 15.575L7.325 13H15.5V11H7.325L9.9 8.4L8.5 7L3.5 12L8.5 17Z" fill="white"/>
            </g>
          </svg>
          Précédent
        </Button>

        {currentStep < 5 && (
          <Button 
            onClick={handleNext}
            style={{
              borderRadius: '10px',
              border: '1px solid #EBE7E1',
              background: '#DBB572',
              backdropFilter: 'blur(40px)',
              color: '#10214b'
            }}
          >
            Suivant
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-2">
              <mask id="mask0_288_10446" style={{maskType:"alpha"}} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
                <rect width="24" height="24" fill="#D9D9D9"/>
              </mask>
              <g mask="url(#mask0_288_10446)">
                <path d="M12 21C10.75 21 9.57917 20.7625 8.4875 20.2875C7.39583 19.8125 6.44583 19.1708 5.6375 18.3625C4.82917 17.5542 4.1875 16.6042 3.7125 15.5125C3.2375 14.4208 3 13.25 3 12C3 10.75 3.2375 9.57917 3.7125 8.4875C4.1875 7.39583 4.82917 6.44583 5.6375 5.6375C6.44583 4.82917 7.39583 4.1875 8.4875 3.7125C9.57917 3.2375 10.75 3 12 3V5C10.05 5 8.39583 5.67917 7.0375 7.0375C5.67917 8.39583 5 10.05 5 12C5 13.95 5.67917 15.6042 7.0375 16.9625C8.39583 18.3208 10.05 19 12 19V21ZM16 17L14.6 15.575L17.175 13H9V11H17.175L14.6 8.4L16 7L21 12L16 17Z" fill="#10214B"/>
              </g>
            </svg>
          </Button>
        )}
      </div>
    </div>
  );
};

export default VoteComponent;
