'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, CheckCircle } from 'lucide-react';

interface Participation {
  id: string;
  nom_etablissement: string;
  nom_candidat: string;
  prenom_candidat: string;
  video_s3_url: string;
  categories_selectionnees: string[];
  statut: string;
}

interface Category {
  id: number;
  name: string;
  description: string;
  order_index: number;
  created_at?: string | null;
}

interface VoteSummary {
  participation: Participation;
  votes: { [categoryId: number]: number };
}

interface VoteSummaryProps {
  voteSummary: VoteSummary[];
  categories: Category[];
}

const VoteSummaryComponent: React.FC<VoteSummaryProps> = ({ voteSummary, categories }) => {
  if (voteSummary.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Aucun vote enregistré</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {voteSummary.map(({ participation, votes }) => (
        <Card key={participation.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-gray-200 rounded flex-shrink-0">
                {participation.video_s3_url ? (
                  <video
                    src={participation.video_s3_url}
                    className="w-full h-full object-cover rounded"
                    controls
                    preload="metadata"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play size={24} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">{participation.nom_etablissement}</h3>
                <p className="text-sm text-gray-600 mb-3">
                  <strong>Candidat :</strong> {participation.prenom_candidat} {participation.nom_candidat}
                </p>
                <div className="space-y-1">
                  {Object.entries(votes).map(([categoryId, voteValue]) => {
                    const category = categories.find(c => c.id === parseInt(categoryId));
                    return (
                      <div key={categoryId} className="flex items-center gap-2">
                        <Badge variant="secondary">{category?.name}</Badge>
                        <div className="flex items-center gap-1">
                          {voteValue === 1 ? (
                            <>
                              <CheckCircle size={16} className="text-green-500" />
                              <span className="text-sm text-green-600 font-medium">Je vote</span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500 font-medium">Pas de vote</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default VoteSummaryComponent;
