'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Calendar, Loader2, Save, Plus, Trash2, AlertTriangle } from 'lucide-react'

type DateParticipation = {
  id: string
  date_debut: string
  date_fin: string
  actif: boolean
  created_at: string
  updated_at: string
}

type DateVote = {
  id: string
  date_debut: string
  date_fin: string
  actif: boolean
  created_at: string
  updated_at: string
}

export default function DatesPage() {
  const [datesParticipation, setDatesParticipation] = useState<DateParticipation[]>([])
  const [datesVote, setDatesVote] = useState<DateVote[]>([])
  const [loading, setLoading] = useState(true)

  // Formulaire pour nouvelle période de participation
  const [newParticipation, setNewParticipation] = useState({
    date_debut: '',
    date_fin: '',
    actif: true,
  })

  // Formulaire pour nouvelle période de vote
  const [newVote, setNewVote] = useState({
    date_debut: '',
    date_fin: '',
    actif: true,
  })

  useEffect(() => {
    fetchDates()
  }, [])

  const fetchDates = async () => {
    try {
      const [participationRes, voteRes] = await Promise.all([
        supabase
          .from('date_participation')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('date_vote')
          .select('*')
          .order('created_at', { ascending: false }),
      ])

      if (participationRes.error) throw participationRes.error
      if (voteRes.error) throw voteRes.error

      setDatesParticipation(participationRes.data || [])
      setDatesVote(voteRes.data || [])
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors du chargement des dates')
    } finally {
      setLoading(false)
    }
  }

  const createParticipation = async () => {
    if (!newParticipation.date_debut || !newParticipation.date_fin) {
      toast.error('Veuillez remplir les dates de début et de fin')
      return
    }

    try {
      // Si on crée une période active, désactiver toutes les autres
      if (newParticipation.actif) {
        const { error: updateError } = await supabase
          .from('date_participation')
          .update({ actif: false })
          .eq('actif', true)

        if (updateError) throw updateError
      }

      const { error } = await supabase
        .from('date_participation')
        .insert({
          date_debut: newParticipation.date_debut,
          date_fin: newParticipation.date_fin,
          actif: newParticipation.actif,
        })

      if (error) throw error

      toast.success('Période de participation créée avec succès', {
        description: newParticipation.actif ? 'Les autres périodes ont été désactivées' : undefined
      })
      setNewParticipation({ date_debut: '', date_fin: '', actif: true })
      fetchDates()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la création')
    }
  }

  const createVote = async () => {
    if (!newVote.date_debut || !newVote.date_fin) {
      toast.error('Veuillez remplir les dates de début et de fin')
      return
    }

    try {
      // Si on crée une période active, désactiver toutes les autres
      if (newVote.actif) {
        const { error: updateError } = await supabase
          .from('date_vote')
          .update({ actif: false })
          .eq('actif', true)

        if (updateError) throw updateError
      }

      const { error } = await supabase
        .from('date_vote')
        .insert({
          date_debut: newVote.date_debut,
          date_fin: newVote.date_fin,
          actif: newVote.actif,
        })

      if (error) throw error

      toast.success('Période de vote créée avec succès', {
        description: newVote.actif ? 'Les autres périodes ont été désactivées' : undefined
      })
      setNewVote({ date_debut: '', date_fin: '', actif: true })
      fetchDates()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la création')
    }
  }

  const toggleActif = async (table: 'date_participation' | 'date_vote', id: string, currentActif: boolean) => {
    try {
      // Si on active cette période, désactiver toutes les autres de la même table
      if (!currentActif) {
        const { error: updateError } = await supabase
          .from(table)
          .update({ actif: false })
          .eq('actif', true)
          .neq('id', id)

        if (updateError) throw updateError
      }

      const { error } = await supabase
        .from(table)
        .update({ actif: !currentActif, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      toast.success(`Période ${!currentActif ? 'activée' : 'désactivée'}`, {
        description: !currentActif ? 'Les autres périodes ont été désactivées' : undefined
      })
      fetchDates()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const updateDates = async (
    table: 'date_participation' | 'date_vote',
    id: string,
    dateDebut: string,
    dateFin: string
  ) => {
    try {
      const { error } = await supabase
        .from(table)
        .update({
          date_debut: dateDebut,
          date_fin: dateFin,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Dates mises à jour avec succès')
      fetchDates()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const deletePeriod = async (table: 'date_participation' | 'date_vote', id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette période ?')) {
      return
    }

    try {
      const { error } = await supabase.from(table).delete().eq('id', id)

      if (error) throw error

      toast.success('Période supprimée avec succès')
      fetchDates()
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  }

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestion des périodes</h2>
        <p className="text-sm text-muted-foreground">
          Gérez les périodes de participation et de vote
        </p>
      </div>

      {/* Périodes de participation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Périodes de participation
          </CardTitle>
          <CardDescription>
            Définissez quand les candidats peuvent soumettre leur candidature
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avertissement si plusieurs périodes actives */}
          {datesParticipation.filter(p => p.actif).length > 1 && (
            <div className="flex items-start gap-3 p-4 border border-yellow-500 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  ⚠️ Attention : {datesParticipation.filter(p => p.actif).length} périodes sont actives simultanément
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Il est recommandé de n&apos;avoir qu&apos;une seule période active à la fois. 
                  Désactivez les autres périodes pour éviter les conflits.
                </p>
              </div>
            </div>
          )}

          {/* Formulaire de création */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle période de participation
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Date de début</label>
                <Input
                  type="datetime-local"
                  value={newParticipation.date_debut}
                  onChange={(e) =>
                    setNewParticipation({ ...newParticipation, date_debut: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Date de fin</label>
                <Input
                  type="datetime-local"
                  value={newParticipation.date_fin}
                  onChange={(e) =>
                    setNewParticipation({ ...newParticipation, date_fin: e.target.value })
                  }
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={createParticipation}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Créer
                </button>
              </div>
            </div>
          </div>

          {/* Liste des périodes existantes */}
          <div className="space-y-3">
            {datesParticipation.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune période de participation définie
              </p>
            ) : (
              datesParticipation.map((periode) => (
                <PeriodCard
                  key={periode.id}
                  periode={periode}
                  onToggleActif={() =>
                    toggleActif('date_participation', periode.id, periode.actif)
                  }
                  onUpdate={(dateDebut, dateFin) =>
                    updateDates('date_participation', periode.id, dateDebut, dateFin)
                  }
                  onDelete={() => deletePeriod('date_participation', periode.id)}
                  formatDate={formatDate}
                  formatDateForInput={formatDateForInput}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Périodes de vote */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Périodes de vote
          </CardTitle>
          <CardDescription>
            Définissez quand les utilisateurs peuvent voter pour les candidats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avertissement si plusieurs périodes actives */}
          {datesVote.filter(p => p.actif).length > 1 && (
            <div className="flex items-start gap-3 p-4 border border-yellow-500 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">
                  ⚠️ Attention : {datesVote.filter(p => p.actif).length} périodes sont actives simultanément
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Il est recommandé de n&apos;avoir qu&apos;une seule période active à la fois. 
                  Désactivez les autres périodes pour éviter les conflits.
                </p>
              </div>
            </div>
          )}

          {/* Formulaire de création */}
          <div className="border rounded-lg p-4 bg-muted/50">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle période de vote
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Date de début</label>
                <Input
                  type="datetime-local"
                  value={newVote.date_debut}
                  onChange={(e) => setNewVote({ ...newVote, date_debut: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Date de fin</label>
                <Input
                  type="datetime-local"
                  value={newVote.date_fin}
                  onChange={(e) => setNewVote({ ...newVote, date_fin: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={createVote}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Créer
                </button>
              </div>
            </div>
          </div>

          {/* Liste des périodes existantes */}
          <div className="space-y-3">
            {datesVote.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune période de vote définie
              </p>
            ) : (
              datesVote.map((periode) => (
                <PeriodCard
                  key={periode.id}
                  periode={periode}
                  onToggleActif={() => toggleActif('date_vote', periode.id, periode.actif)}
                  onUpdate={(dateDebut, dateFin) =>
                    updateDates('date_vote', periode.id, dateDebut, dateFin)
                  }
                  onDelete={() => deletePeriod('date_vote', periode.id)}
                  formatDate={formatDate}
                  formatDateForInput={formatDateForInput}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PeriodCard({
  periode,
  onToggleActif,
  onUpdate,
  onDelete,
  formatDate,
  formatDateForInput,
}: {
  periode: DateParticipation | DateVote
  onToggleActif: () => void
  onUpdate: (dateDebut: string, dateFin: string) => void
  onDelete: () => void
  formatDate: (date: string) => string
  formatDateForInput: (date: string) => string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editDebut, setEditDebut] = useState(formatDateForInput(periode.date_debut))
  const [editFin, setEditFin] = useState(formatDateForInput(periode.date_fin))

  const handleSave = () => {
    onUpdate(new Date(editDebut).toISOString(), new Date(editFin).toISOString())
    setIsEditing(false)
  }

  const now = new Date()
  const debut = new Date(periode.date_debut)
  const fin = new Date(periode.date_fin)
  const isActive = periode.actif && now >= debut && now <= fin
  const isPast = now > fin
  const isFuture = now < debut

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div className="space-y-1 flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Date de début</label>
                <Input
                  type="datetime-local"
                  value={editDebut}
                  onChange={(e) => setEditDebut(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Date de fin</label>
                <Input
                  type="datetime-local"
                  value={editFin}
                  onChange={(e) => setEditFin(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Du {formatDate(periode.date_debut)}</span>
                <span className="text-muted-foreground">→</span>
                <span className="text-sm font-medium">Au {formatDate(periode.date_fin)}</span>
              </div>
              <div className="flex gap-2">
                {isActive && <Badge className="bg-green-500">En cours</Badge>}
                {isPast && <Badge variant="secondary">Terminée</Badge>}
                {isFuture && <Badge variant="outline">À venir</Badge>}
                {!periode.actif && <Badge variant="destructive">Désactivée</Badge>}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Actif</span>
            <Switch checked={periode.actif} onCheckedChange={onToggleActif} />
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Save className="h-3 w-3" />
              Sauvegarder
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setEditDebut(formatDateForInput(periode.date_debut))
                setEditFin(formatDateForInput(periode.date_fin))
              }}
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors"
            >
              Annuler
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 text-sm border rounded-md hover:bg-muted transition-colors"
            >
              Modifier
            </button>
            <button
              onClick={onDelete}
              className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-md hover:bg-red-50 transition-colors flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              Supprimer
            </button>
          </>
        )}
      </div>
    </div>
  )
}

