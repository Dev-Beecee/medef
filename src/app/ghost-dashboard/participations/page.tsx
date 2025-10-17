'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Eye, Loader2, Search, Filter, Download, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { exportParticipationsToPDF, exportSingleParticipationToPDF } from '@/lib/pdfExport'
import { ExportProgressDialog } from '@/components/ExportProgressDialog'

type Participation = {
  id: string
  nom_etablissement: string
  nom_candidat: string
  prenom_candidat: string
  qualite_agissant: string
  nom_structure: string
  denomination_commerciale: string | null
  email: string
  telephone: string | null
  statut: string | null
  video_s3_url: string | null
  adresse_siege_social: string | null
  date_creation: string | null
  forme_juridique: string | null
  siret: string
  naf: string
  capital_social: number | null
  effectif_2023: number | null
  activite_principale: string | null
  description_activite: string | null
  description_clientele: string | null
  description_produits_services: string | null
  modes_communication: string | null
  support_martinique: string | null
  points_forts: string | null
  points_faibles: string | null
  demarche_transition_numerique: string | null
  inclusion_handicap_approche: string | null
  inclusion_handicap_besoins: string | null
  pourcentage_travailleurs_handicap: string | null
  embauche_accompagnement_handicap: string | null
  collaboration_entreprises_adaptees: string | null
  raison_participation: string | null
  axes_progres: string | null
  categories_selectionnees: string[] | null
  autorisation_diffusion_video: boolean | null
  attestation_regularite_s3_url: string | null
  fiche_insee_kbis_s3_url: string | null
  signature_image_s3_url: string | null
  attestation_dirigeant_s3_url: string | null
  acceptation_reglement: boolean | null
  etape_actuelle: number | null
  formulaire_complete: boolean | null
  created_at: string | null
  updated_at: string | null
  user_id: string | null
}

export default function ParticipationsPage() {
  const [participations, setParticipations] = useState<Participation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedParticipation, setSelectedParticipation] = useState<Participation | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatut, setFilterStatut] = useState<string>('all')
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [showProgressDialog, setShowProgressDialog] = useState(false)
  const [exportProgress, setExportProgress] = useState<{
    current: number
    total: number
    currentFileName: string
    stage: 'preparing' | 'generating' | 'zipping' | 'completed' | 'error'
    completedFiles: string[]
    failedFiles: string[]
  }>({
    current: 0,
    total: 0,
    currentFileName: '',
    stage: 'preparing',
    completedFiles: [],
    failedFiles: []
  })

  const [categoryNames, setCategoryNames] = useState<{ [key: string]: string }>({})
  
  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    fetchParticipations()
  }, [])

  const getCategoryDisplayName = (categoryId: string) => {
    return categoryNames[categoryId] || categoryId
  }

  const fetchParticipations = async () => {
    try {
      // Charger les participations
      const { data, error } = await supabase
        .from('participations')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setParticipations(data || [])

      // Charger les noms des catégories
      const { data: categories, error: categoriesError } = await supabase
        .from('vote_categories')
        .select('id, name')
      
      if (categoriesError) {
        console.warn('Erreur lors du chargement des catégories:', categoriesError)
      } else {
        // Créer un mapping ID -> nom
        const categoryMap: { [key: string]: string } = {}
        categories?.forEach(category => {
          categoryMap[category.id.toString()] = category.name
        })
        setCategoryNames(categoryMap)
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des participations')
    } finally {
      setLoading(false)
    }
  }

  const updateStatut = async (id: string, newStatut: string) => {
    try {
      const { error } = await supabase
        .from('participations')
        .update({ statut: newStatut })
        .eq('id', id)

      if (error) throw error

      toast.success('Statut mis à jour avec succès')
      fetchParticipations()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour du statut')
    }
  }

  const exportToCSV = () => {
    // Définir les colonnes à exporter
    const columns = [
      'ID',
      'Nom établissement',
      'Nom candidat',
      'Prénom candidat',
      'Qualité agissant',
      'Nom structure',
      'Dénomination commerciale',
      'Email',
      'Téléphone',
      'Adresse siège social',
      'Date création',
      'Forme juridique',
      'SIRET',
      'NAF',
      'Capital social',
      'Effectif 2023',
      'Activité principale',
      'Description activité',
      'Description clientèle',
      'Description produits services',
      'Modes communication',
      'Support Martinique',
      'Points forts',
      'Points faibles',
      'Démarche transition numérique',
      'Inclusion handicap approche',
      'Inclusion handicap besoins',
      'Pourcentage travailleurs handicap',
      'Embauche accompagnement handicap',
      'Collaboration entreprises adaptées',
      'Raison participation',
      'Axes progrès',
      'Catégories sélectionnées',
      'Autorisation diffusion vidéo',
      'Acceptation règlement',
      'Étape actuelle',
      'Formulaire complet',
      'Statut',
      'Date création',
      'Date mise à jour'
    ]

    // Préparer les données
    const csvData = participations.map(participation => [
      participation.id,
      participation.nom_etablissement || '',
      participation.nom_candidat || '',
      participation.prenom_candidat || '',
      participation.qualite_agissant || '',
      participation.nom_structure || '',
      participation.denomination_commerciale || '',
      participation.email || '',
      participation.telephone || '',
      participation.adresse_siege_social || '',
      participation.date_creation || '',
      participation.forme_juridique || '',
      participation.siret || '',
      participation.naf || '',
      participation.capital_social || '',
      participation.effectif_2023 || '',
      participation.activite_principale || '',
      participation.description_activite || '',
      participation.description_clientele || '',
      participation.description_produits_services || '',
      participation.modes_communication || '',
      participation.support_martinique || '',
      participation.points_forts || '',
      participation.points_faibles || '',
      participation.demarche_transition_numerique || '',
      participation.inclusion_handicap_approche || '',
      participation.inclusion_handicap_besoins || '',
      participation.pourcentage_travailleurs_handicap || '',
      participation.embauche_accompagnement_handicap || '',
      participation.collaboration_entreprises_adaptees || '',
      participation.raison_participation || '',
      participation.axes_progres || '',
      participation.categories_selectionnees?.map(cat => getCategoryDisplayName(cat)).join('; ') || '',
      participation.autorisation_diffusion_video ? 'Oui' : 'Non',
      participation.acceptation_reglement ? 'Oui' : 'Non',
      participation.etape_actuelle || '',
      participation.formulaire_complete ? 'Oui' : 'Non',
      participation.statut || '',
      participation.created_at || '',
      participation.updated_at || ''
    ])

    // Créer le contenu CSV
    const csvContent = [
      columns.join(','),
      ...csvData.map(row => 
        row.map(field => 
          typeof field === 'string' && field.includes(',') 
            ? `"${field.replace(/"/g, '""')}"` 
            : field
        ).join(',')
      )
    ].join('\n')

    // Créer et télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `participations_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Export CSV généré avec succès')
  }

  const exportToPDF = async () => {
    setIsExportingPDF(true)
    setShowProgressDialog(true)
    setExportProgress({
      current: 0,
      total: 0,
      currentFileName: '',
      stage: 'preparing',
      completedFiles: [],
      failedFiles: []
    })
    
    try {
      const result = await exportParticipationsToPDF(participations, (progress) => {
        setExportProgress(progress)
      })
      
      if (result.success) {
        toast.success(
          `Export PDF réussi ! ${result.successfulGenerations} PDF(s) généré(s) sur ${result.totalParticipations} participation(s) validée(s)`
        )
        if (result.failedGenerations > 0) {
          toast.warning(`${result.failedGenerations} PDF(s) n'ont pas pu être générés`)
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error)
      toast.error('Erreur lors de l\'export PDF')
    } finally {
      setIsExportingPDF(false)
    }
  }

  const exportSingleToPDF = async (participation: Participation) => {
    try {
      await exportSingleParticipationToPDF(participation)
      toast.success('PDF généré avec succès')
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error)
      toast.error('Erreur lors de l\'export PDF')
    }
  }

  // Filtrer les participations
  const filteredParticipations = participations.filter((participation) => {
    // Filtre par statut
    const matchesStatut = filterStatut === 'all' || participation.statut === filterStatut

    // Filtre par recherche (nom, prénom, email, téléphone, structure, établissement)
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      participation.nom_candidat?.toLowerCase().includes(searchLower) ||
      participation.prenom_candidat?.toLowerCase().includes(searchLower) ||
      participation.email?.toLowerCase().includes(searchLower) ||
      participation.telephone?.toLowerCase().includes(searchLower) ||
      participation.nom_structure?.toLowerCase().includes(searchLower) ||
      participation.nom_etablissement?.toLowerCase().includes(searchLower)

    return matchesStatut && matchesSearch
  })

  // Calculs de pagination
  const totalPages = Math.ceil(filteredParticipations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedParticipations = filteredParticipations.slice(startIndex, endIndex)

  // Réinitialiser la page courante quand les filtres changent
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterStatut])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Participations</h2>
          <p className="text-sm text-muted-foreground">
            Gérez toutes les participations au concours
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-lg px-4 py-2">
            {filteredParticipations.length} / {participations.length} participation{participations.length > 1 ? 's' : ''}
          </Badge>
          
          {/* Sélecteur d'éléments par page */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Afficher :</span>
            <Select value={itemsPerPage.toString()} onValueChange={(value) => {
              setItemsPerPage(Number(value))
              setCurrentPage(1)
            }}>
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Champ de recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher par nom, prénom, email, téléphone, structure..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtre par statut */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterStatut} onValueChange={setFilterStatut}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="en attente">En attente</SelectItem>
              <SelectItem value="validé">Validé</SelectItem>
              <SelectItem value="refusé">Refusé</SelectItem>
              <SelectItem value="draft">Brouillon</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Boutons d'export */}
        <div className="flex gap-2">
          <Button 
            onClick={exportToCSV}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exporter CSV
          </Button>
          
          <Button 
            onClick={exportToPDF}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isExportingPDF}
          >
            {isExportingPDF ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            {isExportingPDF ? 'Génération...' : 'Exporter PDF'}
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Établissement</TableHead>
              <TableHead>Candidat</TableHead>
              <TableHead>Qualité</TableHead>
              <TableHead>Structure</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Date d'enregistrement</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParticipations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                  {searchTerm || filterStatut !== 'all' 
                    ? 'Aucune participation ne correspond aux filtres'
                    : 'Aucune participation trouvée'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedParticipations.map((participation) => (
                <TableRow key={participation.id}>
                  <TableCell className="font-medium">
                    {participation.nom_etablissement}
                  </TableCell>
                  <TableCell>
                    {participation.prenom_candidat} {participation.nom_candidat}
                  </TableCell>
                  <TableCell>{participation.qualite_agissant}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{participation.nom_structure}</div>
                      {participation.denomination_commerciale && (
                        <div className="text-xs text-muted-foreground">
                          {participation.denomination_commerciale}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{participation.email}</TableCell>
                  <TableCell>{participation.telephone || '-'}</TableCell>
                  <TableCell>{formatDate(participation.created_at)}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue={participation.statut || 'en attente'}
                      onValueChange={(value) => updateStatut(participation.id, value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en attente">En attente</SelectItem>
                        <SelectItem value="validé">Validé</SelectItem>
                        <SelectItem value="refusé">Refusé</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        onClick={() => exportSingleToPDF(participation)}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        PDF
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            onClick={() => setSelectedParticipation(participation)}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir plus
                          </button>
                        </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Détails de la participation</DialogTitle>
                          <DialogDescription>
                            {participation.nom_etablissement} - {participation.email}
                          </DialogDescription>
                        </DialogHeader>
                        
                        {selectedParticipation && (
                          <div className="space-y-6 mt-4">
                            {/* Vidéo en premier */}
                            {selectedParticipation.video_s3_url && (
                              <div className="space-y-2">
                                <h3 className="text-lg font-semibold">Vidéo de présentation</h3>
                                <video
                                  src={selectedParticipation.video_s3_url}
                                  controls
                                  className="w-full rounded-lg shadow-sm"
                                  preload="metadata"
                                >
                                  Votre navigateur ne supporte pas la lecture de vidéos.
                                </video>
                              </div>
                            )}

                            {/* Informations générales */}
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold border-b pb-2">Informations générales</h3>
                              <div className="grid grid-cols-2 gap-4">
                                <InfoItem label="Établissement" value={selectedParticipation.nom_etablissement} />
                                <InfoItem label="Candidat" value={`${selectedParticipation.prenom_candidat} ${selectedParticipation.nom_candidat}`} />
                                <InfoItem label="Qualité" value={selectedParticipation.qualite_agissant} />
                                <InfoItem label="Structure" value={selectedParticipation.nom_structure} />
                                <InfoItem label="Dénomination commerciale" value={selectedParticipation.denomination_commerciale} />
                                <InfoItem label="Email" value={selectedParticipation.email} />
                                <InfoItem label="Téléphone" value={selectedParticipation.telephone} />
                                <InfoItem label="Date de création" value={selectedParticipation.date_creation} />
                              </div>
                            </div>

                            {/* Informations légales */}
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold border-b pb-2">Informations légales</h3>
                              <div className="grid grid-cols-2 gap-4">
                                <InfoItem label="SIRET" value={selectedParticipation.siret} />
                                <InfoItem label="NAF" value={selectedParticipation.naf} />
                                <InfoItem label="Forme juridique" value={selectedParticipation.forme_juridique} />
                                <InfoItem label="Capital social" value={selectedParticipation.capital_social?.toString()} />
                                <InfoItem label="Effectif 2023" value={selectedParticipation.effectif_2023?.toString()} />
                                <InfoItem label="Adresse" value={selectedParticipation.adresse_siege_social} />
                              </div>
                            </div>

                            {/* Activité */}
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold border-b pb-2">Activité</h3>
                              <InfoItem label="Activité principale" value={selectedParticipation.activite_principale} />
                              <InfoItem label="Description de l'activité" value={selectedParticipation.description_activite} />
                              <InfoItem label="Clientèle" value={selectedParticipation.description_clientele} />
                              <InfoItem label="Produits et services" value={selectedParticipation.description_produits_services} />
                            </div>

                            {/* Inclusion handicap */}
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold border-b pb-2">Inclusion handicap</h3>
                              <InfoItem label="Approche" value={selectedParticipation.inclusion_handicap_approche} />
                              <InfoItem label="Besoins" value={selectedParticipation.inclusion_handicap_besoins} />
                              <InfoItem label="Pourcentage travailleurs" value={selectedParticipation.pourcentage_travailleurs_handicap} />
                              <InfoItem label="Accompagnement embauche" value={selectedParticipation.embauche_accompagnement_handicap} />
                              <InfoItem label="Collaboration entreprises adaptées" value={selectedParticipation.collaboration_entreprises_adaptees} />
                            </div>

                            {/* Catégories */}
                            {selectedParticipation.categories_selectionnees && (
                              <div className="space-y-2">
                                <h3 className="text-lg font-semibold border-b pb-2">Catégories sélectionnées</h3>
                                <div className="flex flex-wrap gap-2">
                                  {selectedParticipation.categories_selectionnees.map((cat, idx) => (
                                    <Badge key={idx} variant="secondary">{getCategoryDisplayName(cat)}</Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Documents */}
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold border-b pb-2">Documents</h3>
                              <div className="grid grid-cols-2 gap-4">
                                <DocumentLink label="Attestation régularité" url={selectedParticipation.attestation_regularite_s3_url} />
                                <DocumentLink label="KBIS" url={selectedParticipation.fiche_insee_kbis_s3_url} />
                                <DocumentLink label="Signature" url={selectedParticipation.signature_image_s3_url} />
                              </div>
                            </div>

                            {/* Statut formulaire */}
                            <div className="space-y-2">
                              <h3 className="text-lg font-semibold border-b pb-2">État du formulaire</h3>
                              <div className="grid grid-cols-2 gap-4">
                                <InfoItem label="Étape actuelle" value={selectedParticipation.etape_actuelle?.toString()} />
                                <InfoItem label="Formulaire complet" value={selectedParticipation.formulaire_complete ? 'Oui' : 'Non'} />
                                <InfoItem label="Acceptation règlement" value={selectedParticipation.acceptation_reglement ? 'Oui' : 'Non'} />
                                <InfoItem label="Autorisation diffusion vidéo" value={selectedParticipation.autorisation_diffusion_video ? 'Oui' : 'Non'} />
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Contrôles de pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Affichage de {startIndex + 1} à {Math.min(endIndex, filteredParticipations.length)} sur {filteredParticipations.length} participation{filteredParticipations.length > 1 ? 's' : ''}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber
                if (totalPages <= 5) {
                  pageNumber = i + 1
                } else if (currentPage <= 3) {
                  pageNumber = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i
                } else {
                  pageNumber = currentPage - 2 + i
                }
                
                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNumber}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialog de progression */}
      <ExportProgressDialog
        isOpen={showProgressDialog}
        onClose={() => setShowProgressDialog(false)}
        progress={exportProgress}
      />
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm mt-1">{value || '-'}</dd>
    </div>
  )
}

function DocumentLink({ label, url }: { label: string; url: string | null | undefined }) {
  return (
    <div>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm mt-1">
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Voir le document
          </a>
        ) : (
          '-'
        )}
      </dd>
    </div>
  )
}

