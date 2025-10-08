import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, XCircle, Loader2, FileText, Archive } from 'lucide-react'

interface ExportProgressDialogProps {
  isOpen: boolean
  onClose: () => void
  progress: {
    current: number
    total: number
    currentFileName: string
    stage: 'preparing' | 'generating' | 'zipping' | 'completed' | 'error'
    completedFiles: string[]
    failedFiles: string[]
  }
}

export const ExportProgressDialog: React.FC<ExportProgressDialogProps> = ({
  isOpen,
  onClose,
  progress
}) => {
  const getStageText = () => {
    switch (progress.stage) {
      case 'preparing':
        return 'Préparation de l\'export...'
      case 'generating':
        return `Génération des PDFs (${progress.current}/${progress.total})`
      case 'zipping':
        return 'Création du fichier ZIP...'
      case 'completed':
        return 'Export terminé avec succès !'
      case 'error':
        return 'Erreur lors de l\'export'
      default:
        return 'Export en cours...'
    }
  }

  const getStageIcon = () => {
    switch (progress.stage) {
      case 'preparing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case 'generating':
        return <FileText className="h-5 w-5 text-blue-500" />
      case 'zipping':
        return <Archive className="h-5 w-5 text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
    }
  }

  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStageIcon()}
            Export des participations en PDF
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* État actuel */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 mb-2">
              {getStageText()}
            </p>
            
            {progress.stage === 'generating' && progress.currentFileName && (
              <p className="text-xs text-gray-500 truncate">
                En cours : {progress.currentFileName}
              </p>
            )}
          </div>

          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Progression</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Détails des fichiers */}
          {(progress.completedFiles.length > 0 || progress.failedFiles.length > 0) && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Détails des fichiers :</h4>
              
              {/* Fichiers réussis */}
              {progress.completedFiles.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    <span className="font-medium">Réussis ({progress.completedFiles.length})</span>
                  </div>
                  <div className="max-h-20 overflow-y-auto space-y-1 ml-4">
                    {progress.completedFiles.map((fileName, index) => (
                      <div key={index} className="text-xs text-gray-600 truncate">
                        ✓ {fileName}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Fichiers échoués */}
              {progress.failedFiles.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-red-600">
                    <XCircle className="h-3 w-3" />
                    <span className="font-medium">Échoués ({progress.failedFiles.length})</span>
                  </div>
                  <div className="max-h-20 overflow-y-auto space-y-1 ml-4">
                    {progress.failedFiles.map((fileName, index) => (
                      <div key={index} className="text-xs text-gray-600 truncate">
                        ✗ {fileName}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bouton de fermeture */}
          {(progress.stage === 'completed' || progress.stage === 'error') && (
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
