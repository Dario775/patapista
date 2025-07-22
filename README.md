
# PATAPISTA

Proyecto monorepo con frontend (Next.js) y backend (Express + Prisma).

## Requisitos
- Node.js 18+
- pnpm (o npm/yarn)
- PostgreSQL

## Puesta en marcha rápida

```bash
git clone <repo>
cd patapista

# Backend
cd backend
pnpm install
cp .env.example .env
pnpm migrate           # prisma migrate dev
pnpm dev

# Frontend
cd ../frontend
pnpm install
pnpm dev
```

Visita http://localhost:3000 para ver la interfaz y http://localhost:4000 para la API.
