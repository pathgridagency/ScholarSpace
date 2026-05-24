# ScholarSpace

Student Collaboration Platform — a Super App for university students.
Consolidates networking, group project management, virtual co-studying, and a peer-to-peer marketplace.

## Structure

```
ScholarSpace/
├── backend/       Express + Prisma API (PostgreSQL)
│   ├── prisma/    Schema, migrations, seed
│   └── src/       Routes, middleware, lib
├── frontend/      Next.js App Router (Supabase client)
│   ├── app/       Pages and layouts
│   └── utils/     Supabase server/client/middleware helpers
├── AGENTS.md
└── opencode.json
```

## Commands

### Backend
- `cd backend && npm run dev` — Start Express API on :3000
- `cd backend && npx prisma db push` — Push schema to database
- `cd backend && node prisma/seed.js` — Seed universities

### Frontend
- `cd frontend && npm run dev` — Start Next.js on :3000
