# Newsletter System

A full-featured newsletter platform with email subscriptions, magic link authentication, comments, and likes.

## Architecture

```
newsletter/
├── backend/          # Express.js API (Cloud Run)
├── frontend/         # Next.js App (Vercel)
└── shared/           # Shared types and utilities
```

## Tech Stack

- **Backend**: Node.js, Express.js, Turso (SQLite), Resend
- **Frontend**: Next.js 14, React, TailwindCSS
- **Deployment**: Cloud Run (API), Vercel (Frontend)

## Quick Start

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (.env)
```
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your-token
RESEND_API_KEY=re_xxxxx
FRONTEND_URL=https://newsletter.uddit.site
API_URL=https://api.newsletter.uddit.site
SESSION_SECRET=your-random-secret-min-32-chars
NODE_ENV=production
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://api.newsletter.uddit.site
```

## Domain Configuration

- Frontend: `newsletter.uddit.site` (Vercel)
- API: `api.newsletter.uddit.site` (Cloud Run)

## Resend Configuration Required

1. Add domain `uddit.site` in Resend dashboard
2. Add DNS records (see RESEND_SETUP.md)
3. Verify domain
4. Use sender: `newsletter@uddit.site` or `noreply@uddit.site`
