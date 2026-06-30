# KAVL Frontend - Setup Instructions

## Installation Complète du Frontend

### 1. Initialiser Next.js 14

```bash
cd ../frontend
npx create-next-app@latest . --typescript --tailwind --eslint --app
# Sélectionner les options standard (App Router, Tailwind, etc.)
```

### 2. Installer les dépendances

```bash
npm install

# HTTP Client
npm install axios

# State Management
npm install zustand

# UI Components
npm install @radix-ui/react-dropdown-menu @radix-ui/react-dialog
npm install class-variance-authority clsx tailwind-merge

# Data Fetching & Caching
npm install @tanstack/react-query

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# Icons
npm install lucide-react

# Utils
npm install date-fns js-cookie

# Dev dependencies
npm install -D @types/js-cookie
npm install -D @tailwindcss/forms
npm install -D prettier eslint-config-prettier
```

### 3. Créer .env.local

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_ENV=development
EOF
```

---

## Frontend Architecture

```
app/
├── (auth)/
│   ├── signin/
│   │   └── page.tsx
│   ├── signup/
│   │   └── page.tsx
│   └── layout.tsx
│
├── (dashboard)/
│   ├── layout.tsx
│   ├── page.tsx                    # Home/Dashboard
│   ├── workouts/
│   │   ├── page.tsx                # List
│   │   ├── [id]/
│   │   │   └── page.tsx            # Detail/In Progress
│   │   └── new/
│   │       └── page.tsx            # Start new
│   ├── programs/
│   │   ├── page.tsx
│   │   ├── [id]/page.tsx
│   │   └── new/page.tsx
│   ├── stats/
│   │   ├── page.tsx
│   │   └── [exerciseId]/page.tsx
│   ├── profile/
│   │   └── page.tsx
│   └── ai-coach/
│       ├── page.tsx
│       └── [conversationId]/page.tsx
│
├── api/
│   └── health/route.ts
│
└── layout.tsx

components/
├── ui/
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   └── ...
├── common/
│   ├── header.tsx
│   ├── sidebar.tsx
│   ├── footer.tsx
│   └── loading-spinner.tsx
├── workout/
│   ├── workout-card.tsx
│   ├── exercise-form.tsx
│   ├── set-logger.tsx
│   └── workout-summary.tsx
├── stats/
│   ├── pr-list.tsx
│   ├── progress-chart.tsx
│   └── heatmap.tsx
└── auth/
    ├── signup-form.tsx
    └── signin-form.tsx

lib/
├── api.ts                  # Axios instance
├── auth.ts                 # Auth utilities
├── utils.ts                # Helper functions
└── hooks.ts                # Custom hooks

stores/
├── auth.ts                 # Auth state
├── workout.ts              # Workout state
└── ui.ts                   # UI state

types/
└── index.ts                # Global types

public/
└── ...
```

---

## Key Frontend Files

### lib/api.ts

```typescript
import axios from 'axios';
import { getToken } from './auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### stores/auth.ts (Zustand)

```typescript
import { create } from 'zustand';

interface AuthStore {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: any, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  setAuth: (user, token) =>
    set({ user, token, isAuthenticated: true }),
  clearAuth: () =>
    set({ user: null, token: null, isAuthenticated: false }),
}));
```

### types/index.ts

```typescript
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  height?: number;
  weight?: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  goals: string[];
  injuries: string[];
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscleGroups: string[];
  category: string;
  equipment: string[];
  videoUrl?: string;
  gifUrl?: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  name: string;
  plannedDate: string;
  completedAt?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
  exercises: WorkoutExercise[];
  notes?: string;
}

export interface WorkoutExercise {
  id: string;
  workoutSessionId: string;
  exerciseId: string;
  exercise: Exercise;
  sets: Set[];
}

export interface Set {
  id: string;
  setNumber: number;
  targetReps?: number;
  actualReps?: number;
  weight?: number;
  rpe?: number;
  completed: boolean;
}

export interface Program {
  id: string;
  name: string;
  description?: string;
  createdBy?: string;
  isPublic: boolean;
  difficulty: string;
}
```

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'api.example.com'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;
```

### tailwind.config.ts

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        secondary: '#ffffff',
        accent: '#3b82f6',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

export default config;
```

### .env.local.example

```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_ENV=development
```

### .gitignore

```
# Next.js
.next/
out/
build/

# Dependencies
node_modules/
package-lock.json
yarn.lock

# Environment
.env.local
.env*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
.AppleDouble
.LSOverride

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
.nyc_output/
coverage/
```

---

## Start Commands

```bash
# Development
npm run dev
# Visit http://localhost:3000

# Build
npm run build

# Production
npm run start
```

Ready to build the UI components!
