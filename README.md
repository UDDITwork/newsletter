# Newsletter System

A full-featured newsletter platform with email subscriptions, magic link authentication, comments, and likes.

## Features

✅ Double opt-in email subscriptions
✅ Magic link passwordless authentication
✅ Comments with 1-level replies
✅ Like/unlike newsletters
✅ Unsubscribe functionality
✅ Beautiful UI with shadcn/ui
✅ **Auto-migrations** - No manual database setup needed!

## Architecture

```
newsletter/
├── backend/          # Express.js API (Cloud Run)
├── frontend/         # Next.js App (Vercel)
└── .github/          # CI/CD workflows
```

## Tech Stack

- **Backend**: Node.js, Express.js, Turso (SQLite), Resend
- **Frontend**: Next.js 14, React, TailwindCSS, shadcn/ui
- **Deployment**: Cloud Run (API), Vercel (Frontend)

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 2. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
TURSO_DATABASE_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your-token
RESEND_API_KEY=re_xxxxx
FRONTEND_URL=http://localhost:3000
SESSION_SECRET=your-random-secret-min-32-chars
NODE_ENV=development
PORT=8080
```

**Generate SESSION_SECRET:**
```bash
openssl rand -hex 32
```

### 3. Configure Resend Email (Required)

Follow [RESEND_SETUP.md](RESEND_SETUP.md) for detailed instructions:
- Add domain `uddit.site` in Resend
- Add DNS records (SPF, DKIM)
- Verify domain
- Get API key

### 4. Run the Application

**Database migrations run automatically on startup!**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit http://localhost:3000

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions.

### Quick Deploy Overview

1. **Backend to Cloud Run**: Push to `main` branch (auto-deploys via GitHub Actions)
2. **Frontend to Vercel**: Connect GitHub repo to Vercel (auto-deploys)
3. **Update vercel.json**: Add your Cloud Run URL

### Domain Configuration

- **Frontend**: `newsletter.uddit.site` → Vercel
- **API**: `newsletter.uddit.site/api/*` → Cloud Run (via Vercel rewrites)

## Database Migrations

**Automatic!** Migrations run every time the server starts. The system:
- Creates tables if they don't exist
- Ignores "already exists" errors
- Ensures your database is always up to date

No manual migration commands needed!

## Project Structure

```
newsletter/
├── backend/
│   ├── src/
│   │   ├── config/           # Environment validation
│   │   ├── db/
│   │   │   ├── client.ts     # Turso client
│   │   │   ├── schema.ts     # 8 tables
│   │   │   └── migrate.ts    # Auto-migration
│   │   ├── routes/
│   │   │   ├── auth.ts       # Magic link auth
│   │   │   ├── newsletter.ts # Subscribe/confirm
│   │   │   └── interactions.ts # Likes/comments
│   │   ├── services/
│   │   │   ├── email.ts      # Resend (4 templates)
│   │   │   └── auth.ts       # Session management
│   │   └── index.ts          # Server entry (runs migrations)
│   ├── Dockerfile
│   └── cloudbuild.yaml
│
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js pages
│   │   ├── components/
│   │   │   ├── ui/           # shadcn/ui
│   │   │   ├── subscribe-form.tsx
│   │   │   ├── comment-section.tsx
│   │   │   └── like-button.tsx
│   │   ├── hooks/
│   │   │   └── use-auth.tsx  # Auth context
│   │   └── lib/
│   │       └── api.ts        # API client
│   └── vercel.json           # API rewrites
│
└── .github/workflows/
    └── deploy-backend.yml    # Auto-deploy
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/newsletter/subscribe` | Subscribe with email |
| GET | `/api/newsletter/confirm/:token` | Confirm subscription |
| GET | `/api/newsletter/unsubscribe/:token` | Unsubscribe |
| POST | `/api/auth/login` | Request magic link |
| GET | `/api/auth/verify/:token` | Verify magic link |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/newsletters` | List newsletters |
| GET | `/api/newsletter/:slug` | Get newsletter |
| GET | `/api/newsletter/:slug/likes` | Get likes |
| POST | `/api/newsletter/:slug/likes` | Toggle like |
| GET | `/api/newsletter/:slug/comments` | Get comments |
| POST | `/api/newsletter/:slug/comments` | Add comment |

## Troubleshooting

### TypeScript Errors in IDE
Run `npm install` in both backend and frontend directories.

### Database Connection Errors
- Verify `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are correct
- Check Turso dashboard for connection issues

### Emails Not Sending
- Verify Resend domain is verified
- Check API key is correct
- See [RESEND_SETUP.md](RESEND_SETUP.md)

### CORS Issues
- Ensure `FRONTEND_URL` in backend matches your actual frontend URL
- Check cookies are working (HTTPS required in production)
