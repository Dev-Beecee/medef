'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  BarChart3, 
  Users, 
  Video, 
  Trophy, 
  Medal,
  Award,
  ChevronLeft,
  ChevronRight,
  Play
} from 'lucide-react';
import Link from 'next/link';

interface CategoryStats {
  categoryId: number;
  categoryName: string;
  totalVotes: number;
  approvedVotes: number;
  participationCount: number;
}

interface VideoStats {
  participationId: string;
  nomEtablissement: string;
  nomCandidat: string;
  totalVotes: number;
  approvedVotes: number;
  categories: string[];
  videoUrl: string | null;
}

interface TopVideo extends VideoStats {
  rank: number;
}

export default function GhostStatsPage() {
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [videoStats, setVideoStats] = useState<VideoStats[]>([]);
  const [top3Videos, setTop3Videos] = useState<TopVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    totalVotes: 0,
    totalVoters: 0,
    totalParticipations: 0
  });
  
  // États pour la pagination du classement
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);

      // Récupérer les votes
      const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select('*');

      if (votesError) throw votesError;

      // Récupérer toutes les participations pour avoir le décompte total
      const { data: participationsData, error: participationsError } = await supabase
        .from('participations')
        .select('id, nom_etablissement, nom_candidat, categories_selectionnees, video_s3_url')
        .eq('statut', 'validé')
        .not('video_s3_url', 'is', null);

      if (participationsError) throw participationsError;

      // Récupérer toutes les catégories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('vote_categories')
        .select('id, name')
        .order('order_index');

      if (categoriesError) throw categoriesError;

      // Calculer les statistiques par catégorie
      const categoryStatsMap = new Map<number, CategoryStats>();
      
      categoriesData.forEach(category => {
        categoryStatsMap.set(category.id, {
          categoryId: category.id,
          categoryName: category.name,
          totalVotes: 0,
          approvedVotes: 0,
          participationCount: 0
        });
      });

      // Calculer les statistiques par vidéo
      const videoStatsMap = new Map<string, VideoStats>();

      participationsData.forEach(participation => {
        videoStatsMap.set(participation.id, {
          participationId: participation.id,
          nomEtablissement: participation.nom_etablissement,
          nomCandidat: participation.nom_candidat,
          totalVotes: 0,
          approvedVotes: 0,
          categories: participation.categories_selectionnees?.map((catId: string) => {
            const category = categoriesData.find(c => c.id === parseInt(catId));
            return category?.name || `Catégorie ${catId}`;
          }) || [],
          videoUrl: participation.video_s3_url
        });
      });

      // Traiter les votes
      votesData.forEach(vote => {
        const categoryId = vote.category_id;
        const participationId = vote.video_id;

        // Statistiques par catégorie
        if (categoryStatsMap.has(categoryId)) {
          const categoryStat = categoryStatsMap.get(categoryId)!;
          categoryStat.totalVotes++;
          if (vote.vote_value === 1) {
            categoryStat.approvedVotes++;
          }
        }

        // Statistiques par vidéo
        if (videoStatsMap.has(participationId)) {
          const videoStat = videoStatsMap.get(participationId)!;
          videoStat.totalVotes++;
          if (vote.vote_value === 1) {
            videoStat.approvedVotes++;
          }
        }
      });

      // Compter les participations par catégorie
      participationsData.forEach(participation => {
        participation.categories_selectionnees?.forEach((catId: string) => {
          const categoryId = parseInt(catId);
          if (categoryStatsMap.has(categoryId)) {
            categoryStatsMap.get(categoryId)!.participationCount++;
          }
        });
      });

      // Convertir en arrays et trier
      const categoryStatsArray = Array.from(categoryStatsMap.values())
        .sort((a, b) => b.totalVotes - a.totalVotes);

      const videoStatsArray = Array.from(videoStatsMap.values())
        .sort((a, b) => b.approvedVotes - a.approvedVotes);

      // Top 3 des vidéos
      const top3 = videoStatsArray.slice(0, 3).map((video, index) => ({
        ...video,
        rank: index + 1
      }));

      // Statistiques globales
      const uniqueVoters = new Set(votesData.map(v => v.email)).size;

      setCategoryStats(categoryStatsArray);
      setVideoStats(videoStatsArray);
      setTop3Videos(top3);
      setTotalStats({
        totalVotes: votesData.length,
        totalVoters: uniqueVoters,
        totalParticipations: participationsData.length
      });

    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <span className="w-6 h-6 text-gray-500 font-bold">{rank}</span>;
    }
  };

  // Calculs de pagination pour le classement
  const totalPages = Math.ceil(videoStats.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVideoStats = videoStats.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/ghost-dashboard">
              <Button variant="outline" size="sm">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Retour au dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Statistiques des Votes</h1>
          </div>
          <p className="text-gray-600">Analyse détaillée des votes et performances</p>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Votes</p>
                  <p className="text-2xl font-bold">{totalStats.totalVotes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Votants Uniques</p>
                  <p className="text-2xl font-bold">{totalStats.totalVoters}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Video className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Candidatures</p>
                  <p className="text-2xl font-bold">{totalStats.totalParticipations}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top 3 des vidéos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Top 3 des Candidatures
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {top3Videos.map((video) => (
                <div key={video.participationId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    {getRankIcon(video.rank)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {video.nomEtablissement}
                    </h4>
                    <p className="text-sm text-gray-600 truncate">
                      {video.nomCandidat}
                    </p>
                    <div className="flex flex-col gap-1 mt-1">
                      {video.categories.map((category, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Voir la vidéo
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>
                              {video.nomEtablissement} - {video.nomCandidat}
                            </DialogTitle>
                          </DialogHeader>
                        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                          {video.videoUrl ? (
                            <video 
                              controls 
                              className="w-full h-full"
                              src={video.videoUrl}
                              preload="metadata"
                            >
                              Votre navigateur ne supporte pas la lecture vidéo.
                            </video>
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              <p>Vidéo non disponible</p>
                            </div>
                          )}
                        </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{video.approvedVotes}</p>
                    <p className="text-xs text-gray-500">votes</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Statistiques par catégorie */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Votes par Catégorie
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryStats.map((category) => (
                <div key={category.categoryId} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {category.categoryName}
                    </h4>
                    <Badge variant="outline">
                      {category.participationCount} candidatures
                    </Badge>
                  </div>
                  <div className="text-sm">
                    <div>
                      <p className="text-gray-600">Total votes:</p>
                      <p className="font-bold">{category.totalVotes}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Toutes les candidatures */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-purple-500" />
              Classement de toutes les Candidatures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paginatedVideoStats.map((video, index) => (
                <div key={video.participationId} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-shrink-0 w-8 text-center">
                    <span className="font-bold text-gray-500">#{startIndex + index + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {video.nomEtablissement}
                    </h4>
                    <p className="text-sm text-gray-600 truncate">
                      {video.nomCandidat}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {video.categories.map((category, catIndex) => (
                        <Badge key={catIndex} variant="secondary" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                    <div className="mt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Voir la vidéo
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>
                              {video.nomEtablissement} - {video.nomCandidat}
                            </DialogTitle>
                          </DialogHeader>
                        <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                          {video.videoUrl ? (
                            <video 
                              controls 
                              className="w-full h-full"
                              src={video.videoUrl}
                              preload="metadata"
                            >
                              Votre navigateur ne supporte pas la lecture vidéo.
                            </video>
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              <p>Vidéo non disponible</p>
                            </div>
                          )}
                        </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{video.approvedVotes}</p>
                    <p className="text-xs text-gray-500">sur {video.totalVotes} votes</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Contrôles de pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Affichage de {startIndex + 1} à {Math.min(endIndex, videoStats.length)} sur {videoStats.length} candidatures
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber
                      if (totalPages <= 5) {
                        pageNumber = i + 1
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i
                      } else {
                        pageNumber = currentPage - 2 + i
                      }
                      
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNumber)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNumber}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
