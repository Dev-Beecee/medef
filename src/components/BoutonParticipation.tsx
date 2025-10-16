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
        text-white font-semibold 
        flex items-center gap-3
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
        ${className}
      `}
      style={{
        borderRadius: "10px",
        border: "1px solid rgba(255, 255, 255, 0.19)",
        background: "rgba(255, 255, 255, 0.16)",
        backdropFilter: "blur(40px)",
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <mask id="mask0_100_14761" style={{maskType:"alpha"}} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
          <rect width="24" height="24" fill="#D9D9D9"/>
        </mask>
        <g mask="url(#mask0_100_14761)">
          <path d="M12 21C10.75 21 9.57917 20.7625 8.4875 20.2875C7.39583 19.8125 6.44583 19.1708 5.6375 18.3625C4.82917 17.5542 4.1875 16.6042 3.7125 15.5125C3.2375 14.4208 3 13.25 3 12C3 10.75 3.2375 9.57917 3.7125 8.4875C4.1875 7.39583 4.82917 6.44583 5.6375 5.6375C6.44583 4.82917 7.39583 4.1875 8.4875 3.7125C9.57917 3.2375 10.75 3 12 3V5C10.05 5 8.39583 5.67917 7.0375 7.0375C5.67917 8.39583 5 10.05 5 12C5 13.95 5.67917 15.6042 7.0375 16.9625C8.39583 18.3208 10.05 19 12 19V21ZM16 17L14.6 15.575L17.175 13H9V11H17.175L14.6 8.4L16 7L21 12L16 17Z" fill="white"/>
        </g>
      </svg>
      Je participe
    </button>
  )
}
