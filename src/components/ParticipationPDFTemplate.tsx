import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

// Styles pour le PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 20,
    fontSize: 10,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  headerImage: {
    width: '50%',
    height: 'auto',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1f2937',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
    backgroundColor: '#f3f4f6',
    padding: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: '40%',
    fontWeight: 'bold',
    color: '#000000',
  },
  value: {
    width: '60%',
    color: '#1f2937',
  },
  valueFullWidth: {
    width: '100%',
    color: '#1f2937',
  },
  fullWidth: {
    width: '100%',
    marginBottom: 5,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  category: {
    backgroundColor: '#e5e7eb',
    padding: 3,
    marginRight: 5,
    marginBottom: 5,
    borderRadius: 3,
    fontSize: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    textAlign: 'center',
    fontSize: 8,
    color: '#6b7280',
  },
  // Styles pour la page de pacte d'engagement
  engagementHeader: {
    textAlign: 'center',
    marginBottom: 20,
  },
  engagementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
  },
  lead: {
    fontSize: 11,
    marginBottom: 15,
    color: '#374151',
  },
  engagementSection: {
    marginBottom: 20,
  },
  engagementSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1f2937',
  },
  engagementList: {
    marginLeft: 20,
    marginBottom: 15,
  },
  listItem: {
    marginBottom: 8,
    fontSize: 10,
    color: '#2563eb',
  },
  signatureBlock: {
    marginTop: 30,
  },
  signatureLabel: {
    fontWeight: 'bold',
    marginBottom: 10,
    fontSize: 11,
    color: '#1f2937',
  },
  signatureBox: {
    border: '2px dashed #888',
    borderRadius: 10,
    height: 140,
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  sigLeft: {
    width: '48%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  sigRight: {
    width: '48%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  signatureHint: {
    fontSize: 9,
    color: '#555',
    marginBottom: 8,
  },
  signatureLine: {
    borderTop: '1px solid #444',
    height: 0,
    marginTop: 48,
  },
  signatureImage: {
    maxHeight: 60,
    maxWidth: '100%',
    objectFit: 'contain',
  },
  closing: {
    marginTop: 30,
    fontWeight: 'bold',
    fontSize: 11,
    textAlign: 'center',
    color: '#1f2937',
  },
})

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
  acceptation_reglement: boolean | null
  etape_actuelle: number | null
  formulaire_complete: boolean | null
  created_at: string | null
  updated_at: string | null
}

interface ParticipationPDFTemplateProps {
  participation: Participation
  headerImageBase64?: string | null
  categoryNames?: { [key: string]: string }
  signatureImageBase64?: string | null
}

export const ParticipationPDFTemplate: React.FC<ParticipationPDFTemplateProps> = ({ participation, headerImageBase64, categoryNames, signatureImageBase64 }) => {

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('fr-FR')
  }

  const formatBoolean = (value: boolean | null) => {
    if (value === null) return '-'
    return value ? 'Oui' : 'Non'
  }

  const formatArray = (array: string[] | null) => {
    if (!array || array.length === 0) return '-'
    return array.join(', ')
  }

  const getCategoryDisplayName = (category: string) => {
    // Si categoryNames est fourni et contient cette catégorie, utiliser le nom mappé
    if (categoryNames && categoryNames[category]) {
      return categoryNames[category]
    }
    // Sinon, afficher directement la catégorie (peut être un nom ou un ID)
    return category
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header avec image */}
        <View style={styles.header}>
          {headerImageBase64 && (
            <Image 
              style={styles.headerImage} 
              src={headerImageBase64}
            />
          )}
          <Text style={styles.title}>
            PARTICIPATION AU CONCOURS
          </Text>
        </View>

        {/* Informations générales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMATIONS GÉNÉRALES</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>Établissement:</Text>
            <Text style={styles.value}>{participation.nom_etablissement || '-'}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Candidat:</Text>
            <Text style={styles.value}>
              {participation.prenom_candidat} {participation.nom_candidat}
            </Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Qualité:</Text>
            <Text style={styles.value}>{participation.qualite_agissant || '-'}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Structure:</Text>
            <Text style={styles.value}>{participation.nom_structure || '-'}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Dénomination commerciale:</Text>
            <Text style={styles.value}>{participation.denomination_commerciale || '-'}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{participation.email || '-'}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Téléphone:</Text>
            <Text style={styles.value}>{participation.telephone || '-'}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Date de création:</Text>
            <Text style={styles.value}>{formatDate(participation.date_creation)}</Text>
          </View>
        </View>

        {/* Informations légales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMATIONS LÉGALES</Text>
          
          <View style={styles.row}>
            <Text style={styles.label}>SIRET:</Text>
            <Text style={styles.value}>{participation.siret || '-'}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>NAF:</Text>
            <Text style={styles.value}>{participation.naf || '-'}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Forme juridique:</Text>
            <Text style={styles.value}>{participation.forme_juridique || '-'}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Capital social:</Text>
            <Text style={styles.value}>{participation.capital_social?.toString() || '-'}</Text>
          </View>
          
          <View style={styles.row}>
            <Text style={styles.label}>Effectif 2023:</Text>
            <Text style={styles.value}>{participation.effectif_2023?.toString() || '-'}</Text>
          </View>
          
          <View style={styles.fullWidth}>
            <Text style={styles.label}>Adresse siège social:</Text>
            <Text style={styles.value}>{participation.adresse_siege_social || '-'}</Text>
          </View>
        </View>

        {/* Activité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACTIVITÉ</Text>
          
          <View style={styles.fullWidth}>
            <Text style={styles.label}>Activité principale:</Text>
            <Text style={styles.valueFullWidth}>{participation.activite_principale || '-'}</Text>
          </View>
          
          <View style={styles.fullWidth}>
            <Text style={styles.label}>Description de l'activité:</Text>
            <Text style={styles.valueFullWidth}>{participation.description_activite || '-'}</Text>
          </View>
          
          <View style={styles.fullWidth}>
            <Text style={styles.label}>Clientèle:</Text>
            <Text style={styles.valueFullWidth}>{participation.description_clientele || '-'}</Text>
          </View>
          
          <View style={styles.fullWidth}>
            <Text style={styles.label}>Produits et services:</Text>
            <Text style={styles.valueFullWidth}>{participation.description_produits_services || '-'}</Text>
          </View>
        </View>

        {/* Inclusion handicap */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INCLUSION HANDICAP</Text>
          
          <View style={styles.fullWidth}>
            <Text style={styles.label}>Approche:</Text>
            <Text style={styles.valueFullWidth}>{participation.inclusion_handicap_approche || '-'}</Text>
          </View>
          
          <View style={styles.fullWidth}>
            <Text style={styles.label}>Besoins:</Text>
            <Text style={styles.valueFullWidth}>{participation.inclusion_handicap_besoins || '-'}</Text>
          </View>
          
          <View style={styles.fullWidth}>
            <Text style={styles.label}>Pourcentage travailleurs:</Text>
            <Text style={styles.valueFullWidth}>{participation.pourcentage_travailleurs_handicap || '-'}</Text>
          </View>
          
          <View style={styles.fullWidth}>
            <Text style={styles.label}>Accompagnement embauche:</Text>
            <Text style={styles.valueFullWidth}>{participation.embauche_accompagnement_handicap || '-'}</Text>
          </View>
          
          <View style={styles.fullWidth}>
            <Text style={styles.label}>Collaboration entreprises adaptées:</Text>
            <Text style={styles.valueFullWidth}>{participation.collaboration_entreprises_adaptees || '-'}</Text>
          </View>
        </View>

        {/* Catégories */}
        {participation.categories_selectionnees && participation.categories_selectionnees.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CATÉGORIES SÉLECTIONNÉES</Text>
            <View style={styles.categories}>
              {participation.categories_selectionnees.map((category, index) => (
                <Text key={index} style={styles.category}>
                  {getCategoryDisplayName(category)}
                </Text>
              ))}
            </View>
          </View>
        )}


        {/* Footer */}
        <Text style={styles.footer}>
          Document généré le {formatDate(new Date().toISOString())} - Participation ID: {participation.id}
        </Text>
      </Page>

      {/* Page 2: Pacte d'engagement */}
      <Page size="A4" style={styles.page}>
        {/* Header avec image */}
        <View style={styles.header}>
          {headerImageBase64 && (
            <Image 
              style={styles.headerImage} 
              src={headerImageBase64}
            />
          )}
        </View>

        {/* Header du pacte */}
        <View style={styles.engagementHeader}>
          <Text style={styles.engagementTitle}>PACTE d'engagement</Text>
          <Text style={styles.lead}>Les Trophées des administrations & entreprises inclusives de Martinique</Text>
        </View>

        {/* Section engagements */}
        <View style={styles.engagementSection}>
          <Text style={styles.engagementSectionTitle}>L'entreprise s'engage à :</Text>
          <View style={styles.engagementList}>
            <Text style={styles.listItem}>• Organiser au moins une réunion par an de sensibilisation sur le handicap.</Text>
            <Text style={styles.listItem}>• Désigner et former un référent handicap pour l'entreprise.</Text>
            <Text style={styles.listItem}>• Participer au Duo Day. Publier ses offres d'emploi également sur le site de l'Agefiph.</Text>
            <Text style={styles.listItem}>• Communiquer sur le handicap auprès des collaborateurs.</Text>
            <Text style={styles.listItem}>• Intégrer le handicap dans sa politique de ressources humaines.</Text>
            <Text style={styles.listItem}>• Proposer des immersions professionnelles. Devenir activateur de progrès.</Text>
          </View>
        </View>

        {/* Zone de signature */}
        <View style={styles.signatureBlock}>
          <Text style={styles.signatureLabel}>Signature :</Text>
          <View style={styles.signatureBox}>
            {signatureImageBase64 ? (
              <Image 
                style={styles.signatureImage} 
                src={signatureImageBase64}
              />
            ) : (
              <View style={styles.signatureLine}></View>
            )}
          </View>
        </View>

        {/* Message de clôture */}
        <Text style={styles.closing}>
          Ensemble, contribuons à un monde professionnel plus inclusif et équitable pour tous.
        </Text>
      </Page>
    </Document>
  )
}