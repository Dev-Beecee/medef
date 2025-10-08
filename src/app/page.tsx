'use client'

import Image from "next/image";
import Link from "next/link";
import { BoutonVote } from "@/components/BoutonVote";
import { BoutonParticipation } from "@/components/BoutonParticipation";

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
          <li className="mb-2 tracking-[-.01em]">
            Get started by editing{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
              src/app/page.tsx
            </code>
            .
          </li>
          <li className="tracking-[-.01em]">
            Save and see your changes instantly.
          </li>
        </ol>

        {/* Boutons dynamiques basés sur les dates */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <BoutonVote />
          <BoutonParticipation />
        </div>

        <div className="p-4 border-2 border-green-500/20 bg-green-500/10 rounded-lg">
          <p className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2">
            ✅ Supabase configuré avec tables date_vote et date_participation
          </p>
          <Link 
            href="/test-supabase"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            → Tester la connexion Supabase
          </Link>
        </div>

        <div className="p-4 border-2 border-blue-500/20 bg-blue-500/10 rounded-lg">
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
            🗳️ Système de Vote disponible
          </p>
          <Link 
            href="/vote"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            → Accéder au système de vote
          </Link>
        </div>

        <div className="p-4 border-2 border-red-500/20 bg-red-500/10 rounded-lg">
          <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
            🛡️ Administration
          </p>
          <Link 
            href="/ghost-dashboard/admin"
            className="text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            → Gérer les administrateurs
          </Link>
        </div>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </div>
  );
}
