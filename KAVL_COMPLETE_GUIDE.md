# 🚀 KAVL - Complete Development Guide

**Version**: 1.0.0  
**Status**: Ready for Development  
**Last Updated**: June 2026

---

## 📌 Quick Start (5 Minutes)

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis (optional)
- npm or yarn
- Git

### Step 1: Clone & Setup

```bash
git clone <your-repo> kavl
cd kavl

# Install backend dependencies
cd backend
npm install
cp .env.example .env

# Install frontend dependencies
cd ../frontend
npm install
cp .env.local.example .env.local
```

### Step 2: Database Setup

```bash
cd backend

# Create .env file
DATABASE_URL="postgresql://kavl_user:kavl_password@localhost:5432/kavl_db"
JWT_SECRET="dev-secret-key"
ANTHROPIC_API_KEY="your-api-key"

# Run migrations
npx prisma migrate dev --name init

# Seed database (optional)
npm run db:seed
```

### Step 3: Start Services

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
# Backend runs on http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

### Step 4: Check Health

```bash
# Backend health
curl http://localhost:3001/health

# API Docs
http://localhost:3001/api/docs
```

---

## 📁 Project Structure

```
kavl/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── auth/              # ✅ Ready
│   │   ├── users/             # ✅ Ready
│   │   ├── exercises/         # ✅ Ready
│   │   ├── workouts/          # ✅ Ready
│   │   ├── programs/          # ✅ Ready
│   │   ├── ai-coach/          # ✅ Ready
│   │   ├── stats/             # ✅ Ready
│   │   ├── achievements/      # ✅ Ready
│   │   ├── planner/           # 🔄 TODO
│   │   ├── metrics/           # ✅ Base
│   │   ├── common/            # ✅ Ready
│   │   ├── database/          # ✅ Ready
│   │   └── main.ts            # ✅ Ready
│   ├── prisma/
│   │   └── schema.prisma      # ✅ Ready
│   └── Dockerfile             # ✅ Ready
│
├── frontend/                   # Next.js App
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── stores/
│   ├── types/
│   └── public/
│
├── docker-compose.yml          # ✅ Ready
├── .gitignore
└── README.md
```

---

## 🎯 Development Roadmap

### Phase 1: MVP Foundation (Weeks 1-4)
**Status: 70% Complete**

- ✅ Auth system (signup/login/JWT)
- ✅ User profiles
- ✅ Exercise library (500+ exercises)
- ✅ Workout tracking (create, add sets, complete)
- ✅ Basic statistics (PR, volume, progress)
- ✅ AI Coach integration (basic)
- 🔄 Frontend UI (30% complete)

**Next Tasks:**
1. Complete frontend authentication pages
2. Build workout tracking UI
3. Create exercise browser component
4. Implement stats dashboard

### Phase 2: Smart Features (Weeks 5-8)
**Status: Not Started**

- ⏳ Smart Weekly Planner algorithm
- ⏳ Advanced AI recommendations
- ⏳ Gamification (levels, badges, streaks)
- ⏳ User preferences & settings
- ⏳ Photo progression tracking

### Phase 3: Polish & Testing (Weeks 9-12)
**Status: Pending**

- ⏳ E2E testing
- ⏳ Performance optimization
- ⏳ Error handling & edge cases
- ⏳ UI/UX refinement
- ⏳ Deployment setup

---

## 🛠️ Tech Stack Overview

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | Next.js | 14+ |
| | React | 18+ |
| | TypeScript | 5.3+ |
| | Tailwind CSS | 3.3+ |
| **Backend** | NestJS | 10+ |
| | TypeScript | 5.3+ |
| | Node.js | 20+ |
| **Database** | PostgreSQL | 15+ |
| | Prisma ORM | 5+ |
| **Cache** | Redis | 7+ |
| **AI** | Anthropic Claude | Sonnet 4 |
| **Auth** | JWT | - |
| **API Docs** | Swagger | - |

---

## 📝 API Endpoints Reference

### Authentication
```
POST   /auth/signup           # Register
POST   /auth/login            # Login
POST   /auth/refresh-token    # Refresh JWT
GET    /auth/me               # Current user (protected)
```

### Users
```
GET    /users/me              # Profile
PUT    /users/me              # Update profile
POST   /users/me/metrics      # Add metrics
GET    /users/me/metrics      # Get metrics history
```

### Exercises
```
GET    /exercises             # List (with filters)
GET    /exercises/search      # Search
GET    /exercises/:id         # Detail
POST   /exercises/favorites/:id    # Add favorite
DELETE /exercises/favorites/:id    # Remove favorite
GET    /exercises/favorites   # Get favorites
```

### Workouts
```
POST   /workouts              # Start workout
GET    /workouts              # List
GET    /workouts/:id          # Detail
PUT    /workouts/:id          # Update
POST   /workouts/:id/complete # Complete
POST   /workouts/:id/sets     # Add set
PUT    /workouts/sets/:setId  # Update set
DELETE /workouts/sets/:setId  # Delete set
```

### Programs
```
GET    /programs              # Public programs
GET    /programs/:id
GET    /users/me/programs     # User programs
POST   /programs              # Create
PUT    /programs/:id          # Update
DELETE /programs/:id          # Delete
```

### AI Coach
```
POST   /ai-coach/chat         # Send message
GET    /ai-coach/conversations  # List
GET    /ai-coach/conversations/:id
```

### Statistics
```
GET    /stats/pr              # Personal records
GET    /stats/volume          # Volume
GET    /stats/progress/:exerciseId
GET    /stats/streaks         # Workout streaks
```

---

## 🔐 Authentication Flow

```
1. User signs up → POST /auth/signup
2. System creates user with hashed password (bcrypt)
3. JWT token generated
4. Token stored in localStorage (frontend)
5. Token sent in Authorization header: "Bearer <token>"
6. JwtAuthGuard validates token on protected routes
7. @CurrentUser() decorator injects user context
```

---

## 💾 Database Schemas

### Key Tables
- **users** - User accounts
- **user_preferences** - User settings
- **exercises** - Exercise library
- **programs** - Training programs
- **workout_sessions** - Individual workouts
- **workout_exercises** - Exercises in a workout (junction)
- **sets** - Individual sets
- **user_metrics** - Weight, sleep, fatigue tracking
- **body_photos** - Progress photos
- **ai_conversations** - Coach conversations
- **achievements** - Badges and milestones

### Relations
```
User ──1──→ ∞─── WorkoutSession
User ──1──→ ∞─── Program
User ──1──→ ∞─── Achievement
Program ──1──→ ∞─── WorkoutSession
WorkoutSession ──1──→ ∞─── WorkoutExercise ──1──→ Exercise
WorkoutExercise ──1──→ ∞─── Set
```

---

## 🧪 Testing Strategy

### Unit Tests
```bash
cd backend
npm run test
npm run test:watch
npm run test:cov
```

### E2E Tests
```bash
npm run test:e2e
```

### Manual API Testing
```bash
# Using cURL
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Using Swagger UI
http://localhost:3001/api/docs
```

---

## 🚀 Deployment

### Development
```bash
docker-compose up
# All services start automatically
```

### Production

**Frontend (Vercel):**
```bash
npm run build
vercel deploy
```

**Backend (Railway/Render):**
```bash
docker build -t kavl-backend .
docker push your-registry/kavl-backend
# Deploy via Docker
```

**Database:**
- Use managed PostgreSQL (Railway, Supabase)
- Run migrations: `npx prisma migrate deploy`

---

## 📚 Important Files to Modify

### Backend
1. `src/main.ts` - App bootstrap
2. `src/app.module.ts` - Module configuration
3. `prisma/schema.prisma` - Database schema
4. `.env` - Environment variables

### Frontend
1. `app/layout.tsx` - Root layout
2. `app/(dashboard)/layout.tsx` - Dashboard layout
3. `lib/api.ts` - API client
4. `stores/auth.ts` - Auth state
5. `.env.local` - Frontend env vars

---

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check database is running
psql -U kavl_user -d kavl_db -c "SELECT 1"

# Reset database
npx prisma migrate reset
```

### Port Already in Use
```bash
# Change port in .env
PORT=3002

# Or kill process
lsof -ti:3001 | xargs kill -9
```

### JWT Token Invalid
```bash
# Regenerate token
POST /auth/refresh-token
```

### CORS Error
```bash
# Update CORS_ORIGIN in backend .env
CORS_ORIGIN=http://localhost:3000
```

---

## 📖 Documentation

- **API Docs**: http://localhost:3001/api/docs (Swagger)
- **Database**: See `prisma/schema.prisma`
- **Architecture**: See `KAVL_ARCHITECTURE.md`
- **PRD**: See `KAVL_PRD_COMPLET.md`

---

## 🎓 Learning Resources

- [NestJS Docs](https://docs.nestjs.com)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org/docs)

---

## 📋 Checklist Before Production

- [ ] All tests passing
- [ ] No console errors
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Rate limiting enabled
- [ ] Error logging setup
- [ ] Security headers added
- [ ] HTTPS enabled
- [ ] Database backups configured
- [ ] Monitoring setup
- [ ] Documentation updated
- [ ] Performance optimized

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/feature-name`
2. Make changes and test
3. Commit: `git commit -am 'Add feature'`
4. Push: `git push origin feature/feature-name`
5. Create Pull Request

---

## 📞 Support

For issues or questions:
1. Check the documentation
2. Review GitHub issues
3. Create a new issue with details

---

## 📜 License

MIT License - See LICENSE file

---

## 🎉 Next Steps

1. **Now**: Run `docker-compose up` to start all services
2. **Next**: Create frontend pages for authentication
3. **Then**: Build the workout tracking interface
4. **Finally**: Implement the Smart Weekly Planner

---

**Happy coding! 🚀**

For updates and progress, see the roadmap file or check GitHub discussions.

---

*KAVL: Your AI-powered fitness coach*
