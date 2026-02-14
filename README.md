# Medico — Medical Platform

> A unified medical platform that lets patients book care, upload records, and manage their health, while doctors, clinics, labs, and hospitals run their entire workflow digitally.

## 🏗️ Project Structure

```
medico/
├── apps/
│   ├── backend/          # Node.js + Express + Prisma API
│   ├── mobile/           # React Native + Expo mobile app
│   └── web/              # Next.js admin dashboard
├── packages/
│   ├── shared/           # Shared types and utilities
│   └── ui/               # Shared UI components (future)
├── docs/                 # Documentation
└── turbo.json            # Turborepo configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 15+

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd medico

# Install dependencies
npm install

# Set up environment variables
cp apps/backend/.env.example apps/backend/.env
# Edit .env with your database URL

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database
npm run db:seed
```

### Development

```bash
# Run all apps in development mode
npm run dev

# Run specific app
npm run dev --filter=@medico/backend
npm run dev --filter=@medico/mobile
npm run dev --filter=@medico/web
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps in dev mode |
| `npm run build` | Build all apps |
| `npm run lint` | Lint all apps |
| `npm run test` | Run all tests |
| `npm run format` | Format code with Prettier |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run database migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio |

## 📱 Apps

### Backend (`apps/backend`)
- Node.js with Express
- Prisma ORM with PostgreSQL
- JWT authentication
- RESTful API

### Mobile (`apps/mobile`)
- React Native with Expo
- TypeScript
- React Navigation
- Zustand for state management

### Web (`apps/web`)
- Next.js 14 with App Router
- TypeScript
- Server Components
- Admin dashboard

## 📦 Packages

### Shared (`packages/shared`)
- TypeScript types
- Validation schemas
- Common utilities
- API response types

## 📚 Documentation

- [App Screens](docs/app-screens.md) — Complete screen inventory
- [Database Schema](docs/database-schema.md) — Prisma schema reference
- [Master Roadmap](docs/master-roadmap.md) — Development phases
- [Business Logic](docs/business-logic.md) — Algorithm reference

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL, Prisma |
| Mobile | React Native, Expo |
| Web | Next.js 14, React |
| State | Zustand |
| Styling | Tailwind CSS |
| Validation | Zod |
| Auth | JWT, bcrypt |

## 📄 License

Private — All rights reserved.
"# Medico" 
