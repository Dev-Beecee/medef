import React from 'react';
import Image from 'next/image';
import { BoutonVote } from "@/components/BoutonVote";
import { BoutonParticipation } from "@/components/BoutonParticipation";

interface HeroHomeProps {
  children?: React.ReactNode;
}

const HeroHome: React.FC<HeroHomeProps> = ({ children }) => {
  return (
        <section 
        className="relative flex items-center justify-center h-[570px]"
        style={{
        backgroundImage: 'url(/seeph-bg-top.png)',
        backgroundSize: 'cover',
        backgroundPosition: '50% 30%',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="flex flex-col items-center gap-8">
        {/* Logo centré */}
        <div className="mx-auto">
          <Image
            src="/seeph-logo-nav.svg"
            alt="SEEPH Logo"
            width={560}
            height={250}
            className="mx-auto w-[350px] md:w-[560px]"
          />
        </div>

        {/* Boutons */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <BoutonVote />
          <BoutonParticipation />
        </div>
      </div>
      
      {/* Contenu additionnel */}
      {children}
    </section>
  );
};

export default HeroHome;
