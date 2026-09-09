# Invicly Flow — Web

**Plan. Focus. Get Things Done.**

The Next.js application for **Invicly Flow**, by Invicly Technologies. This app is both the web frontend and the versioned REST API (`/api/v1`) consumed by [IN_Flow_Mobile](../IN_Flow_Mobile) — the mobile app never talks to PostgreSQL directly, only to this API.

This repository is developed as a submodule of the umbrella [`IN_Flow`](https://github.com/invicly/IN_Flow) repo, but is a fully independent, self-contained application — it can be cloned, installed, and run entirely on its own.

## Stack

Next.js (App Router) · TypeScript (strict) · Tailwind CSS · shadcn/ui · Lucide Icons · TanStack Query · React Hook Form · Zod · Prisma · PostgreSQL

## Getting started

```bash
npm install
cp .env.example .env      # fill in DATABASE_URL and JWT secrets
npx prisma migrate dev
npm run dev
```

Then visit `http://localhost:3000`.

## Project layout

```
src/
├── app/            App Router pages + /api/v1 route handlers
├── components/     Shared UI (states, providers, shadcn primitives in components/ui)
├── features/       Feature-based modules — each with services/ (business logic) and
│                   repositories/ (Prisma data access); routes stay thin controllers
├── hooks/          Shared React hooks (TanStack Query wrappers, etc.)
├── lib/            Cross-cutting utilities: prisma client, jwt, password hashing,
│                   api-response envelope, design-tokens (single source of color truth)
├── types/          Shared TypeScript types / DTOs
└── validations/    Zod schemas, one per domain
prisma/
└── schema.prisma   Full data model — see docs in the parent IN_Flow repo
```

## Engineering rules

- TypeScript strict mode; Zod validation at every input boundary
- No business logic in route handlers or UI components — it lives in `features/*/services`
- Data access goes through `features/*/repositories`, never raw Prisma calls scattered around
- Every workspace-scoped query is authorized against the caller's membership
- Colors always come from `src/lib/design-tokens.ts` — never hardcoded in components
- Database credentials never reach a client bundle

## API

Base path `/api/v1`. See the parent repo's `docs/API_SPEC.md` for the full contract. Currently implemented:

```
POST /auth/register
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

## Testing

```bash
npm run typecheck
npm run lint
npm test
```

## Brand tokens

Centralized in `src/lib/design-tokens.ts`: primary `#6D3DF5`, blue `#315CFF`, cyan `#19C8E8`, dark `#0B1424`, background `#F7F9FC`, success `#10B981`, warning `#F59E0B`, danger `#EF4444`.
