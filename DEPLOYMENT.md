# Deployment Guide - Metapharsic Life Sciences CRM

This guide covers deploying the application to production environments.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Deployment Options](#deployment-options)
   - [Docker](#docker)
   - [Cloud Run (GCP)](#cloud-run-gcp)
   - [AWS Elastic Beanstalk](#aws-elastic-beanstalk)
   - [Azure App Service](#azure-app-service)
   - [Traditional VPS](#traditional-vps)
4. [Database Migration](#database-migration)
5. [SSL/TLS Setup](#ssltls-setup)
6. [Monitoring & Logging](#monitoring--logging)
7. [Backup & Recovery](#backup--recovery)
8. [Security Checklist](#security-checklist)
9. [Scaling Considerations](#scaling-considerations)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js**: 18+ LTS
- **npm**: 9+
- **Git**
- **Database**: PostgreSQL 14+ or MongoDB 6+ (production)
- **Domain name** (optional but recommended)

---

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root:

```bash
# ============================================
# PRODUCTION CONFIGURATION
# ============================================

# Application
NODE_ENV=production
PORT=3000
APP_URL=https://yourdomain.com

# Database (choose one)
# PostgreSQL
DATABASE_URL=postgresql://username:password@localhost:5432/metapharsic_db

# MongoDB
MONGODB_URI=mongodb://username:password@localhost:27017/metapharsic

# Google OAuth (optional - disable if not using)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
VITE_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID

# Gemini AI API (optional - disable if not using)
GEMINI_API_KEY=your-gemini-api-key
VITE_GEMINI_API_KEY=$GEMINI_API_KEY

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@metapharsic.com
SMTP_PASS=your-app-password

# Session Secret (for production auth)
SESSION_SECRET=generate-a-strong-random-secret-here

# Redis (optional - for caching/sessions)
REDIS_URL=redis://localhost:6379

# Logging
LOG_LEVEL=info
```

### Generate Session Secret

```bash
# Linux/macOS
openssl rand -base64 64

# Windows (PowerShell)
[Convert]::ToBase64String((1..64 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## Deployment Options

### Docker

#### 1. Create Dockerfile (if not present)

The project doesn't have a Dockerfile yet. Create `Dockerfile`:

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache tzdata

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY server.ts ./
COPY src/services/api.ts ./src/services/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE 3000

# Environment
ENV NODE_ENV=production

# Start server
CMD ["node", "server.ts"]
```

#### 2. Create docker-compose.yml (with database)

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@db:5432/metapharsic
      - REDIS_URL=redis://redis:6379
      - APP_URL=https://yourdomain.com
    depends_on:
      - db
      - redis
    volumes:
      - ./uploads:/app/uploads
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=metapharsic
      - POSTGRES_PASSWORD=secure_password_here
      - POSTGRES_DB=metapharsic_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U metapharsic"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    networks:
      - app-network
    command: redis-server --requirepass your_redis_password

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
```

#### 3. Build and Run

```bash
# Build image
docker build -t metapharsic-crm .

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f app
```

---

### Cloud Run (GCP)

#### 1. Prepare for Cloud Run

Update `Dockerfile` (Cloud Run needs specific port handling):

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY server.ts ./
COPY src/services/api.ts ./src/services/

# Cloud Run expects port 8080
ENV PORT=8080
EXPOSE 8080

CMD ["node", "server.ts"]
```

#### 2. Deploy

```bash
# Install gcloud CLI if not installed
# https://cloud.google.com/sdk/docs/install

# Set project
gcloud config set project your-project-id

# Build and push
gcloud builds submit --tag gcr.io/your-project-id/metapharsic-crm

# Deploy to Cloud Run
gcloud run deploy metapharsic-crm \
  --image gcr.io/your-project-id/metapharsic-crm \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production,DATABASE_URL=postgresql://...,APP_URL=https://yourdomain.com"

# Custom domain (optional)
gcloud run domain-mappings add --service metapharsic-crm --domain yourdomain.com
```

#### 3. Database Setup on Cloud SQL

```bash
# Create PostgreSQL instance
gcloud sql instances create metapharsic-db \
  --database-version=POSTGRES_15 \
  --cpu=2 \
  --memory=4Gi \
  --region=us-central1 \
  --root-password=your_root_password

# Create database
gcloud sql databases create metapharsic_db --instance=metapharsic-db

# Connect connection string to Cloud Run env var
gcloud run services update metapharsic-crm \
  --update-env-vars DATABASE_URL=$(gcloud sql instances describe metapharsic-db --format="value(connectionName)")
```

---

### AWS Elastic Beanstalk

#### 1. Initialize EB CLI

```bash
# Install EB CLI
pip install awsebcli

# Initialize in project
cd metapharsic-crm
eb init -p node.js metapharsic-crm
```

#### 2. Create `.ebextensions/01-env.config`

```yaml
option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    DATABASE_URL: postgresql://...
    APP_URL: https://yourdomain.com
    PORT: 8080

  aws:elasticbeanstalk:container:nodejs:
    NodeVersion: 18.x
    ProxyServer: nginx

  aws:elasticbeanstalk:cloudwatch:logs:
    StreamLogs: true
    RetentionInDays: 14
```

#### 3. Deploy

```bash
eb create production
eb deploy
eb open
```

---

### Azure App Service

#### 1. Prepare Azure Resources

```bash
# Create resource group
az group create --name metapharsic-rg --location eastus

# Create App Service plan
az appservice plan create --name metapharsic-plan --resource-group metapharsic-rg --sku B1 --is-linux

# Create Web App
az webapp create --name metapharsic-crm --resource-group metapharsic-rg --plan metapharsic-plan --runtime "NODE:18-lts"
```

#### 2. Configure Environment

```bash
# Set app settings
az webapp config appsettings set --name metapharsic-crm --resource-group metapharsic-rg \
  --settings \
    NODE_ENV=production \
    DATABASE_URL=postgresql://... \
    APP_URL=https://metapharsic-crm.azurewebsites.net \
    PORT=8080

# Deploy from GitHub
az webapp deployment source config --name metapharsic-crm --resource-group metapharsic-rg \
  --repo-url https://github.com/yourusername/metapharsic-crm \
  --branch main \
  --manual-integration
```

---

### Traditional VPS

#### 1. Server Setup (Ubuntu 22.04)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### 2. Configure PostgreSQL

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE metapharsic_db;
CREATE USER metapharsic_user WITH PASSWORD 'secure_password';
ALTER ROLE metapharsic_user SET client_encoding TO 'utf8';
GRANT ALL PRIVILEGES ON DATABASE metapharsic_db TO metapharsic_user;
\q
```

#### 3. Deploy Application

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/yourusername/metapharsic-crm.git
cd metapharsic-crm

# Install dependencies
npm ci --only=production

# Build frontend
npm run build

# Set environment
sudo nano .env
# Add your production environment variables

# Start with PM2
sudo pm2 start server.ts --name "metapharsic-crm" --interpreter node
sudo pm2 save
sudo pm2 startup  # Generate startup script
```

#### 4. Configure Nginx

```bash
# Create site config
sudo nano /etc/nginx/sites-available/metapharsic
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static assets (optional - if building separate frontend)
    # location /static/ {
    #     alias /var/www/metapharsic-crm/dist/;
    #     expires 1y;
    #     add_header Cache-Control "public, immutable";
    # }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/metapharsic /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Enable firewall
sudo ufw allow 'Nginx Full'
sudo ufw delete allow 'Nginx HTTP'
```

---

## Database Migration

### In-Memory → PostgreSQL

The current app uses in-memory store. To migrate:

#### 1. Create Migration Script

Create `scripts/migrate-to-postgres.ts`:

```typescript
import { Client } from 'pg';
import { data as inMemoryData } from '../server.ts';

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  await client.connect();

  // Create tables
  await client.query(`
    CREATE TABLE IF NOT EXISTS mrs (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      territory TEXT,
      base_salary INTEGER,
      daily_allowance INTEGER,
      joining_date DATE,
      phone VARCHAR(20),
      email VARCHAR(255) UNIQUE,
      status VARCHAR(20),
      performance_score INTEGER,
      total_sales INTEGER DEFAULT 0,
      targets_achieved INTEGER DEFAULT 0,
      targets_missed INTEGER DEFAULT 0,
      avatar_url TEXT,
      user_id INTEGER,
      role VARCHAR(20),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // Insert in-memory data
  for (const mr of inMemoryData.mrs) {
    await client.query(
      `INSERT INTO mrs (...) VALUES (...) ON CONFLICT (id) DO UPDATE SET ...`,
      [mr]
    );
  }

  await client.end();
  console.log('Migration complete');
}

migrate().catch(console.error);
```

#### 2. Update `server.ts` to Use Database

Replace in-memory `data` object with database queries:

```typescript
// Replace:
const data = { mrs: [...] };

// With:
const db = new Client({ connectionString: process.env.DATABASE_URL });
await db.connect();

// Example endpoint:
app.get('/api/mrs', async (req, res) => {
  const result = await db.query('SELECT * FROM mrs');
  res.json(result.rows);
});
```

---

## SSL/TLS Setup

### Let's Encrypt with Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain and install certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Cloud Providers

- **AWS ALB**: SSL termination in load balancer settings
- **GCP Cloud Run**: Automatic HTTPS with managed certificates
- **Azure App Service**: SSL binding in TLS/SSL settings

---

## Monitoring & Logging

### PM2 Monitoring

```bash
# Install PM2 monitoring
pm2 install pm2-logrotate
pm2 install pm2-server-monit

# View logs
pm2 logs metapharsic-crm --lines 100

# Monitor metrics
pm2 monit
```

### Application Insights (Azure)

Add to `server.ts`:

```typescript
import { ApplicationInsights } from '@microsoft/applicationinsights-web';

if (process.env.NODE_ENV === 'production') {
  const appInsights = new ApplicationInsights({
    config: {
      instrumentationKey: process.env.APPINSIGHTS_KEY,
    }
  });
  appInsights.loadAppInsights();
}
```

### Custom Logging

Create `src/utils/logger.ts`:

```typescript
export const logger = {
  info: (msg: string, meta?: any) => {
    if (process.env.NODE_ENV === 'production') {
      console.log(JSON.stringify({ level: 'info', message: msg, ...meta, timestamp: new Date().toISOString() }));
    } else {
      console.log(msg, meta);
    }
  },
  error: (msg: string, error?: Error) => {
    console.error(JSON.stringify({ level: 'error', message: msg, error: error?.message, stack: error?.stack, timestamp: new Date().toISOString() }));
  }
};
```

---

## Backup & Recovery

### Database Backups

#### PostgreSQL

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR=/backups/postgresql
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > $BACKUP_DIR/metapharsic_$DATE.sql
gzip $BACKUP_DIR/metapharsic_$DATE.sql

# Retain last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

Add to crontab (`crontab -e`):

```
0 2 * * * /var/www/metapharsic-crm/scripts/backup.sh
```

#### MongoDB

```bash
mongodump --uri="$MONGODB_URI" --out=/backups/mongodb/metapharsic_$(date +%Y%m%d)
```

### Restore

```bash
# PostgreSQL
gunzip -c backup.sql.gz | psql $DATABASE_URL

# MongoDB
mongorestore --uri="$MONGODB_URI" /backup/path/
```

---

## Security Checklist

- [ ] **HTTPS Only** - Redirect all HTTP to HTTPS
- [ ] **Security Headers** - Add CSP, HSTS, X-Frame-Options headers
- [ ] **Rate Limiting** - Implement on API endpoints (100 req/min)
- [ ] **Input Validation** - Validate all user inputs (already in place)
- [ ] **SQL Injection** - Use parameterized queries only
- [ ] **CORS** - Restrict to trusted domains
- [ ] **Environment Variables** - Never commit secrets
- [ ] **Dependency Updates** - Regular `npm audit` and updates
- [ ] **File Upload** - Scan for malware, restrict types
- [ ] **Authentication** - Strong passwords, session timeout
- [ ] **Logging** - Log security events (failed logins, etc.)
- [ ] **Backup Encryption** - Encrypt sensitive backup data
- [ ] **Firewall** - Only expose ports 80/443
- [ ] **Database Access** - Restrict to application server only

### Add Security Headers in `server.ts`

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## Scaling Considerations

### Horizontal Scaling

1. **Load Balancer** (AWS ELB, GCP LB, Nginx)
   - Distribute traffic across multiple app instances
   - SSL termination
   - Health checks

2. **Stateless Application**
   - Store sessions in Redis or database
   - Use JWT tokens instead of localStorage for production
   - File uploads → S3/GCS/Azure Blob Storage

3. **Database Connection Pooling**
   - Use `pgbouncer` for PostgreSQL
   - Configure connection pool size in app

4. **Caching Layer**
   - Redis for frequent queries (products, doctors)
   - CDN for static assets (images, JS bundles)

### Database Scaling

- **Read Replicas**: For reporting/analytics queries
- **Connection Pooling**: `pgbouncer` or `pgpool-II`
- **Indexing**: Add indexes on frequently queried columns (`mr_id`, `date`, `status`)
- **Partitioning**: Partition large tables by date (visits, sales)

### CDN Setup

```nginx
# In nginx config
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    # Or proxy to CDN:
    # proxy_pass https://cdn.yourdomain.com;
}
```

---

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to VPS via SSH
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          source: ".,!node_modules"
          target: "/var/www/metapharsic-crm"

      - name: SSH and restart
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/metapharsic-crm
            npm ci --only=production
            pm2 restart metapharsic-crm
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Find process using port 3000
sudo netstat -tulpn | grep :3000
sudo kill -9 <PID>

# Or change port in server.ts
const PORT = process.env.PORT || 3000;
```

#### 2. Database Connection Failed
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql $DATABASE_URL -c "SELECT 1"

# Verify credentials in .env
```

#### 3. Nginx 502 Bad Gateway
```bash
# Check if app is running
pm2 list
pm2 logs metapharsic-crm

# Test API directly
curl http://localhost:3000/api/mrs

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

#### 4. Memory Issues
```bash
# Check memory usage
free -h

# Increase Node.js memory limit
# In PM2 ecosystem file or systemd service
NODE_OPTIONS="--max-old-space-size=4096"
```

#### 5. SSL Certificate Issues
```bash
# Check certificate
sudo certbot certificates

# Renew manually if needed
sudo certbot renew --force-renewal

# Reload Nginx
sudo systemctl reload nginx
```

---

## Performance Optimization

1. **Frontend Build**:
   ```bash
   npm run build  # Already optimized with Vite
   ```

2. **Gzip Compression** (Nginx):
   ```nginx
   gzip on;
   gzip_vary on;
   gzip_min_length 1024;
   gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
   ```

3. **Image Optimization**:
   - Already compressing to 200px JPEG for uploads
   - Serve WebP format for modern browsers

4. **Database Optimization**:
   ```sql
   -- Add indexes
   CREATE INDEX idx_visits_mr_date ON doctor_visits(mr_id, visit_date);
   CREATE INDEX idx_sales_mr_date ON sales(mr_id, date);
   CREATE INDEX idx_attendance_mr_date ON attendance(mr_id, date);
   ```

---

## Rollback Procedure

```bash
# PM2 - rollback to previous version
pm2 deploy metapharsic-crm rollback

# GitHub Actions - revert commit
git revert <bad-commit-hash>
git push origin main

# Docker - pull previous image
docker pull metapharsic-crm:previous-tag
docker-compose up -d
```

---

## Support & Maintenance

- **Regular Updates**: Weekly `npm audit` and dependency updates
- **Database Maintenance**: `VACUUM` and `REINDEX` monthly on PostgreSQL
- **Log Rotation**: Already configured via PM2 logrotate (14 days)
- **Security Patching**: OS updates weekly: `sudo apt update && sudo apt upgrade`
- **Backup Verification**: Quarterly restore tests to ensure backups work

---

**End of DEPLOYMENT.md**
