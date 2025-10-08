'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'


interface BoutonVoteProps {
  className?: string
}

export function BoutonVote({ className = '' }: BoutonVoteProps) {
  const [isActive, setIsActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkVotePeriod() {
      try {
        const { data, error } = await supabase
          .from('date_vote')
          .select('*')
          .eq('actif', true)
          .order('date_debut', { ascending: false })
          .limit(1)

        if (error) {
          setError(error.message)
          return
        }

        if (data && data.length > 0) {
          const votePeriod = data[0]
          const now = new Date()
          const dateDebut = new Date(votePeriod.date_debut)
          const dateFin = new Date(votePeriod.date_fin)

          // Vérifier si nous sommes dans la période de vote
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

    checkVotePeriod()
  }, [])

  // Plus besoin de handleVote, on utilise Link directement

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
    <Link href="/vote">
      <button
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
        🗳️ Je vote
      </button>
    </Link>
  )
}

