'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'


interface BoutonParticipationProps {
  className?: string
}

export function BoutonParticipation({ className = '' }: BoutonParticipationProps) {
  const [isActive, setIsActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkParticipationPeriod() {
      try {
        const { data, error } = await supabase
          .from('date_participation')
          .select('*')
          .eq('actif', true)
          .order('date_debut', { ascending: false })
          .limit(1)

        if (error) {
          setError(error.message)
          return
        }

        if (data && data.length > 0) {
          const participationPeriod = data[0]
          const now = new Date()
          const dateDebut = new Date(participationPeriod.date_debut)
          const dateFin = new Date(participationPeriod.date_fin)

          // Vérifier si nous sommes dans la période de participation
          const isInPeriod = now >= dateDebut && now <= dateFin
          setIsActive(isInPeriod)
        } else {
          setIsActive(false)
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue')
      } finally {
        setLoading(false)
      }
    }

    checkParticipationPeriod()
  }, [])

  const handleParticipation = () => {
    // Rediriger vers le formulaire de participation
    window.location.href = '/participation'
  }

  if (loading) {
    return (
      <div className={`px-4 py-2 bg-gray-200 rounded-md animate-pulse ${className}`}>
        Chargement...
      </div>
    )
  }

  if (error) {
    return (
      <div className={`px-4 py-2 bg-red-100 text-red-700 rounded-md ${className}`}>
        Erreur: {error}
      </div>
    )
  }

  if (!isActive) {
    return null // Ne pas afficher le bouton si pas dans la période
  }

  return (
    <button
      onClick={handleParticipation}
      className={`
        px-6 py-3 
        bg-black hover:bg-gray-800 
        text-white font-semibold 
        rounded-lg shadow-md 
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
        ${className}
      `}
    >
      ✋ Je participe
    </button>
  )
}
