'use client'

import HeroHome from "@/components/HeroHome";
import CategoriesSection from "@/components/home/home/CategoriesSection";
import CandidaterSection from "@/components/home/home/CandidaterSection";
import EngagementSection from "@/components/home/home/EngagementSection";
import CalendrierSection from "@/components/home/home/CalendrierSection";
import PartenairesSection from "@/components/home/home/PartenairesSection";
import SecondSection from "@/components/home/home/SecondSection";

export default function Home() {
  return (
    <div className="">
      
      <HeroHome />
      <main className="flex flex-col  row-start-2 items-center sm:items-start">
     
        <SecondSection />

        {/* Sections de contenu */}
        <CategoriesSection />
        <CandidaterSection />
        <EngagementSection />
        <CalendrierSection />
        <PartenairesSection />
      </main>
    </div>
  );
}
