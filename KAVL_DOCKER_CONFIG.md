# docker-compose.yml - Local Development Setup
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: kavl_postgres
    environment:
      POSTGRES_USER: kavl_user
      POSTGRES_PASSWORD: kavl_password
      POSTGRES_DB: kavl_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U kavl_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache (optional but recommended)
  redis:
    image: redis:7-alpine
    container_name: kavl_redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # NestJS Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: kavl_backend
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://kavl_user:kavl_password@postgres:5432/kavl_db
      JWT_SECRET: dev-secret-key-change-in-production
      JWT_EXPIRES_IN: 7d
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      CORS_ORIGIN: http://localhost:3000
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./backend/src:/app/src
    command: npm run start:dev

volumes:
  postgres_data:
    driver: local

# ---

# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 3001

# Start
CMD ["npm", "run", "start:prod"]

# ---

# backend/.env.example
# Database
DATABASE_URL="postgresql://kavl_user:kavl_password@localhost:5432/kavl_db"

# JWT
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"

# Anthropic
ANTHROPIC_API_KEY="sk-ant-..."

# App
NODE_ENV="development"
PORT=3001

# CORS
CORS_ORIGIN="http://localhost:3000"

# ---

# backend/.gitignore
# Dependencies
node_modules/
package-lock.json

# Environment
.env
.env.local
.env.*.local

# Build output
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Logs
logs/
*.log
npm-debug.log*

# OS
.DS_Store
.AppleDouble
.LSOverride

# Test coverage
coverage/
.nyc_output/

# Prisma
.env*.local
prisma/migrations/
!prisma/migrations/.gitkeep

# Cache
.eslintcache

# ---

# backend/tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2021",
    "lib": ["ES2021"],
    "declaration": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "allowJs": true,
    "forceConsistentCasingInFileNames": true,
    "strict": false,
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}

# ---

# backend/nest-cli.json
{
  "language": "ts",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "webpack": true,
    "webpackConfigFactory": "webpack.factory",
    "plugins": ["@nestjs/swagger/plugin"]
  }
}

# ---

# backend/.eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};

# ---

# backend/.prettierrc
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 80,
  "useTabs": false,
  "tabWidth": 2,
  "semi": true
}
