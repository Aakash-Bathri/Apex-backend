# Production Deployment Guide

This repository is configured for automated Continuous Deployment (CD) to AWS Lightsail.

## Key Files
- **`docker-compose.yml`**: Defines the production services (Backend, Mongo, Nginx, Certbot). **Do not rename this.**
- **`nginx/default.conf`**: The production Nginx configuration. Handles routing and SSL termination.
- **`.github/workflows/deploy.yml`**: The GitHub Actions workflow that orchestrates the deployment.

## Configuration (MongoDB Atlas)
Since this setup uses MongoDB Atlas (External Database), you **MUST** ensure your environment variables are correct.
1.  **Whitelist IP**: In MongoDB Atlas Network Access, add `0.0.0.0/0` (Allow Anywhere) OR better, add the specific Static IP of your Lightsail instance.
2.  **Connection String**: Update your production `.env` file (on the server or the one you use with Ansible) with the Atlas URI:
    ```ini
    DATABASE_URL=mongodb+srv://<user>:<password>@cluster0.mongodb.net/apex?retryWrites=true&w=majority
    ```

## How Deployment Works

### 1. The Trigger
- Any push to the `main` branch triggers the pipeline.
- Pull Requests (PRs) do not trigger deployment, but you can configure them to run tests.

### 2. The Process (CI/CD)
The workflow in `.github/workflows/deploy.yml` performs two main stages:

1.  **Test (CI)**:
    -   Installs dependencies (`npm ci`).
    -   Runs the test suite (`npm test`).
    -   **Stops immediately** if any test fails.

2.  **Deploy (CD)**:
    -   Connects to the VPS via SSH (using `LIGHTSAIL_IP` and `SSH_PRIVATE_KEY` secrets).
    -   Pulls the latest code: `git pull origin main`.
    -   Rebuilds the containers: `docker compose up -d --build`.

## Server Maintenance

### Viewing Logs
To see what's happening on the server, SSH in (`ssh ubuntu@<YOUR_IP>`) and run:
```bash
# Backend logs
docker compose logs -f backend

# Nginx logs
docker compose logs -f nginx
```

### Manual Restart
If you need to manually restart the server:
```bash
cd ~/apex-backend
docker compose restart
```
