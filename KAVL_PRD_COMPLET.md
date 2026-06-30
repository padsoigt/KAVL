# KAVL - Product Requirements Document (PRD) Complet

## 1. Vision Générale
KAVL est une application premium de suivi d'entraînement avec un coach IA adaptatif. Notre mission : transformer le simple carnet de musculation en système de progression intelligente et personnalisée qui comprend l'utilisateur et planifie automatiquement son évolution.

**Tagline** : "Ton coach personnel qui apprend de toi"

---

## 2. Objectifs Produit

- ✅ Créer une expérience UX premium et intuitive
- ✅ Automatiser la planification des entraînements via le Smart Weekly Planner
- ✅ Fournir un coach IA contextuel et adaptatif
- ✅ Suivre la progression long terme avec précision
- ✅ Engager les utilisateurs via gamification
- ✅ Réduire le temps de saisie (< 15 sec/série)

---

## 3. Personas Utilisateurs

### 1. **Le Débutant** (25%)
- Âge : 18-30 ans
- Motivation : Transformer son physique, avoir confiance
- Pain points : Pas de structure, peur de faire mal
- Solution KAVL : Smart Planner génère automatiquement le programme

### 2. **Le Pratiquant Intermédiaire** (50%)
- Âge : 25-40 ans
- Motivation : Progression, esthétique, force
- Pain points : Stagnation, démotivation, besoin de conseils
- Solution KAVL : Coach IA qui adapte les séances, statistiques détaillées

### 3. **Le Coach/Expert** (15%)
- Âge : 30-50 ans
- Motivation : Suivre ses clients, optimiser les programmes
- Solution KAVL : Création de programmes, partage, analytics

### 4. **L'Utilisateur Orienté Esthétique** (10%)
- Âge : 18-35 ans
- Motivation : Photos de progression, physique
- Solution KAVL : Suivi photos, heatmap par muscle

---

## 4. Benchmark Concurrentiel

| App | Forces | À Éviter |
|-----|--------|----------|
| **Hevy** | UX simple, charts | Pas de coach IA |
| **Strong** | Suivi détaillé | Basique, peu d'engagement |
| **Fitbod** | Analytics avancées | UX confuse, pricey |
| **Strava** | Communauté | Outdoor-focused |
| **Notion** | Flexible, customizable | Compliqué, pas d'app native |
| **Alpha Progress** | Progression tracking | Payant, limité |
| **Boostcamp** | Programmes de qualité | Pas de coach personnalisé |

**Stratégie KAVL** : Combiner le meilleur de tous en ajoutant l'IA adaptative unique

---

## 5. Proposition de Valeur Unique

1. **Smart Weekly Planner** - Génération automatique intelligente des séances
2. **Coach IA Contextuel** - Recommandations basées sur le profil complet de l'utilisateur
3. **UX Premium** - Interface sombre, rapide, accessible
4. **Suivi Long Terme** - Historique complet, progression visible
5. **Gamification** - Niveaux, badges, streaks pour maintenir la motivation
6. **Zero Friction** - Saisie rapide, automatisation maximale

---

## 6. Features MVP (Phase 1 - 3 mois)

### 6.1 Authentification & Onboarding
- Sign up / Login (email, optionnel Google)
- Profil utilisateur complet (niveau, objectifs, préférences)
- Questionnaire initial (morphotype, expérience, blessures)

### 6.2 Gestion des Exercices
- Bibliothèque de 500+ exercices avec vidéos/gifs
- Filtrage par muscle, catégorie, équipement
- Exercices favoris

### 6.3 Programmes
- Programmes pré-faits (Push/Pull/Legs, Full Body, etc.)
- Programmes personnalisés via coach IA
- Duplication et customisation

### 6.4 Mode Séance
- Interface rapide et minimale
- Saisie rapide (sets/reps/poids)
- Timer entre séries
- Progression automatique (poids suggéré)
- Historique des dernières séries

### 6.5 Statistiques & Suivi
- PR (Personal Records) par exercice
- Volume total (sets x reps x poids)
- Muscles travaillés par semaine (heatmap)
- Progression graphique
- Streaks et consistency metrics

### 6.6 Smart Weekly Planner
- Analyse chaque dimanche : historique, récupération, douleurs
- Génère automatiquement la semaine suivante
- Réorganise si séances manquées
- Propositions d'exercices alternatifs

### 6.7 Coach IA Basique
- Chat en texte avec le coach
- Contexte : profil, objectifs, historique, fatigue
- Recommandations : technique, progression, nutrition
- Intégration API LLM (Claude, OpenAI)

---

## 7. Architecture Détaillée

### 7.1 Tech Stack

**Frontend:**
- React 18 + Next.js 14+ (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/UI (composants)
- TanStack Query (React Query)
- Zustand (state management)
- Axios pour les requêtes

**Backend:**
- Node.js + NestJS 10+
- TypeScript
- PostgreSQL 15+
- Prisma ORM
- JWT pour authentification
- Swagger pour documentation API

**Infrastructure:**
- Docker (dev & prod)
- PostgreSQL
- Redis (cache, sessions)
- API LLM (Claude via Anthropic SDK)
- Stockage d'images (AWS S3 ou local pour MVP)
- Deployment : Railway, Render, ou Vercel

---

## 8. Schéma Base de Données

```
Users
├── id, email, password_hash, created_at
├── profile: firstName, lastName, age, height, weight
├── preferences: theme, language, notifications
├── level: beginner, intermediate, advanced
├── goals: text array
├── injuries: text array

Exercises
├── id, name, description
├── muscleGroups: string[]
├── category: strength, cardio, mobility
├── equipment: barbell, dumbbell, machine, bodyweight
├── videoUrl, gifUrl
├── instructions: text

Programs
├── id, name, description
├── createdBy: userId (user-created) ou null (KAVL official)
├── isPublic: boolean
├── difficulty: beginner, intermediate, advanced

WorkoutSessions
├── id, userId, programId, date
├── plannedDate: datetime
├── completedAt: datetime
├── status: planned, in_progress, completed, skipped
├── notes: text

WorkoutExercises (junction)
├── id, workoutSessionId, exerciseId, order
├── sets: SetRecord[]

Sets
├── id, workoutExerciseId
├── setNumber, targetReps, targetReps, actualReps, weight, rpe
├── completed: boolean

UserMetrics
├── id, userId, date
├── bodyweight, bodyFat, sleepHours, fatigue (1-10)
├── mood, notes
├── exercisesDone, totalVolume

AIPlannerLogs
├── id, userId, date (Sunday)
├── inputData: JSON (metrics, history, gaps)
├── generatedWeek: JSON (workoutSessions)

AIConversations
├── id, userId, createdAt
├── messages: { role, content, timestamp }[]
├── context: user profile, recent history

Achievements
├── id, userId, achievementType (badge, level, streak)
├── unlockedAt, metadata

BodyPhotos
├── id, userId, date, frontUrl, sideUrl, backUrl
```

---

## 9. API Endpoints (Principal)

### Auth
```
POST   /auth/signup
POST   /auth/login
POST   /auth/refresh-token
POST   /auth/logout
```

### Profile
```
GET    /users/me
PUT    /users/me
GET    /users/me/metrics
POST   /users/me/metrics
```

### Exercises
```
GET    /exercises (with filters)
GET    /exercises/:id
GET    /exercises/favorites
POST   /exercises/favorites/:id
```

### Workouts
```
GET    /workouts
GET    /workouts/:id
POST   /workouts (start workout)
PUT    /workouts/:id (update workout)
POST   /workouts/:id/sets (add set)
PUT    /workouts/:id/sets/:setId (update set)
```

### Programs
```
GET    /programs (public programs)
GET    /users/me/programs
POST   /programs (create custom)
GET    /programs/:id
PUT    /programs/:id
```

### Smart Planner
```
GET    /planner/week (get current week)
POST   /planner/generate (generate next week)
PUT    /planner/rearrange (rearrange due to missed workouts)
```

### AI Coach
```
POST   /ai/chat (send message)
GET    /ai/conversations/:id
GET    /ai/recommendations (personalized recommendations)
```

### Stats
```
GET    /stats/pr
GET    /stats/volume
GET    /stats/progress/:exerciseId
GET    /stats/muscle-heatmap
GET    /stats/streaks
```

---

## 10. Smart Weekly Planner - Algorithme

**Chaque dimanche 22h :**

1. **Collecte les données de la semaine**
   - Séances complétées vs planifiées
   - RPE moyen, volume total
   - Groupes musculaires travaillés
   - Récupération (sommeil, fatigue)
   - Douleurs/blessures

2. **Analyse la progression**
   - Progression depuis 4 semaines
   - Patterns de performance
   - Muscles à privilégier vs à laisser reposer

3. **Génère la semaine suivante**
   - Balance : push/pull/legs ou PPL ou Full Body
   - Exercices : routine (80%) + variation (20%)
   - Volume : augmente graduellement
   - RPE : progressif (jamais push à 100% chaque séance)

4. **Adapte en temps réel**
   - Si séance manquée : réorganise la suite de la semaine
   - Si utilisateur fatigue : réduit volume, augmente repos

---

## 11. Coach IA - Fonctionnement

**Contexte envoyé à l'API LLM :**
```json
{
  "user": {
    "level": "intermediate",
    "goals": ["muscle gain", "strength"],
    "injuries": [],
    "fatigue": 6,
    "sleepHours": 7.5
  },
  "recent": {
    "weeklyVolume": 45000,
    "completedSessions": 4,
    "PRs": ["Bench: 100kg", "Squat: 140kg"],
    "lastExercises": [...]
  },
  "question": "Je dois faire mon chest demain, quoi faire?"
}
```

**Réponse du coach :**
- Recommandations adaptées au contexte
- Conseil technique
- Motivations
- Ajustements basés sur progression

---

## 12. Gamification

| Élément | Description |
|---------|-------------|
| **Niveaux** | 1-50, déblocage par XP (séances, PR, consistency) |
| **Badges** | 50+ badges (Premier dépassement, 100 séances, etc.) |
| **Streaks** | Jours consécutifs d'activité, bonus multiplicateur XP |
| **Weekly Goals** | 3-5 objectifs par semaine (volume, consistency, PR) |
| **Leaderboard** | Optionnel : compétition amicale avec amis |

---

## 13. Roadmap (12 mois)

### Phase 1 - MVP (Mois 1-3)
- ✅ Auth, Profil, Exercises
- ✅ Mode Séance basique
- ✅ Statistiques essentielles
- ✅ Smart Weekly Planner v1
- ✅ Coach IA basique

### Phase 2 - Engagement (Mois 4-6)
- ✅ Gamification complète
- ✅ Programmes recommandés
- ✅ Photo tracking
- ✅ Partage & social (friends)

### Phase 3 - Advanced (Mois 7-9)
- ✅ Intégration wearables (Apple Health, Fitbit)
- ✅ Planification automatique des macros
- ✅ Recommandations vidéo personnalisées
- ✅ Mode offline

### Phase 4 - Vision à Long Terme (Mois 10-12)
- ✅ Vision IA (analyse photos de progression)
- ✅ Intégration nutrition complète
- ✅ API pour coaches (SAAS B2B)
- ✅ Communauté et défis

---

## 14. Monétisation

| Tier | Prix | Features |
|------|------|----------|
| **Free** | 0€ | Saisie, 50 exos, stats basiques |
| **Premium** | 4.99€/mois | Tous les programmes, 1000 exos, stats avancées |
| **Premium AI** | 9.99€/mois | Coach IA illimité, planner personnalisé |
| **Pro (Coach)** | 19.99€/mois | Gestion clients, API |

---

## 15. Critères de Succès (Metrics)

- **Rétention** : 40%+ weekly, 20%+ monthly
- **Engagement** : 3+ séances/semaine par utilisateur actif
- **Satisfaction** : Rating 4.5+/5
- **Temps de saisie** : < 15 sec/série en moyenne
- **Adoption AI** : 60%+ des utilisateurs utilisent le coach
- **Conversion** : 5%+ free → paid

---

## 16. Vision Long Terme

Construire le **"GitHub de la progression physique"** : 
- Un système qui comprend chaque utilisateur
- Qui planifie automatiquement son évolution
- Qui s'améliore à chaque interaction
- Où les données de progression deviennent un asset personnel

KAVL n'est pas juste une app, c'est un **coach personnel** qui vit avec toi.

---

*Document créé : Juin 2026*
*Statut : Prêt pour développement*
