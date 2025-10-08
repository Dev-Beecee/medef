'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  Trash2, 
  AlertTriangle, 
  Database, 
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

type TableName = 'admin_users' | 'vote_categories' | 'participations' | 'date_participation' | 'date_vote' | 'votes';

interface TableInfo {
  name: TableName;
  displayName: string;
  description: string;
  icon: React.ReactNode;
}

const TABLES_TO_CLEAR: TableInfo[] = [
  {
    name: 'participations' as const,
    displayName: 'Participations',
    description: 'Toutes les candidatures soumises',
    icon: <Database className="w-4 h-4" />
  },
  {
    name: 'vote_categories' as const,
    displayName: 'Catégories de vote',
    description: 'Catégories disponibles pour le vote',
    icon: <Database className="w-4 h-4" />
  },
  {
    name: 'votes' as const,
    displayName: 'Votes',
    description: 'Tous les votes enregistrés',
    icon: <Database className="w-4 h-4" />
  }
];

const ClearDatabaseComponent: React.FC = () => {
  const [confirmationText, setConfirmationText] = useState('');
  const [isClearing, setIsClearing] = useState(false);
  const [clearedTables, setClearedTables] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleClearDatabase = async () => {
    if (confirmationText !== 'supprimé') {
      toast.error('Veuillez écrire exactement "supprimé" pour confirmer');
      return;
    }

    setIsClearing(true);
    setClearedTables([]);
    setErrors([]);

    try {
      const results = await Promise.allSettled(
        TABLES_TO_CLEAR.map(async (table) => {
          console.log(`🗑️ Suppression des données de la table ${table.name}...`);
          
          const { error } = await supabase
            .from(table.name)
            .delete()
            .neq('id', 0); // Supprimer tous les enregistrements

          if (error) {
            console.error(`❌ Erreur lors de la suppression de ${table.name}:`, error);
            throw new Error(`Erreur ${table.name}: ${error.message}`);
          }

          console.log(`✅ Table ${table.name} vidée avec succès`);
          return table.name;
        })
      );

      // Traiter les résultats
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          setClearedTables(prev => [...prev, result.value]);
        } else {
          setErrors(prev => [...prev, result.reason?.message || `Erreur inconnue pour ${TABLES_TO_CLEAR[index].name}`]);
        }
      });

      // Messages de feedback
      if (clearedTables.length > 0) {
        toast.success(`${clearedTables.length} table(s) vidée(s) avec succès`);
      }
      
      if (errors.length > 0) {
        toast.error(`${errors.length} erreur(s) lors de la suppression`);
        console.error('Erreurs détaillées:', errors);
      }

    } catch (error) {
      console.error('Erreur générale lors du vidage:', error);
      toast.error('Erreur lors du vidage de la base de données');
    } finally {
      setIsClearing(false);
    }
  };

  const isConfirmed = confirmationText === 'supprimé';
  const hasErrors = errors.length > 0;
  const hasSuccess = clearedTables.length > 0;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="bg-red-50 border-b border-red-200">
        <CardTitle className="text-xl text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6" />
          Vider la Base de Données
        </CardTitle>
        <p className="text-red-600 text-sm">
          ⚠️ Cette action est irréversible et supprimera définitivement toutes les données des tables sélectionnées.
        </p>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Liste des tables à vider */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Tables qui seront vidées :</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TABLES_TO_CLEAR.map((table) => {
              const isCleared = clearedTables.includes(table.name);
              const hasError = errors.some(error => error.includes(table.name));
              
              return (
                <div 
                  key={table.name}
                  className={`p-3 rounded-lg border flex items-center gap-3 ${
                    isCleared 
                      ? 'bg-green-50 border-green-200' 
                      : hasError 
                        ? 'bg-red-50 border-red-200' 
                        : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {isCleared ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : hasError ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      table.icon
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900">{table.displayName}</h4>
                    <p className="text-sm text-gray-600">{table.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Confirmation */}
        <div className="space-y-3">
          <Label htmlFor="confirmation" className="text-gray-700">
            Pour confirmer cette action destructrice, écrivez exactement :
            <span className="font-bold text-red-600"> supprimé</span>
          </Label>
          <Input
            id="confirmation"
            type="text"
            placeholder="Tapez 'supprimé' pour confirmer"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            disabled={isClearing}
            className={`w-full ${
              confirmationText && !isConfirmed 
                ? 'border-red-300 focus:border-red-500' 
                : isConfirmed 
                  ? 'border-green-300 focus:border-green-500' 
                  : ''
            }`}
          />
          {confirmationText && !isConfirmed && (
            <p className="text-sm text-red-600">
              ❌ Le texte doit être exactement &quot;supprimé&quot;
            </p>
          )}
          {isConfirmed && (
            <p className="text-sm text-green-600">
              ✅ Confirmation valide
            </p>
          )}
        </div>

        {/* Résultats */}
        {(hasSuccess || hasErrors) && (
          <div className="space-y-3">
            {hasSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">✅ Tables vidées avec succès :</h4>
                <ul className="text-sm text-green-700">
                  {clearedTables.map(tableName => {
                    const table = TABLES_TO_CLEAR.find(t => t.name === tableName);
                    return (
                      <li key={tableName} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        {table?.displayName || tableName}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            
            {hasErrors && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">❌ Erreurs :</h4>
                <ul className="text-sm text-red-700">
                  {errors.map((error, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Bouton d'action */}
        <Button 
          onClick={handleClearDatabase}
          disabled={!isConfirmed || isClearing}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400"
        >
          {isClearing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Suppression en cours...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Vider la Base de Données
            </>
          )}
        </Button>

        {/* Avertissement final */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-semibold mb-1">⚠️ Attention :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Cette action est <strong>irréversible</strong></li>
                <li>Toutes les données des tables sélectionnées seront <strong>définitivement supprimées</strong></li>
                <li>Assurez-vous d&apos;avoir fait une sauvegarde si nécessaire</li>
                <li>Cette fonctionnalité est destinée aux tests et à la maintenance</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClearDatabaseComponent;
