# ecommerce-shop Local Dev Setup

This workspace includes an EMI system with async PDF generation and file scanning.

## Local services

Use Docker Compose to run Redis and ClamAV for local development.

```bash
docker compose up -d
```

This starts:
- `redis` on `localhost:6379`
- `clamd` on `localhost:3310`

## Environment variables

Use these values in your `.env` file for local development:

```env
# Redis queue for async PDF jobs
REDIS_URL=redis://localhost:6379

# ClamAV daemon for scanning uploads
CLAMD_HOST=localhost
CLAMD_PORT=3310
SKIP_CLAMAV=false

# Optional Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Optional S3 direct upload
AWS_S3_BUCKET=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# Email notification
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
ADMIN_EMAIL=xpcbuilders@gmail.com
```

## Run the app

Install dependencies if needed, then start the app:

```bash
cd server
npm install
cd ../client
npm install
cd ..
npm run dev
```

## Additional commands

Stop the services:

```bash
docker compose down
```

If you need to skip ClamAV during development:

```bash
SKIP_CLAMAV=true npm run dev
```
