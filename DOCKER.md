# 🐳 Docker Setup Guide

Complete guide for running AI Research Agent with Docker and Inngest.

---

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space
- Inngest account (free at https://www.inngest.com/)

**Install Docker:**
- **Windows/Mac:** [Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Linux:** `curl -fsSL https://get.docker.com | sh`

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/vectorMindsAI/vectorMindsAI-v0.git
cd vectorMindsAI-v0
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.template .env.local

# Edit with your credentials
nano .env.local  # or use your preferred editor
```

**Minimum Required Variables:**
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `INNGEST_EVENT_KEY` - Get from https://www.inngest.com/
- `INNGEST_SIGNING_KEY` - Get from https://www.inngest.com/

**Note:** API keys (Groq, Tavily, etc.) are provided by users through the UI, not environment variables. This is a **Bring Your Own Key (BYOK)** application.

### 3. Set Up Inngest

#### Option A: Using Inngest Cloud (Recommended for Production)
```bash
# 1. Sign up at https://www.inngest.com/
# 2. Create a new app
# 3. Copy Event Key and Signing Key to .env.local
# 4. Set INNGEST_DEV=false in .env.local
```

#### Option B: Using Inngest Dev Server (Recommended for Development)
```bash
# Install Inngest CLI
npm install -g inngest-cli

# In a separate terminal, start Inngest dev server
npx inngest-cli@latest dev

# Set in .env.local:
# INNGEST_DEV=true
# INNGEST_EVENT_KEY=your-dev-key
# INNGEST_SIGNING_KEY=your-dev-signing-key
```

### 4. Start Services
```bash
# Start in production mode (port 3002)
docker-compose up -d

# View logs
docker-compose logs -f app
```

### 5. Access Application
- **App:** http://localhost:3002
- **MongoDB:** localhost:27017
- **Inngest Dashboard:** https://app.inngest.com/ (or http://localhost:8288 for dev server)

---

## 🛠️ Development Mode

### Start with Hot Reload
```bash
# Start development environment (port 3001)
docker-compose --profile dev up -d

# Development app on port 3001 with hot reload
# Production app on port 3002 (if running)
# MongoDB on port 27017
```

### Development with Inngest Dev Server
```bash
# Terminal 1: Start Docker services
docker-compose --profile dev up -d

# Terminal 2: Start Inngest Dev Server
npx inngest-cli@latest dev

# Terminal 3: (Optional) Watch logs
docker-compose logs -f app-dev
```

The Inngest Dev Server provides:
- 🎯 Local testing without cloud deployment
- 📊 Real-time function execution monitoring
- 🐛 Debugging tools for background jobs
- 🔄 Automatic function registration

### Watch Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f app-dev
docker-compose logs -f mongodb
```

---

## 🏗️ Build Options

### Build Production Image
```bash
# Build only
docker-compose build app

# Build without cache
docker-compose build --no-cache app

# Build specific stage
docker build --target runner -t ai-research:prod .
```

### Build Development Image
```bash
docker-compose build app-dev
```

---

## 📦 Available Services

### Production Stack
```bash
docker-compose up -d
```
**Services:**
- `app` - Next.js application (port 3002)
- `mongodb` - Database (port 27017)

**Requires:**
- Valid Inngest credentials (INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY)
- API keys (GROQ_API_KEY, TAVILY_API_KEY)
- NEXTAUTH_SECRET

### Development Stack
```bash
docker-compose --profile dev up -d
```
**Additional Services:**
- `app-dev` - Development server with hot reload (port 3001)

**Note:** Development mode works best with Inngest Dev Server running locally.

---

## 🎯 Inngest Integration

### What is Inngest?
Inngest handles background jobs and workflows for:
- Research flow execution
- Extended research sessions
- Vector embeddings processing
- Agent plan execution

### Environment Variables
```bash
# Required for Inngest
INNGEST_EVENT_KEY=your-event-key
INNGEST_SIGNING_KEY=your-signing-key
INNGEST_DEV=true  # false for production
```

### Development Setup
```bash
# Option 1: Inngest Dev Server (Recommended)
npx inngest-cli@latest dev

# Then start Docker
docker-compose --profile dev up -d

# Access Inngest dashboard at: http://localhost:8288
```

### Production Setup
```bash
# 1. Sign up at https://www.inngest.com/
# 2. Create an app and get credentials
# 3. Add credentials to .env.local
# 4. Set INNGEST_DEV=false
# 5. Deploy your app

# Inngest will automatically sync functions from:
# http://your-domain.com/api/inngest
```

### Verifying Inngest Connection
```bash
# Check app logs for Inngest registration
docker-compose logs app | grep inngest

# Should see:
# "Inngest functions registered successfully"
```

---

## 🔧 Common Commands

### Container Management
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

### Service Control
```bash
# Start specific service
docker-compose up -d mongodb

# Stop specific service
docker-compose stop app

# Restart specific service
docker-compose restart app
```

### Logs & Debugging
```bash
# View all logs
docker-compose logs

# Follow logs
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100 app

# View MongoDB logs
docker-compose logs mongodb
```

### Execute Commands
```bash
# Shell into app container
docker-compose exec app sh

# Shell into MongoDB
docker-compose exec mongodb mongosh

# Run npm commands
docker-compose exec app npm run build
```

---

## 🔍 Health Checks

### Check Service Status
```bash
# View container health
docker-compose ps

# Detailed health info
docker inspect ai-research-app | grep -A 10 Health
```

### Test Endpoints
```bash
# App health (when endpoint exists)
curl http://localhost:3000/api/health

# MongoDB connection
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
```

---

## 💾 Data Management

### Backup MongoDB
```bash
# Create backup
docker-compose exec mongodb mongodump \
  --username admin \
  --password password123 \
  --authenticationDatabase admin \
  --out /data/backup

# Copy backup to host
docker cp ai-research-mongodb:/data/backup ./backup
```

### Restore MongoDB
```bash
# Copy backup to container
docker cp ./backup ai-research-mongodb:/data/backup

# Restore
docker-compose exec mongodb mongorestore \
  --username admin \
  --password password123 \
  --authenticationDatabase admin \
  /data/backup
```

### Clear Data
```bash
# Remove all data (⚠️ destructive)
docker-compose down -v

# Remove MongoDB data only
docker volume rm ai-research-mongodb-data
```

---

## 🌐 Environment Variables

### Required Variables
```env
MONGODB_URI=mongodb://admin:password123@mongodb:27017/ai-research?authSource=admin
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

### API Keys
```env
# Required for Infrastructure
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
INNGEST_EVENT_KEY=your-inngest-event-key
INNGEST_SIGNING_KEY=your-inngest-signing-key
INNGEST_DEV=true  # false in production

# Optional Analytics
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

**Note:** Research API keys (Groq, Tavily, OpenAI, etc.) are provided by users through the dashboard UI. This is a **BYOK (Bring Your Own Key)** application where each user provides their own API credentials.

### Override in docker-compose
```yaml
services:
  app:
    environment:
      - INNGEST_EVENT_KEY=${INNGEST_EVENT_KEY}
      - INNGEST_SIGNING_KEY=${INNGEST_SIGNING_KEY}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - CUSTOM_VAR=value
```

**Remember:** Users provide their research API keys (Groq, Tavily, etc.) through the dashboard UI, not environment variables.

---

## 🔒 Security Best Practices

### Production Checklist
- [ ] Change MongoDB password
- [ ] Generate strong NEXTAUTH_SECRET
- [ ] Use secrets management (Docker Secrets/Vault)
- [ ] Enable MongoDB authentication
- [ ] Use HTTPS in production
- [ ] Restrict MongoDB port exposure
- [ ] Update base images regularly

### Secure MongoDB
```yaml
# docker-compose.yml
mongodb:
  environment:
    MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
    MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
  ports: []  # Don't expose port in production
```

### Use Docker Secrets
```yaml
secrets:
  mongodb_password:
    file: ./secrets/mongodb_password.txt
    
services:
  mongodb:
    secrets:
      - mongodb_password
```

---

## 🚢 Production Deployment

### Build Optimized Image
```bash
# Multi-stage production build
docker build -t ai-research:latest .

# Tag for registry
docker tag ai-research:latest yourregistry/ai-research:v1.0.0

# Push to registry
docker push yourregistry/ai-research:v1.0.0
```

### Deploy with Custom Config
```bash
# Use production compose file
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Resource Limits
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

---

## 🐛 Troubleshooting

### App Won't Start
```bash
# Check logs
docker-compose logs app

# Verify environment
docker-compose exec app env

# Check disk space
docker system df

# Clean up
docker system prune -a
```

### MongoDB Connection Failed
```bash
# Check MongoDB health
docker-compose ps mongodb

# Verify connection string
docker-compose exec app env | grep MONGODB_URI

# Test connection
docker-compose exec mongodb mongosh \
  "mongodb://admin:password123@localhost:27017"
```

### Inngest Issues

#### Functions Not Registering
```bash
# Check Inngest environment variables
docker-compose exec app env | grep INNGEST

# Verify Inngest endpoint
curl http://localhost:3002/api/inngest

# Check app logs for Inngest errors
docker-compose logs app | grep -i inngest
```

#### Background Jobs Not Running
```bash
# For Development (using Inngest Dev Server):
# 1. Ensure Inngest Dev Server is running
npx inngest-cli@latest dev

# 2. Check Dev Server dashboard
# Open: http://localhost:8288

# 3. Verify function registration
# Should see: researchFlow, extendedResearchFlow, processEmbeddings, agentPlanExecutor

# For Production:
# 1. Check Inngest Cloud dashboard at https://app.inngest.com/
# 2. Verify webhook is accessible from internet
# 3. Check function logs in Inngest dashboard
```

#### Research Jobs Failing
```bash
# Verify users are providing API keys through the UI
# The application uses BYOK - users must enter their own keys

# Check Inngest execution logs for specific error
docker-compose logs app | grep -A 10 "research-flow"

# Common issues:
# - User didn't provide API keys in dashboard
# - Invalid API keys provided by user
# - API rate limits reached on user's account

# Check job logs in MongoDB
docker-compose exec mongodb mongosh -u admin -p password123 <<EOF
use ai-research
db.jobs.find().sort({createdAt: -1}).limit(5).pretty()
EOF
```

### Port Already in Use
```bash
# Find process using port 3002
lsof -i :3002  # macOS/Linux
netstat -ano | findstr :3002  # Windows

# Change port in docker-compose.yml
ports:
  - "3003:3000"
```

### Build Failures
```bash
# Clear Docker cache
docker builder prune -a

# Rebuild from scratch
docker-compose build --no-cache

# Check Docker logs
docker-compose logs --tail=50 app
```

---

## 📊 Monitoring

### Container Stats
```bash
# Real-time stats
docker stats

# Specific container
docker stats ai-research-app
```

### Disk Usage
```bash
# Show space usage
docker system df

# Detailed view
docker system df -v
```

---

## 🔄 Updates

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build
```

### Update Base Images
```bash
# Pull latest base images
docker-compose pull

# Rebuild with new bases
docker-compose build --pull
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment#docker-image)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)

---

## 💡 Tips

1. **Use volumes for persistence** - Don't lose data on container restart
2. **Name your containers** - Easier debugging and management
3. **Health checks** - Ensure services are actually ready
4. **Multi-stage builds** - Smaller production images
5. **Network isolation** - Use Docker networks for security
6. **Log rotation** - Prevent disk space issues
7. **Regular updates** - Keep base images current

---

**Need help?** Open an issue on [GitHub](https://github.com/vectorMindsAI/vectorMindsAI-v0/issues)
