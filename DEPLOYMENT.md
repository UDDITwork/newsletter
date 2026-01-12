# Deployment Guide

## Prerequisites

1. Google Cloud account with billing enabled
2. Vercel account
3. GitHub account
4. Turso database (already set up)
5. Resend account with verified domain

---

## Step 1: Set Up Google Cloud

### 1.1 Create Project
```bash
gcloud projects create newsletter-project
gcloud config set project newsletter-project
```

### 1.2 Enable APIs
```bash
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 1.3 Create Service Account
```bash
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions"

# Grant permissions
gcloud projects add-iam-policy-binding newsletter-project \
  --member="serviceAccount:github-actions@newsletter-project.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding newsletter-project \
  --member="serviceAccount:github-actions@newsletter-project.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding newsletter-project \
  --member="serviceAccount:github-actions@newsletter-project.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding newsletter-project \
  --member="serviceAccount:github-actions@newsletter-project.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 1.4 Create Service Account Key
```bash
gcloud iam service-accounts keys create key.json \
  --iam-account github-actions@newsletter-project.iam.gserviceaccount.com
```

### 1.5 Store Secrets in Secret Manager
```bash
echo -n "your-turso-url" | gcloud secrets create TURSO_DATABASE_URL --data-file=-
echo -n "your-turso-token" | gcloud secrets create TURSO_AUTH_TOKEN --data-file=-
echo -n "your-resend-key" | gcloud secrets create RESEND_API_KEY --data-file=-
echo -n "your-32-char-secret" | gcloud secrets create SESSION_SECRET --data-file=-
echo -n "https://newsletter.uddit.site" | gcloud secrets create FRONTEND_URL --data-file=-

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding TURSO_DATABASE_URL \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
# Repeat for other secrets...
```

---

## Step 2: Deploy Backend (First Time)

### Manual deploy to get Cloud Run URL:

```bash
cd backend
npm install
npm run build

# Build and push image
docker build -t gcr.io/newsletter-project/newsletter-api:v1 .
docker push gcr.io/newsletter-project/newsletter-api:v1

# Deploy
gcloud run deploy newsletter-api \
  --image gcr.io/newsletter-project/newsletter-api:v1 \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets "TURSO_DATABASE_URL=TURSO_DATABASE_URL:latest,TURSO_AUTH_TOKEN=TURSO_AUTH_TOKEN:latest,RESEND_API_KEY=RESEND_API_KEY:latest,SESSION_SECRET=SESSION_SECRET:latest,FRONTEND_URL=FRONTEND_URL:latest"
```

Note the Cloud Run URL (e.g., `https://newsletter-api-xxxxx-uc.a.run.app`)

---

## Step 3: Run Database Migrations

```bash
cd backend
TURSO_DATABASE_URL=your-url TURSO_AUTH_TOKEN=your-token npm run db:migrate
```

---

## Step 4: Set Up GitHub Repository

### 4.1 Create Repository
```bash
git init
git add .
git commit -m "Initial commit"
gh repo create newsletter --public --source=. --push
```

### 4.2 Add GitHub Secrets
Go to Settings > Secrets and variables > Actions:

| Secret | Value |
|--------|-------|
| `GCP_PROJECT_ID` | `newsletter-project` |
| `GCP_SA_KEY` | Contents of `key.json` |

---

## Step 5: Deploy Frontend to Vercel

### 5.1 Update vercel.json
Update `frontend/vercel.json` with your Cloud Run URL:

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://newsletter-api-xxxxx-uc.a.run.app/api/:path*"
    }
  ]
}
```

### 5.2 Deploy to Vercel
```bash
cd frontend
npm install -g vercel
vercel
```

Or connect via Vercel Dashboard:
1. Import from GitHub
2. Set Root Directory to `frontend`
3. Framework: Next.js
4. Deploy

### 5.3 Configure Custom Domain
1. Go to Vercel Dashboard > Your Project > Settings > Domains
2. Add `newsletter.uddit.site`
3. Add DNS record:
   ```
   Type: CNAME
   Name: newsletter
   Value: cname.vercel-dns.com
   ```

---

## Step 6: Verify Deployment

### Test Backend
```bash
curl https://newsletter-api-xxxxx-uc.a.run.app/api/health
```

### Test Frontend
Visit `https://newsletter.uddit.site`

### Test Full Flow
1. Subscribe with email
2. Check for confirmation email
3. Click confirmation link
4. Login with magic link
5. View newsletter and add comment

---

## Ongoing Deployments

### Backend (Automatic)
Push to `main` branch triggers GitHub Actions workflow.

### Frontend (Automatic)
Push to `main` branch triggers Vercel deployment.

### Manual Backend Deploy
```bash
cd backend
docker build -t gcr.io/newsletter-project/newsletter-api:v2 .
docker push gcr.io/newsletter-project/newsletter-api:v2
gcloud run deploy newsletter-api --image gcr.io/newsletter-project/newsletter-api:v2 --region us-central1
```

---

## Troubleshooting

### CORS Issues
Verify `FRONTEND_URL` in Cloud Run matches your actual frontend URL.

### Cookies Not Working
- Ensure both frontend and API use HTTPS
- Check `sameSite` and `secure` cookie settings

### Database Errors
```bash
# Check logs
gcloud run logs read newsletter-api --limit=50
```

### Email Not Sending
- Verify Resend domain is verified
- Check API key is correct
- Check Resend dashboard for errors
