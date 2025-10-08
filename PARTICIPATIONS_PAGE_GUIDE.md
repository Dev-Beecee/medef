# 📋 Page Participations - Guide Complet

## 🎯 Vue d'ensemble

La page des participations est maintenant disponible sur `/ghost-dashboard/participations`. Elle affiche un tableau moderne avec toutes les participations au concours et permet de gérer leur statut.

## ✨ Fonctionnalités

### 📊 Tableau des participations

Le tableau affiche les colonnes suivantes :

- **Établissement** : Nom de l'établissement
- **Candidat** : Prénom et nom du candidat
- **Qualité** : Fonction/qualité de la personne agissante
- **Structure** : Nom de la structure + dénomination commerciale (si disponible)
- **Email** : Email de contact
- **Téléphone** : Numéro de téléphone
- **Statut** : Select déroulant avec 3 options
- **Actions** : Bouton "Voir plus"

### 🔄 Gestion des statuts

Le statut peut être modifié directement depuis le tableau avec 3 options :

- **En attente** : Statut par défaut
- **Validé** : Participation acceptée
- **Refusé** : Participation rejetée

**Fonctionnement** :

- Le changement de statut se fait via un Select
- La mise à jour est immédiate dans la base de données
- Un toast de confirmation s'affiche
- Le tableau se recharge automatiquement

### 👁️ Dialogue détaillé

En cliquant sur "Voir plus", une modale s'ouvre avec **toutes** les informations :

#### 1. Vidéo (en premier) 🎥

- Lecteur vidéo intégré avec contrôles
- Lecture depuis le S3 (`video_s3_url`)
- Design moderne et responsive

#### 2. Informations générales

- Établissement
- Candidat (prénom + nom)
- Qualité
- Structure
- Dénomination commerciale
- Email
- Téléphone
- Date de création

#### 3. Informations légales

- SIRET
- NAF
- Forme juridique
- Capital social
- Effectif 2023
- Adresse du siège social

#### 4. Activité

- Activité principale
- Description de l'activité
- Clientèle
- Produits et services

#### 5. Inclusion handicap

- Approche
- Besoins
- Pourcentage de travailleurs handicapés
- Accompagnement embauche
- Collaboration avec entreprises adaptées

#### 6. Catégories sélectionnées

- Affichées sous forme de badges
- Exemples :
  - Embauche de salarié/agent en situation de handicap
  - Maintien dans l'emploi
  - Embauche en alternance

#### 7. Documents

Liens vers les documents stockés sur S3 :

- Attestation de régularité
- KBIS
- Signature

#### 8. État du formulaire

- Étape actuelle (1-5)
- Formulaire complet (Oui/Non)
- Acceptation du règlement (Oui/Non)
- Autorisation diffusion vidéo (Oui/Non)

## 🎨 Design

### Composants utilisés

- `Table` : Tableau shadcn/ui moderne
- `Dialog` : Modale pour les détails
- `Select` : Sélecteur de statut
- `Badge` : Pour les catégories et compteur

### Style

- **Tableau** : Bordures arrondies, hover effects
- **Modale** : Grande (max-w-4xl), scrollable
- **Sections** : Séparées visuellement avec des titres
- **Responsive** : Grille adaptative (grid-cols-2)

## 📝 Structure du code

```typescript
// Type complet pour une participation
type Participation = {
  // Toutes les 47 colonnes de la table
  id: string
  nom_etablissement: string
  // ... etc
}

// Fonctions principales
- fetchParticipations(): Récupère toutes les participations
- updateStatut(): Met à jour le statut d'une participation
- InfoItem: Composant pour afficher une info (label + valeur)
- DocumentLink: Composant pour afficher un lien vers un document
```

## 🔐 Sécurité

La page est automatiquement protégée car elle est dans `/ghost-dashboard` qui utilise le layout avec authentification.

## 🚀 Utilisation

1. Se connecter sur `/ghost`
2. Naviguer vers `/ghost-dashboard/participations`
3. Voir la liste de toutes les participations
4. Modifier le statut directement depuis le tableau
5. Cliquer sur "Voir plus" pour voir tous les détails
6. Regarder la vidéo de présentation dans la modale

## 📊 Données affichées

Le tableau récupère **toutes** les colonnes de la table `participations` :

- 47 colonnes au total
- Tri par date de création (plus récentes en premier)
- Mise à jour en temps réel

## 🎯 Prochaines améliorations possibles

1. **Filtres** : Par statut, date, etc.
2. **Recherche** : Par nom, email, SIRET
3. **Export** : CSV, Excel
4. **Pagination** : Pour grandes quantités
5. **Tri** : Par colonne
6. **Actions en masse** : Valider/refuser plusieurs à la fois

## 🐛 Gestion des erreurs

- Toast d'erreur si problème de chargement
- Toast d'erreur si problème de mise à jour
- Toast de succès après mise à jour
- Gestion des valeurs null/undefined
- Affichage "-" pour les champs vides

## 📱 Responsive

- **Desktop** : Tableau complet visible
- **Mobile** : Tableau scrollable horizontalement
- **Modale** : Adapte sa largeur à l'écran
- **Vidéo** : Responsive avec `w-full`

---

✅ **La page est opérationnelle et prête à l'emploi !**
