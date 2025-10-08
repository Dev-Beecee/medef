# 📅 Gestion des Périodes - Guide Complet

## 🎯 Vue d'ensemble

La page de gestion des dates permet de contrôler les périodes pendant lesquelles :

- **Les candidats peuvent participer** (soumettre leur candidature)
- **Les utilisateurs peuvent voter** (voter pour les candidats)

**URL** : `/ghost-dashboard/dates`

## ✨ Fonctionnalités

### 📊 Structure des données

Chaque période contient :

- **Date de début** : Quand la période commence
- **Date de fin** : Quand la période se termine
- **Statut actif** : Active ou désactivée (toggle)
- **Dates de création/mise à jour** : Historique automatique

### 🎨 Deux sections distinctes

#### 1. Périodes de participation 🎪

- **Couleur** : Bleu
- **But** : Définir quand les candidats peuvent soumettre leur formulaire
- **Table** : `date_participation`

#### 2. Périodes de vote 🗳️

- **Couleur** : Vert
- **But** : Définir quand le public peut voter
- **Table** : `date_vote`

## 🔧 Fonctionnalités détaillées

### ➕ Créer une nouvelle période

**Pour chaque type (participation ou vote)** :

1. **Formulaire en haut de la section** avec fond gris
2. **Trois champs** :

   - Date de début (datetime-local)
   - Date de fin (datetime-local)
   - Bouton "Créer" (bleu pour participation, vert pour vote)

3. **Validation** :

   - Les deux dates sont obligatoires
   - Toast d'erreur si champs vides
   - Toast de succès après création

4. **Résultat** :
   - La période apparaît immédiatement dans la liste
   - Le formulaire se réinitialise
   - Liste triée par date de création (plus récente en haut)

### 📋 Liste des périodes

Chaque période s'affiche dans une **carte** avec :

#### Informations affichées

- **Dates formatées** : "Du 07/10/2025 15:09 → Au 06/11/2025 15:09"
- **Badges de statut** :
  - 🟢 **En cours** : La période est active ET la date actuelle est entre début et fin
  - ⚪ **À venir** : La période n'a pas encore commencé
  - ⚫ **Terminée** : La période est passée
  - 🔴 **Désactivée** : Le toggle actif est sur OFF

#### Actions disponibles

1. **Toggle Actif/Inactif** ⚡

   - Switch en haut à droite de la carte
   - Permet d'activer/désactiver une période sans la supprimer
   - Mise à jour immédiate dans la base
   - Toast de confirmation

2. **Modifier les dates** ✏️

   - Bouton "Modifier"
   - Affiche deux champs datetime-local
   - Boutons "Sauvegarder" ou "Annuler"
   - Mise à jour immédiate
   - Toast de succès

3. **Supprimer** 🗑️
   - Bouton rouge "Supprimer"
   - Demande de confirmation
   - Suppression définitive de la base
   - Toast de succès

## 🎯 Statuts intelligents

Le système calcule automatiquement l'état de chaque période :

```typescript
const now = new Date();
const debut = new Date(periode.date_debut);
const fin = new Date(periode.date_fin);

// En cours = actif ET maintenant entre début et fin
const isActive = periode.actif && now >= debut && now <= fin;

// Terminée = maintenant après la fin
const isPast = now > fin;

// À venir = maintenant avant le début
const isFuture = now < debut;
```

### Exemples de statuts

| Actif | Date actuelle | Début | Fin   | Statut affiché |
| ----- | ------------- | ----- | ----- | -------------- |
| ✅    | 10/10         | 01/10 | 20/10 | 🟢 En cours    |
| ✅    | 10/10         | 15/10 | 20/10 | ⚪ À venir     |
| ✅    | 10/10         | 01/10 | 05/10 | ⚫ Terminée    |
| ❌    | 10/10         | 01/10 | 20/10 | 🔴 Désactivée  |

## 🎨 Design et UX

### Layout responsive

- **Desktop** : Formulaire sur 3 colonnes (date début, date fin, bouton)
- **Mobile** : Formulaire en colonne

### Cartes de période

- **Bordure** : Arrondie avec ombre légère
- **Espacement** : 3 unités entre les cartes
- **Badge** : Coloré selon le statut
- **Actions** : Alignées en bas avec bordure supérieure

### Couleurs

- **Participation** : Bleu (#2563eb)
- **Vote** : Vert (#16a34a)
- **Statut actif** : Vert
- **Statut terminé** : Gris
- **Statut à venir** : Blanc avec bordure
- **Désactivé** : Rouge

## 🔄 Interactions en temps réel

### Mise à jour automatique

Toutes les actions rechargent les données :

- Création d'une période
- Modification des dates
- Toggle actif/inactif
- Suppression

### Toast notifications

- ✅ **Succès** : Vert avec message de confirmation
- ❌ **Erreur** : Rouge avec description de l'erreur
- ⚠️ **Validation** : Jaune pour les champs manquants

## 📊 Utilisation dans l'application

### Périodes de participation

Ces périodes contrôlent l'affichage du bouton "Je participe" sur la page d'accueil.

**Logique** :

```sql
SELECT * FROM date_participation
WHERE actif = true
AND now() BETWEEN date_debut AND date_fin
```

Si une période active est trouvée → Bouton affiché

### Périodes de vote

Ces périodes contrôlent l'affichage du bouton "Je vote" sur la page publique.

**Logique** :

```sql
SELECT * FROM date_vote
WHERE actif = true
AND now() BETWEEN date_debut AND date_fin
```

Si une période active est trouvée → Bouton de vote affiché

## 🔐 Sécurité

- **Authentification requise** : Page protégée par le layout du dashboard
- **RLS activé** : Les tables ont Row Level Security
- **Confirmation de suppression** : Évite les suppressions accidentelles
- **Mise à jour du timestamp** : `updated_at` automatiquement mis à jour

## 🎯 Cas d'usage

### Scénario 1 : Lancement d'un concours

1. Créer une période de participation du 01/11 au 30/11
2. Créer une période de vote du 01/12 au 15/12
3. Les candidats peuvent s'inscrire en novembre
4. Le public peut voter en décembre

### Scénario 2 : Prolonger une période

1. Trouver la période active
2. Cliquer sur "Modifier"
3. Changer la date de fin
4. Sauvegarder

### Scénario 3 : Pause temporaire

1. Trouver la période active
2. Toggle le switch "Actif" sur OFF
3. Plus tard, remettre sur ON

### Scénario 4 : Nettoyer les anciennes périodes

1. Identifier les périodes "Terminée"
2. Cliquer sur "Supprimer"
3. Confirmer

## 🚀 Améliorations futures possibles

1. **Calendrier visuel** : Vue calendrier pour voir toutes les périodes
2. **Périodes récurrentes** : Créer des périodes qui se répètent
3. **Notifications** : Alerter quand une période va commencer/finir
4. **Historique** : Voir l'historique des modifications
5. **Templates** : Sauvegarder des modèles de périodes
6. **Conflits** : Détecter les périodes qui se chevauchent

## 📝 Structure de la base de données

### Table `date_participation`

```sql
id              uuid PRIMARY KEY
date_debut      timestamptz NOT NULL
date_fin        timestamptz NOT NULL
actif           boolean DEFAULT true
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

### Table `date_vote`

```sql
id              uuid PRIMARY KEY
date_debut      timestamptz NOT NULL
date_fin        timestamptz NOT NULL
actif           boolean DEFAULT true
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

## ⚠️ Gestion automatique des périodes uniques

### Comportement automatique

Le système garantit qu'**une seule période peut être active à la fois** pour chaque type :

#### Lors de la création d'une nouvelle période active

- Toutes les autres périodes du même type sont automatiquement désactivées
- Un message de confirmation est affiché : "Les autres périodes ont été désactivées"

#### Lors de l'activation d'une période existante

- Toutes les autres périodes du même type sont automatiquement désactivées
- Seule la période activée reste active
- Un message de confirmation est affiché

#### Avertissement visuel

Si plusieurs périodes sont actives simultanément (cas rare, manuel) :

- Un bandeau jaune d'avertissement s'affiche en haut de la section
- Message : "⚠️ Attention : X périodes sont actives simultanément"
- Recommandation : Désactiver les périodes en trop

### Exemples de scénarios

**Scénario 1 : Créer une nouvelle période active**

```
État initial : Période A (active), Période B (inactive)
Action : Créer Période C (active)
Résultat : Période A (inactive), Période B (inactive), Période C (active) ✅
```

**Scénario 2 : Activer une période inactive**

```
État initial : Période A (active), Période B (inactive)
Action : Activer Période B
Résultat : Période A (inactive), Période B (active) ✅
```

**Scénario 3 : Désactiver une période**

```
État initial : Période A (active)
Action : Désactiver Période A
Résultat : Période A (inactive) - Aucune période active
```

## 🎓 Bonnes pratiques

1. ✅ **Automatique** : Le système gère automatiquement l'unicité des périodes actives
2. **Dates cohérentes** : La date de fin doit être après la date de début
3. **Garder l'historique** : Ne pas supprimer les anciennes périodes, les désactiver
4. **Tester avant** : Créer une période de test dans le futur pour vérifier
5. **Vérifier les avertissements** : Si un bandeau jaune apparaît, corriger la situation

---

✅ **La page est complète et opérationnelle !**

Accès : Dashboard → Gestion des dates
