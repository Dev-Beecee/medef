'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Users, Video, TrendingUp } from 'lucide-react';

interface VoteStats {
  totalVotes: number;
  totalVoters: number;
  totalParticipations: number;
  totalApproved: number;
  categoryStats: {
    categoryId: number;
    categoryName: string;
    totalVotes: number;
    approvedVotes: number;
  }[];
}

const VoteStatsComponent: React.FC = () => {
  const [stats, setStats] = useState<VoteStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);

      // Récupérer les statistiques générales
      const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select(`
          id,
          vote_value,
          video_id,
          category_id,
          email,
          vote_categories!inner(name)
        `);

      if (votesError) throw votesError;

      // Récupérer le nombre total de participations validées
      const { data: participationsData, error: participationsError } = await supabase
        .from('participations')
        .select('id')
        .eq('statut', 'validé')
        .not('video_s3_url', 'is', null);

      if (participationsError) throw participationsError;

      // Calculer les statistiques
      const totalVotes = votesData?.length || 0;
      const uniqueVoters = new Set(votesData?.map(v => v.email) || []).size;
      const totalParticipations = participationsData?.length || 0;
      const totalApproved = votesData?.filter(v => v.vote_value === 1).length || 0;

      // Statistiques par catégorie
      const categoryMap = new Map<number, { name: string; votes: number[] }>();
      
      votesData?.forEach(vote => {
        const categoryId = vote.category_id;
        const categoryName = vote.vote_categories.name;
        
        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, { name: categoryName, votes: [] });
        }
        categoryMap.get(categoryId)!.votes.push(vote.vote_value);
      });

      const categoryStats = Array.from(categoryMap.entries()).map(([categoryId, data]) => ({
        categoryId,
        categoryName: data.name,
        totalVotes: data.votes.length,
        approvedVotes: data.votes.filter(v => v === 1).length
      }));

      setStats({
        totalVotes,
        totalVoters: uniqueVoters,
        totalParticipations,
        totalApproved,
        categoryStats
      });

    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-500">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Statistiques des Votes</h2>
        <p className="text-gray-600">Vue d&apos;ensemble des votes enregistrés</p>
      </div>

      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Total Votes</p>
                <p className="text-2xl font-bold">{stats.totalVotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Votants Uniques</p>
                <p className="text-2xl font-bold">{stats.totalVoters}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Video className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Candidatures</p>
                <p className="text-2xl font-bold">{stats.totalParticipations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Approuvées</p>
                <p className="text-2xl font-bold">{stats.totalApproved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques par catégorie */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Statistiques par Catégorie</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.categoryStats.map((category) => (
            <Card key={category.categoryId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Badge variant="secondary">{category.categoryName}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total votes:</span>
                    <span className="font-medium">{category.totalVotes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Approuvées:</span>
                    <span className="font-medium text-green-600">{category.approvedVotes}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VoteStatsComponent;
