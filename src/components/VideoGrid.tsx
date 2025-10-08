'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Play } from 'lucide-react';

interface Participation {
  id: string;
  nom_etablissement: string;
  nom_candidat: string;
  prenom_candidat: string;
  video_s3_url: string;
  categories_selectionnees: string[];
  statut: string;
}

interface VideoCardProps {
  participation: Participation;
  categoryId: number;
  currentVote: number;
  onVote: (participationId: string, categoryId: number, voteValue: number) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ participation, categoryId, currentVote, onVote }) => {
  const renderRadioButtons = () => {
    return (
      <div className="flex gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id={`${participation.id}-${categoryId}-vote`}
            checked={currentVote === 1}
            onChange={() => onVote(participation.id, categoryId, currentVote === 1 ? -1 : 1)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
          />
          <Label htmlFor={`${participation.id}-${categoryId}-vote`} className="text-green-600 font-medium">
            Je vote
          </Label>
        </div>
      </div>
    );
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="p-0">
        <div className="relative aspect-video bg-gray-200">
          {participation.video_s3_url ? (
            <video
              src={participation.video_s3_url}
              className="w-full h-full object-cover"
              controls
              preload="metadata"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play size={48} className="text-gray-400" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-lg mb-2 line-clamp-2">
          {participation.nom_etablissement}
        </CardTitle>
        <p className="text-sm text-gray-600 mb-2">
          <strong>Candidat :</strong> {participation.prenom_candidat} {participation.nom_candidat}
        </p>
        <div className="space-y-3">
          <Label className="text-sm font-medium">Votez pour cette candidature :</Label>
          {renderRadioButtons()}
        </div>
      </CardContent>
    </Card>
  );
};

interface VideoGridProps {
  participations: Participation[];
  categoryId: number;
  getVoteForParticipation: (participationId: string, categoryId: number) => number;
  onVote: (participationId: string, categoryId: number, voteValue: number) => void;
}

const VideoGrid: React.FC<VideoGridProps> = ({ 
  participations, 
  categoryId, 
  getVoteForParticipation, 
  onVote 
}) => {
  const [displayedParticipations, setDisplayedParticipations] = useState(12);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setDisplayedParticipations(window.innerWidth < 768 ? 6 : 12);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const participationsPerPage = isMobile ? 6 : 12;
  const visibleParticipations = participations.slice(0, displayedParticipations);
  const hasMoreParticipations = participations.length > displayedParticipations;

  const loadMoreParticipations = () => {
    setDisplayedParticipations(prev => prev + participationsPerPage);
  };

  if (participations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Aucune candidature disponible pour cette catégorie</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visibleParticipations.map((participation) => (
          <VideoCard
            key={participation.id}
            participation={participation}
            categoryId={categoryId}
            currentVote={getVoteForParticipation(participation.id, categoryId)}
            onVote={onVote}
          />
        ))}
      </div>

      {hasMoreParticipations && (
        <div className="text-center">
          <Button onClick={loadMoreParticipations} variant="outline">
            Voir plus de candidatures ({participations.length - displayedParticipations} restantes)
          </Button>
        </div>
      )}
    </div>
  );
};

export default VideoGrid;
