'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClearDatabaseComponent from '@/components/ClearDatabaseComponent';

export default function ClearDatabasePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link href="/ghost-dashboard/admin">
                <Button variant="outline" size="sm">
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Retour aux administrateurs
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Database className="w-8 h-8 text-red-600" />
                Maintenance Base de Données
              </h1>
            </div>
          </div>
          <p className="text-gray-600">
            Outils de maintenance et de gestion de la base de données
          </p>
        </div>

        {/* Composant principal */}
        <ClearDatabaseComponent />

        {/* Informations supplémentaires */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 mb-3">📊 Tables concernées</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><strong>participations</strong> - Candidatures soumises</li>
              <li><strong>vote_categories</strong> - Catégories de vote</li>
              <li><strong>votes</strong> - Votes enregistrés</li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-gray-900 mb-3">🔒 Sécurité</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✅ Confirmation obligatoire</li>
              <li>✅ Validation du texte &quot;supprimé&quot;</li>
              <li>✅ Feedback en temps réel</li>
              <li>✅ Gestion des erreurs</li>
            </ul>
          </div>
        </div>

        {/* Avertissement général */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Database className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-red-800 mb-2">
                ⚠️ Fonctionnalité de Maintenance
              </h3>
              <p className="text-red-700 text-sm mb-3">
                Cette page contient des outils de maintenance avancés pour la base de données. 
                Utilisez ces fonctionnalités avec précaution car elles peuvent affecter 
                définitivement les données de l&apos;application.
              </p>
              <div className="text-sm text-red-600">
                <p><strong>Recommandations :</strong></p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Effectuez une sauvegarde avant toute opération</li>
                  <li>Testez d&apos;abord sur un environnement de développement</li>
                  <li>Informez l&apos;équipe avant toute maintenance en production</li>
                  <li>Documentez les opérations effectuées</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
