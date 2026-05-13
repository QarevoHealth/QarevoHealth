# Docker Build Standard

This document describes the Docker build setup for local development and CI validation.

## Quick Start

### Build and Run with Docker Compose

```bash
# Build and start both services
docker-compose up --build

# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# Backend Health: http://localhost:8000/health
```

### Build Images Individually

**API Image:**
```bash
docker build -t qarevo-api:latest ./services/video-conference
```

**Web Image:**
```bash
docker build -t qarevo-web:latest ./apps/web
```

## Build Details

### API Service (`services/video-conference`)

The backend uses a multi-stage Dockerfile with:
- **Builder stage**: Installs Python dependencies
- **Production stage**: Uses Python 3.11-slim, runs as non-root `appuser`, exposes port 8000

**Entry point:** `uvicorn app:app --host 0.0.0.0 --port 8000`

**Health check:** The `/health` endpoint is available at `http://localhost:8000/health`

### Web Service (`apps/web`)

The frontend uses a multi-stage Dockerfile with:
- **Builder stage**: Installs pnpm dependencies and builds Next.js
- **Production stage**: Uses Node 20-slim, runs as non-root `nextuser`, exposes port 3000

**Entry point:** `pnpm start`

## CI Workflow

The `.github/workflows/docker-build.yml` workflow runs on PRs and pushes to main.

### What it does:
1. Builds both API and Web Docker images
2. Tags images with the Git SHA (first 8 characters)
3. Runs Trivy vulnerability scanner on both images
4. Fails on CRITICAL or HIGH severity vulnerabilities

### Image Tags

Images are tagged as:
- `qarevo-api:<sha>` for the backend
- `qarevo-web:<sha>` for the frontend

Where `<sha>` is the first 8 characters of the Git commit SHA.

## Local Development Notes

- This setup is for **local validation only**, not production deployment
- No databases, Redis, or message brokers are included
- Images are not pushed to any registry
- Environment variables should be configured locally as needed