# Resend Email Configuration

## Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com) and sign up
2. Get your API key from the dashboard

## Step 2: Add Domain

1. Go to **Domains** in the Resend dashboard
2. Click **Add Domain**
3. Enter: `uddit.site`

## Step 3: Configure DNS Records

Add these records to your DNS provider:

### SPF Record (Required)
```
Type: TXT
Name: @ (or leave empty)
Value: v=spf1 include:_spf.resend.com ~all
```

### DKIM Records (Required)
Resend will provide 3 DKIM records. Add all of them:

```
Type: CNAME
Name: resend._domainkey
Value: [provided by Resend]

Type: CNAME
Name: resend2._domainkey
Value: [provided by Resend]

Type: CNAME
Name: resend3._domainkey
Value: [provided by Resend]
```

### DMARC Record (Recommended)
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:your@email.com
```

## Step 4: Verify Domain

1. Wait for DNS propagation (can take up to 48 hours, usually 15-30 minutes)
2. Click **Verify** in Resend dashboard
3. Domain status should change to **Verified**

## Step 5: Update Backend Configuration

Add your API key to the backend environment:

```bash
# backend/.env
RESEND_API_KEY=re_your_api_key_here
```

## Sender Email Options

After verification, you can send from any address at your domain:

- `newsletter@uddit.site` (recommended)
- `noreply@uddit.site`
- `hello@uddit.site`

Update the sender in `backend/src/services/email.ts` if needed:

```typescript
const FROM_EMAIL = 'Newsletter <newsletter@uddit.site>';
```

## Testing

Send a test email using Resend's API playground or curl:

```bash
curl -X POST 'https://api.resend.com/emails' \
  -H 'Authorization: Bearer re_your_api_key' \
  -H 'Content-Type: application/json' \
  -d '{
    "from": "Newsletter <newsletter@uddit.site>",
    "to": "your@email.com",
    "subject": "Test Email",
    "html": "<p>This is a test email.</p>"
  }'
```

## Troubleshooting

### Emails not sending
- Check API key is correct
- Verify domain is verified in Resend dashboard
- Check Resend logs for errors

### Emails going to spam
- Ensure DKIM and SPF records are correct
- Add DMARC record
- Send from a professional domain (not free email)

### DNS not propagating
- Use [dnschecker.org](https://dnschecker.org) to verify records
- Wait longer (up to 48 hours)
- Check for typos in record values
