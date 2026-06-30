# KAVL Backend - Setup Instructions

## Installation Complète

### 1. Créer la structure du projet

```bash
mkdir kavl
cd kavl
mkdir backend frontend

cd backend
```

### 2. Initialiser NestJS

```bash
npm install -g @nestjs/cli

nest new . --package-manager npm
# Sélectionner npm comme package manager
```

### 3. Installer les dépendances

```bash
npm install

# Database & ORM
npm install @prisma/client
npm install -D prisma

# Authentication
npm install @nestjs/jwt passport passport-jwt bcryptjs
npm install -D @types/express

# Validation
npm install class-validator class-transformer

# AI Integration
npm install @anthropic-ai/sdk

# Database query builder (optional, Prisma is enough)
npm install nestjs-prisma

# Logging
npm install winston

# Configuration
npm install @nestjs/config

# Environment
npm install dotenv

# Testing
npm install -D @nestjs/testing jest @types/jest ts-jest
npm install -D cypress

# Utils
npm install uuid
npm install -D @types/uuid
```

### 4. Créer .env

```bash
cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://kavl_user:kavl_password@localhost:5432/kavl_db"

# JWT
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Anthropic
ANTHROPIC_API_KEY="your-api-key-here"

# App
NODE_ENV="development"
PORT=3001

# CORS
CORS_ORIGIN="http://localhost:3000"
EOF
```

### 5. Initialiser Prisma

```bash
npx prisma init

# Modifier le .env avec DATABASE_URL
# Créer schema.prisma (voir étape 6)
```

---

## Package.json complète

```json
{
  "name": "kavl-backend",
  "version": "1.0.0",
  "description": "KAVL - AI-powered fitness tracking backend",
  "author": "KAVL Team",
  "private": true,
  "license": "MIT",
  "scripts": {
    "prebuild": "rimraf dist",
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "db:migrate:dev": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:studio": "prisma studio",
    "db:seed": "ts-node prisma/seed.ts",
    "db:push": "prisma db push"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.28.0",
    "@nestjs/common": "^10.3.0",
    "@nestjs/config": "^3.1.1",
    "@nestjs/core": "^10.3.0",
    "@nestjs/jwt": "^11.0.1",
    "@nestjs/passport": "^10.0.3",
    "@nestjs/platform-express": "^10.3.0",
    "@prisma/client": "^5.8.1",
    "bcryptjs": "^2.4.3",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "dotenv": "^16.3.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.1.13",
    "rimraf": "^5.0.5",
    "rxjs": "^7.8.1",
    "uuid": "^9.0.1",
    "winston": "^3.11.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.3.0",
    "@nestjs/schematics": "^10.0.3",
    "@nestjs/testing": "^10.3.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.11",
    "@types/node": "^20.10.6",
    "@types/uuid": "^9.0.7",
    "@typescript-eslint/eslint-plugin": "^6.16.0",
    "@typescript-eslint/parser": "^6.16.0",
    "cypress": "^13.6.2",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.1.2",
    "jest": "^29.7.0",
    "prettier": "^3.1.1",
    "prisma": "^5.8.1",
    "ts-jest": "^29.1.1",
    "ts-loader": "^9.5.1",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.3.3"
  }
}
```

---

## Prisma Schema Initial

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== AUTH & USERS ====================

model User {
  id                 String    @id @default(cuid())
  email              String    @unique
  passwordHash       String
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  // Profile
  firstName          String?
  lastName           String?
  age                Int?
  height             Int?           // cm
  weight             Int?           // kg
  level              UserLevel      @default(BEGINNER)  // beginner, intermediate, advanced
  goals              String[]
  injuries           String[]
  preferences        UserPreferences?

  // Relations
  workouts           WorkoutSession[]
  programs           Program[]
  metrics            UserMetrics[]
  photoProgression   BodyPhoto[]
  conversations      AIConversation[]
  achievements       Achievement[]
  aiLogs             AIPlannerLog[]
  favoriteExercises  FavoriteExercise[]

  @@map("users")
}

enum UserLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

model UserPreferences {
  id                 String    @id @default(cuid())
  userId             String    @unique
  user               User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  theme              Theme     @default(DARK)
  language           String    @default("en")
  notifications      Boolean   @default(true)
  emailNotifications Boolean   @default(false)

  @@map("user_preferences")
}

enum Theme {
  DARK
  LIGHT
  AUTO
}

// ==================== EXERCISES ====================

model Exercise {
  id                 String    @id @default(cuid())
  name               String    @unique
  description        String?
  muscleGroups       String[]     // "chest", "back", "legs"
  category           ExerciseCategory
  equipment          String[]
  videoUrl           String?
  gifUrl             String?
  instructions       String?
  difficulty         Difficulty @default(INTERMEDIATE)
  createdAt          DateTime  @default(now())

  // Relations
  workoutExercises   WorkoutExercise[]
  favorites          FavoriteExercise[]

  @@index([muscleGroups])
  @@index([equipment])
  @@map("exercises")
}

enum ExerciseCategory {
  STRENGTH
  CARDIO
  MOBILITY
  POWERLIFTING
  BODYBUILDING
}

enum Difficulty {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}

model FavoriteExercise {
  id         String    @id @default(cuid())
  userId     String
  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  exerciseId String
  exercise   Exercise  @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  addedAt    DateTime  @default(now())

  @@unique([userId, exerciseId])
  @@map("favorite_exercises")
}

// ==================== PROGRAMS ====================

model Program {
  id                 String    @id @default(cuid())
  name               String
  description        String?
  createdBy          String?   // null = KAVL official program
  creator            User?     @relation(fields: [createdBy], references: [id], onDelete: SetNull)
  isPublic           Boolean   @default(false)
  difficulty         Difficulty
  duration           Int?      // weeks
  content            String    // JSON with program structure
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  // Relations
  workouts           WorkoutSession[]

  @@index([createdBy])
  @@map("programs")
}

// ==================== WORKOUTS ====================

model WorkoutSession {
  id                 String    @id @default(cuid())
  userId             String
  user               User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  programId          String?
  program            Program?  @relation(fields: [programId], references: [id], onDelete: SetNull)
  
  name               String    // "Chest Day", "PPL - Push"
  plannedDate        DateTime
  completedAt        DateTime?
  status             WorkoutStatus @default(PLANNED)
  duration           Int?      // minutes
  notes              String?
  rpe                Int?      // Rate of Perceived Exertion (1-10)
  
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  // Relations
  exercises          WorkoutExercise[]

  @@index([userId])
  @@index([plannedDate])
  @@map("workout_sessions")
}

enum WorkoutStatus {
  PLANNED
  IN_PROGRESS
  COMPLETED
  SKIPPED
}

model WorkoutExercise {
  id                 String    @id @default(cuid())
  workoutSessionId   String
  workout            WorkoutSession @relation(fields: [workoutSessionId], references: [id], onDelete: Cascade)
  exerciseId         String
  exercise           Exercise  @relation(fields: [exerciseId], references: [id], onDelete: Cascade)
  
  exerciseOrder      Int       // Order in workout
  notes              String?
  
  createdAt          DateTime  @default(now())

  // Relations
  sets               Set[]

  @@unique([workoutSessionId, exerciseId, exerciseOrder])
  @@map("workout_exercises")
}

model Set {
  id                 String    @id @default(cuid())
  workoutExerciseId  String
  workoutExercise    WorkoutExercise @relation(fields: [workoutExerciseId], references: [id], onDelete: Cascade)
  
  setNumber          Int
  targetReps         Int?
  actualReps         Int?
  weight             Float?    // kg
  rpe                Int?      // 1-10
  completed          Boolean   @default(false)
  notes              String?
  
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  @@map("sets")
}

// ==================== USER METRICS ====================

model UserMetrics {
  id                 String    @id @default(cuid())
  userId             String
  user               User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  date               DateTime  @default(now())
  
  bodyweight         Float?    // kg
  bodyFat            Float?    // %
  sleepHours         Float?
  fatigue            Int?      // 1-10
  mood               Int?      // 1-10
  notes              String?
  
  exercisesDone      Int       @default(0)
  totalVolume        Int       @default(0)  // kg
  
  createdAt          DateTime  @default(now())

  @@index([userId, date])
  @@map("user_metrics")
}

model BodyPhoto {
  id                 String    @id @default(cuid())
  userId             String
  user               User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  date               DateTime  @default(now())
  frontUrl           String?
  sideUrl            String?
  backUrl            String?
  notes              String?
  
  createdAt          DateTime  @default(now())

  @@index([userId, date])
  @@map("body_photos")
}

// ==================== AI COACH ====================

model AIConversation {
  id                 String    @id @default(cuid())
  userId             String
  user               User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  title              String?
  messages           AIMessage[]
  
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  @@index([userId, updatedAt])
  @@map("ai_conversations")
}

model AIMessage {
  id                 String    @id @default(cuid())
  conversationId     String
  conversation       AIConversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  role               AIRole    // "user" or "assistant"
  content            String
  
  createdAt          DateTime  @default(now())

  @@index([conversationId])
  @@map("ai_messages")
}

enum AIRole {
  USER
  ASSISTANT
}

// ==================== PLANNER ====================

model AIPlannerLog {
  id                 String    @id @default(cuid())
  userId             String
  user               User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  generatedDate      DateTime  @default(now())  // Sunday when generated
  inputData          String    // JSON: metrics, history, gaps
  outputPlan         String?   // JSON: generated week
  
  createdAt          DateTime  @default(now())

  @@index([userId, generatedDate])
  @@map("ai_planner_logs")
}

// ==================== GAMIFICATION ====================

model Achievement {
  id                 String    @id @default(cuid())
  userId             String
  user               User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type               AchievementType
  name               String
  description        String?
  icon               String?   // emoji or icon URL
  
  unlockedAt         DateTime  @default(now())

  @@map("achievements")
}

enum AchievementType {
  FIRST_WORKOUT
  FIRST_PR
  HUNDRED_WORKOUTS
  SEVEN_DAY_STREAK
  CONSISTENCY_100
  MUSCLE_SPECIALIST
  LEVEL_UP
  BADGE_RARE
}
```

---

## Next Steps

1. **Initialize Database:**
   ```bash
   npx prisma migrate dev --name init
   ```

2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

3. **Seed Database (optional):**
   ```bash
   npm run db:seed
   ```

4. **Start Development Server:**
   ```bash
   npm run start:dev
   ```

The backend will be running on `http://localhost:3001`

Ready to start building modules!
