'use client'

import Image from "next/image";
import Link from "next/link";
import { BoutonVote } from "@/components/BoutonVote";
import { BoutonParticipation } from "@/components/BoutonParticipation";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
       

        {/* Boutons dynamiques basés sur les dates */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <BoutonVote />
          <BoutonParticipation />
        </div>


       
      </main>
      
    </div>
  );
}
