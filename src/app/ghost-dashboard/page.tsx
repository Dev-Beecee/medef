'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Link from 'next/link'
import { BarChart3, FileText, Download, Eye, Shield, Vote, Trophy } from 'lucide-react'

export default function GhostDashboard() {
  const [stats, setStats] = useState({
    totalParticipations: 0,
    totalVotes: 0,
    topVideo: null as { nom_etablissement: string; votes: number } | null,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Récupérer le nombre total de participations
        const { data: allParticipations, error: errorAll } = await supabase
          .from('participations')
          .select('id')

        if (errorAll) throw errorAll

        // Récupérer le nombre total de votes
        const { data: votes, error: errorVotes } = await supabase
          .from('votes')
          .select('id')

        if (errorVotes) throw errorVotes

        // Récupérer les votes positifs avec les participations
        const { data: votesData, error: errorVotesData } = await supabase
          .from('votes')
          .select('video_id')
          .eq('vote_value', 1)

        if (errorVotesData) throw errorVotesData

        // Récupérer toutes les participations pour avoir les noms d'entreprises
        const { data: participationsData, error: errorParticipations } = await supabase
          .from('participations')
          .select('id, nom_etablissement')

        if (errorParticipations) throw errorParticipations

        // Créer un map des participations par ID
        const participationsMap = new Map()
        participationsData?.forEach(part => {
          participationsMap.set(part.id, part.nom_etablissement)
        })

        // Compter les votes par vidéo
        const voteCounts: { [key: string]: { nom_etablissement: string; votes: number } } = {}
        
        votesData?.forEach((vote: { video_id: string }) => {
          const videoId = vote.video_id
          const nomEtablissement = participationsMap.get(videoId) || 'Inconnu'
          
          if (!voteCounts[videoId]) {
            voteCounts[videoId] = { nom_etablissement: nomEtablissement, votes: 0 }
          }
          voteCounts[videoId].votes++
        })

        // Trouver la vidéo avec le plus de votes
        const topVideo = Object.values(voteCounts).reduce((max, current) => 
          current.votes > max.votes ? current : max, 
          { nom_etablissement: 'Aucune', votes: 0 }
        )

        setStats({
          totalParticipations: allParticipations?.length || 0,
          totalVotes: votes?.length || 0,
          topVideo: topVideo.votes > 0 ? topVideo : null,
        })
      } catch (error) {
        console.error('Erreur lors du chargement des stats:', error)
        toast.error('Erreur lors du chargement des statistiques')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Chargement des données...</p>
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Participations</dt>
                        <dd className="text-3xl font-semibold text-gray-900">{stats.totalParticipations}</dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                      <Vote className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total des votes</dt>
                        <dd className="text-3xl font-semibold text-gray-900">{stats.totalVotes}</dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                      <Trophy className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Vidéo la plus votée</dt>
                        <dd className="text-lg font-semibold text-gray-900 truncate">
                          {stats.topVideo ? `${stats.topVideo.nom_etablissement} (${stats.topVideo.votes} votes)` : 'Aucun vote'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Actions rapides</h3>
                </div>
                <div className="px-6 py-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Link href="/ghost-dashboard/participations" className="block">
                      <button className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-left">
                        <div className="flex items-center gap-2">
                          <Eye className="w-5 h-5" />
                          <div>
                            <div className="font-semibold">Voir les participations</div>
                            <div className="text-sm text-gray-300 mt-1">Gérer les candidatures</div>
                          </div>
                        </div>
                      </button>
                    </Link>
                    
                    <Link href="/ghost-dashboard/stats" className="block">
                      <button className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-left">
                        <div className="flex items-center gap-2">
                          <BarChart3 className="w-5 h-5" />
                          <div>
                            <div className="font-semibold">Statistiques</div>
                            <div className="text-sm text-gray-300 mt-1">Analyser les votes</div>
                          </div>
                        </div>
                      </button>
                    </Link>
                    
                    <Link href="/ghost-dashboard/dates" className="block">
                      <button className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-left">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          <div>
                            <div className="font-semibold">Gestion des dates</div>
                            <div className="text-sm text-gray-300 mt-1">Configurer les périodes</div>
                          </div>
                        </div>
                      </button>
                    </Link>
                    
                    <Link href="/ghost-dashboard/admin" className="block">
                      <button className="w-full px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-left">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          <div>
                            <div className="font-semibold">Administrateurs</div>
                            <div className="text-sm text-gray-300 mt-1">Gérer les utilisateurs</div>
                          </div>
                        </div>
                      </button>
                    </Link>
                    
                    <button className="px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-left">
                      <div className="flex items-center gap-2">
                        <Download className="w-5 h-5" />
                        <div>
                          <div className="font-semibold">Exporter les données</div>
                          <div className="text-sm text-gray-300 mt-1">Télécharger en CSV</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
    </div>
  )
}

