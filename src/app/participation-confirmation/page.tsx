'use client'

import { Suspense } from 'react'
import Hero from '@/components/Hero'

function ParticipationConfirmationContent() {

  return (
    <>
      <Hero />
    <div className=" flex items-center justify-center p-4 min-h-[500px] bg-[#10214B] ">
      <div className="max-w-2xl w-full">
        {/* Header avec icône de succès */}
        <div className="text-center mb-8">
          
          <h1 className="text-3xl font-bold text-white mb-2">
          Merci d’avoir participé
aux
          </h1>
         
        </div>

        <div style={{
          background: '#DBB572',
          color: '#10214B',
          textAlign: 'center',
          fontFamily: 'Poppins',
          fontSize: '18px',
          fontStyle: 'normal',
          fontWeight: 400,
          lineHeight: '130%',
          padding:'50px 20px',
          borderRadius: '20px',
          
        }}>
          <p className="text-center text-sm">
          Votre dossier a bien été transmis au comité de présélection. Il sera étudié avec attention, puis évalué par le jury lors des prochaines étapes du concours.
<br></br><br></br>
En participant, vous contribuez activement à faire progresser l’inclusion et à valoriser la diversité au sein du monde professionnel en Martinique.
          </p>
        </div> 
      </div>
    </div>
    </>
  )
}

export default function ParticipationConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    }>
      <ParticipationConfirmationContent />
    </Suspense>
  )
}
