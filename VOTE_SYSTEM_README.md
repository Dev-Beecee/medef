# Système de Vote - Documentation

## Vue d'ensemble

Le système de vote permet aux utilisateurs de voter pour des candidatures dans différentes catégories. Il comprend 5 étapes :

1. **Catégorie 1** - Vote pour les candidatures de la première catégorie
2. **Catégorie 2** - Vote pour les candidatures de la deuxième catégorie
3. **Catégorie 3** - Vote pour les candidatures de la troisième catégorie
4. **Catégorie 4** - Vote pour les candidatures de la quatrième catégorie
5. **Validation** - Récapitulatif et vérification email

## Fonctionnalités

### 🗳️ Système de vote par boutons radio

- Vote "Je vote" (1) ou "Je ne vote pas" (0) pour chaque candidature
- Interface claire avec boutons radio
- Sauvegarde automatique des votes en cours

### 📱 Responsive Design

- **Desktop** : Affichage de 12 candidatures par page
- **Mobile** : Affichage de 6 candidatures par page
- Bouton "Voir plus" pour charger les candidatures suivantes

### 🔐 Vérification Email

- Vérification unique par adresse email
- Code de vérification à 6 chiffres
- Expiration du code après 1 heure
- Prévention des votes multiples

### 🎬 Gestion des Candidatures Multi-Catégories

- Une candidature peut appartenir à plusieurs catégories
- Vote séparé pour chaque catégorie
- Récapitulatif complet des votes

### 📹 Affichage des Vidéos

- Lecture des vidéos directement depuis S3
- Contrôles de lecture intégrés
- Fallback pour les vidéos manquantes

## Structure de la Base de Données

### Tables Principales

#### `vote_categories`

```sql
- id (SERIAL PRIMARY KEY)
- name (VARCHAR(100) UNIQUE)
- description (TEXT)
- order_index (INTEGER)
- created_at (TIMESTAMP)
```

#### `participations`

```sql
- id (UUID PRIMARY KEY)
- nom_etablissement (VARCHAR)
- nom_candidat (VARCHAR)
- prenom_candidat (VARCHAR)
- video_s3_url (TEXT)
- categories_selectionnees (INTEGER[])
- statut (VARCHAR) -- 'validé' pour les candidatures éligibles
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### `votes`

```sql
- id (SERIAL PRIMARY KEY)
- video_id (TEXT) -- ID de la participation
- category_id (INTEGER REFERENCES vote_categories(id))
- email (VARCHAR(255))
- vote_value (INTEGER CHECK 0-1) -- 0 = Je ne vote pas, 1 = Je vote
- created_at (TIMESTAMP)
- UNIQUE(video_id, category_id, email)
```

#### `email_verifications`

```sql
- id (SERIAL PRIMARY KEY)
- email (VARCHAR(255) UNIQUE)
- verification_code (VARCHAR(6))
- is_verified (BOOLEAN)
- verified_at (TIMESTAMP)
- created_at (TIMESTAMP)
- expires_at (TIMESTAMP)
```

## Composants

### `VoteComponent`

Composant principal qui orchestre tout le processus de vote.

### `VideoGrid`

Affiche les candidatures en grille avec pagination responsive et lecteur vidéo intégré.

### `VoteSummary`

Affiche le récapitulatif des votes avant soumission avec indicateurs visuels (✓/✗).

### `EmailVerification`

Gère la vérification de l'adresse email.

### `StepIndicator`

Indicateur visuel des étapes du processus.

### `useEmailVerification`

Hook personnalisé pour la gestion de la vérification email.

## Utilisation

### 1. Accès au système

```typescript
// Page de vote
import VoteComponent from "@/components/VoteComponent";

export default function VotePage() {
  return <VoteComponent />;
}
```

### 2. Navigation

- **Bouton Précédent** : Retour à l'étape précédente
- **Bouton Suivant** : Passage à l'étape suivante
- **Bouton Soumettre** : Validation finale (étape 5 uniquement)

### 3. Processus de Vote

1. L'utilisateur navigue entre les 4 catégories
2. Pour chaque catégorie, il vote pour les candidatures (Je vote / Je ne vote pas)
3. À l'étape 5, il vérifie son récapitulatif
4. Il saisit son email et vérifie le code reçu
5. Il soumet ses votes

## Configuration

### Variables d'Environnement

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Données de Test

Le système inclut 15 candidatures de test avec différentes combinaisons de catégories pour tester tous les cas d'usage. Les candidatures sont récupérées depuis la table `participations` avec le statut `validé`.

## Sécurité

- ✅ Vérification email unique par vote
- ✅ Code de vérification avec expiration
- ✅ Contraintes de base de données pour éviter les doublons
- ✅ Validation côté client et serveur
- ✅ Protection contre les votes multiples

## Personnalisation

### Modifier le nombre de candidatures par page

```typescript
// Dans VideoGrid.tsx
const participationsPerPage = isMobile ? 6 : 12; // Modifier ces valeurs
```

### Ajouter de nouvelles catégories

```sql
INSERT INTO vote_categories (name, description, order_index) VALUES
('Nouvelle Catégorie', 'Description', 5);
```

### Modifier la durée d'expiration du code

```typescript
// Dans useEmailVerification.ts
expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 heure
```

## Tests

Pour tester le système :

1. Accédez à `/vote`
2. Naviguez entre les catégories
3. Votez pour quelques vidéos
4. Testez la vérification email (le code s'affiche dans la console)
5. Soumettez vos votes

## Support

En cas de problème :

1. Vérifiez les logs de la console
2. Contrôlez la connexion Supabase
3. Vérifiez les données de test dans la base
4. Consultez les erreurs de linting
