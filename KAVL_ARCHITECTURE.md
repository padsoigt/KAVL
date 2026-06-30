# KAVL - Architecture Technique

## Structure du Projet

```
kavl/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── auth/              # Authentication (JWT)
│   │   ├── users/             # User management
│   │   ├── exercises/         # Exercise library
│   │   ├── workouts/          # Workout sessions
│   │   ├── programs/          # Training programs
│   │   ├── ai-coach/          # AI integration
│   │   ├── planner/           # Smart Weekly Planner
│   │   ├── stats/             # Analytics
│   │   ├── metrics/           # User metrics
│   │   ├── achievements/      # Gamification
│   │   ├── common/            # Shared (guards, pipes, interceptors)
│   │   ├── database/          # Prisma schemas
│   │   ├── config/            # Configuration
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── .env.example
│   ├── docker-compose.yml
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
│
├── frontend/                   # Next.js App
│   ├── app/
│   │   ├── (auth)/             # Auth pages
│   │   │   ├── signup/
│   │   │   └── login/
│   │   ├── (dashboard)/        # Main app (protected)
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx        # Home dashboard
│   │   │   ├── workouts/       # Workout pages
│   │   │   ├── programs/
│   │   │   ├── stats/
│   │   │   ├── profile/
│   │   │   └── ai-coach/
│   │   ├── api/                # API routes
│   │   │   └── [...].ts        # Proxy/helpers
│   │   └── layout.tsx          # Root layout
│   ├── components/
│   │   ├── common/             # Shared components
│   │   ├── workout/            # Workout-specific
│   │   ├── stats/
│   │   └── ui/                 # Shadcn/UI
│   ├── lib/
│   │   ├── api.ts              # Axios client
│   │   ├── auth.ts             # Auth utils
│   │   ├── hooks.ts            # Custom hooks
│   │   └── utils.ts
│   ├── stores/                 # Zustand stores
│   │   ├── auth.ts
│   │   ├── workout.ts
│   │   └── ui.ts
│   ├── types/                  # TypeScript types
│   ├── public/
│   ├── .env.local.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.js
│   └── Dockerfile
│
├── docker-compose.yml          # Local development
├── .gitignore
└── README.md
```

---

## Backend Architecture (NestJS)

### Module Structure

```
src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── local.strategy.ts
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   └── dtos/
│       ├── signup.dto.ts
│       └── login.dto.ts
│
├── users/
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.module.ts
│   ├── dtos/
│   │   ├── create-user.dto.ts
│   │   └── update-profile.dto.ts
│   └── entities/
│       └── user.entity.ts
│
├── exercises/
│   ├── exercises.controller.ts
│   ├── exercises.service.ts
│   ├── exercises.module.ts
│   ├── dtos/
│   │   └── filter-exercise.dto.ts
│   └── entities/
│       └── exercise.entity.ts
│
├── workouts/
│   ├── workouts.controller.ts
│   ├── workouts.service.ts
│   ├── workouts.module.ts
│   ├── dtos/
│   │   ├── create-workout.dto.ts
│   │   ├── add-set.dto.ts
│   │   └── update-set.dto.ts
│   └── entities/
│       ├── workout.entity.ts
│       ├── set.entity.ts
│       └── workout-exercise.entity.ts
│
├── programs/
│   ├── programs.controller.ts
│   ├── programs.service.ts
│   ├── programs.module.ts
│   └── dtos/
│       └── create-program.dto.ts
│
├── ai-coach/
│   ├── ai-coach.controller.ts
│   ├── ai-coach.service.ts
│   ├── ai-coach.module.ts
│   ├── llm/
│   │   ├── anthropic.provider.ts  # Claude API
│   │   └── prompt.builder.ts      # Context builder
│   └── dtos/
│       └── chat.dto.ts
│
├── planner/
│   ├── planner.controller.ts
│   ├── planner.service.ts
│   ├── planner.module.ts
│   ├── strategies/
│   │   ├── ppl.strategy.ts        # Push/Pull/Legs
│   │   ├── full-body.strategy.ts
│   │   └── upper-lower.strategy.ts
│   └── dtos/
│       └── generate-week.dto.ts
│
├── stats/
│   ├── stats.controller.ts
│   ├── stats.service.ts
│   ├── stats.module.ts
│   └── calculators/
│       ├── pr.calculator.ts
│       ├── volume.calculator.ts
│       └── heatmap.calculator.ts
│
├── achievements/
│   ├── achievements.service.ts
│   ├── achievements.module.ts
│   └── badge-registry.ts
│
├── common/
│   ├── guards/
│   │   └── jwt-auth.guard.ts
│   ├── interceptors/
│   │   ├── logging.interceptor.ts
│   │   ├── error.interceptor.ts
│   │   └── transform.interceptor.ts
│   ├── pipes/
│   │   └── validation.pipe.ts
│   └── decorators/
│       ├── current-user.decorator.ts
│       └── roles.decorator.ts
│
├── database/
│   └── prisma.service.ts
│
├── config/
│   ├── app.config.ts
│   ├── database.config.ts
│   └── auth.config.ts
│
├── app.controller.ts
├── app.service.ts
├── app.module.ts
└── main.ts
```

### Data Flow

```
Frontend Request
    ↓
NestJS Controller (validation DTOs)
    ↓
Service Layer (business logic)
    ↓
Prisma ORM → PostgreSQL
    ↓
Response (DTO → JSON)
    ↓
Frontend
```

---

## Frontend Architecture (Next.js)

### Pages & Routing

```
/                    → Home/Dashboard
/signup              → Registration
/login               → Login
/dashboard           → Main dashboard (protected)
/workouts            → List workouts
/workouts/:id        → Workout detail / In-progress
/workouts/new        → Start new workout
/programs            → Browse programs
/programs/:id        → Program detail
/programs/new        → Create program
/stats               → Analytics dashboard
/stats/progress/:id  → Exercise progress
/profile             → User settings
/ai-coach            → Coach chat interface
/ai-coach/:id        → Conversation history
```

### State Management (Zustand)

```typescript
// auth.store.ts
- user: User | null
- token: string | null
- login()
- logout()
- isAuthenticated()

// workout.store.ts
- currentWorkout: Workout | null
- sets: Set[]
- startWorkout()
- addSet()
- completeWorkout()
- getLastWeight()

// ui.store.ts
- theme: 'dark' | 'light'
- sidebarOpen: boolean
- notifications: Notification[]
- toggleTheme()
```

### API Client (Axios)

```typescript
// lib/api.ts
const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor - add JWT token
// Response interceptor - handle errors, refresh token

export const api = {
  auth: { signup, login, logout },
  workouts: { getAll, getById, create, updateSet },
  exercises: { getAll, getById, search },
  stats: { getPR, getVolume, getProgress },
  ai: { chat, getConversations },
  // ...
}
```

---

## Database Schema (Prisma)

### Key Relations

```
User ──1──→ ∞─── Workout
User ──1──→ ∞─── Program
User ──1──→ ∞─── AIConversation
User ──1──→ ∞─── UserMetrics
User ──1──→ ∞─── BodyPhotos
User ──1──→ ∞─── Achievement

Program ──1──→ ∞─── Workout (if program-based)
Workout ──1──→ ∞─── WorkoutExercise (join table)
WorkoutExercise ──1──→ ∞─── Set
ExerciseMaster ──∞──← WorkoutExercise

AIPlannerLog ──1──→ User (Sunday generation)
```

---

## Security

### Authentication Flow

```
Signup/Login
    ↓
Credentials → Hash (bcrypt)
    ↓
JWT Token (HS256)
    ↓
LocalStorage (frontend)
    ↓
Headers: Authorization: Bearer <token>
    ↓
JwtAuthGuard validates
    ↓
@CurrentUser() injects user context
```

### Environment Variables

**Backend (.env)**
```
DATABASE_URL=postgresql://user:pass@localhost:5432/kavl
JWT_SECRET=super_secret_key_change_in_prod
JWT_EXPIRES_IN=7d
ANTHROPIC_API_KEY=your_api_key
NODE_ENV=development
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_ENV=development
```

---

## API Response Format

### Success Response
```json
{
  "status": "success",
  "data": { /* payload */ },
  "message": "Operation completed"
}
```

### Error Response
```json
{
  "status": "error",
  "code": "INVALID_INPUT",
  "message": "Email already exists",
  "details": { /* validation errors */ }
}
```

---

## Deployment Strategy

### Development
- Docker Compose (PostgreSQL, Redis, Backend, Frontend)
- Hot reload
- Debug mode

### Production
- Frontend: Vercel (auto-deploy on push)
- Backend: Railway or Render (Docker)
- Database: Managed PostgreSQL (Railway, Supabase)
- Caching: Redis (optional)
- CDN: Vercel/Cloudflare for static assets
- LLM: Anthropic API (Claude)

---

## Performance Optimization

1. **Frontend**
   - Next.js Image optimization
   - Code splitting per route
   - React Query caching (30-min default)
   - LocalStorage cache for user profile

2. **Backend**
   - Database indexing on frequently queried fields
   - Redis for session management
   - Pagination on list endpoints
   - Lazy load exercise videos

3. **Caching Strategy**
   - User profile: 1 hour
   - Exercise list: 24 hours
   - Workout data: real-time
   - Stats: computed on-demand, cached 1 hour

---

## Error Handling

- Global error interceptor (backend)
- User-friendly error messages
- Detailed logging (Winston)
- Sentry for production monitoring

---

## Testing Strategy

- **Unit**: Jest (services, utilities)
- **E2E**: Cypress (frontend flows)
- **API**: Postman/REST Client
- **Load**: k6 (API stress testing)

**Coverage Target**: 70%+ for critical paths

---

## CI/CD Pipeline

```
Push to main
    ↓
GitHub Actions
    ↓
Lint & Format (ESLint, Prettier)
    ↓
Run Tests (Jest, Cypress)
    ↓
Build & Docker image
    ↓
Deploy to staging
    ↓
E2E tests on staging
    ↓
Deploy to production
```

---

This architecture is scalable, modular, and production-ready. Ready to start coding!
