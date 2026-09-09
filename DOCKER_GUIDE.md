# Enterprise AI - Docker Deployment Guide

This guide explains how to run the entire Enterprise AI platform using Docker and how to distribute container images to team members.

---

## 🏗️ Architecture

The system consists of 4 microservices connected over a shared Docker bridge network:

| Service | Technology | Internal Port | Host Port | Description |
| :--- | :--- | :--- | :--- | :--- |
| **frontend** | React 19 + Vite + Nginx | 80 | `3000` | Web UI & SPA Reverse Proxy |
| **backend** | ASP.NET Core 10 Web API | 5000 | `5000` | Core Business Logic & Auth |
| **ai-service** | Python 3.11 + FastAPI | 8000 | `8000` | Auto-filler & RAG Pipeline |
| **ollama** | Ollama Engine | 11434 | `11434` | Local LLM (`qwen2.5-coder`) |

---

## 🚀 Quick Start (Run Everything with One Command)

1. Make sure **Docker Desktop** is installed and running.
2. Open your terminal in the project root:
   ```bash
   cd EnterpriseAi
   ```
3. Build and launch all services:
   ```bash
   docker compose up --build
   ```
4. Access the applications:
   - **Frontend UI:** [http://localhost:3000](http://localhost:3000)
   - **Backend API & Docs:** [http://localhost:5000/scalar/v1](http://localhost:5000/scalar/v1)
   - **AI Service Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
   - **Ollama Status:** [http://localhost:11434](http://localhost:11434)

To stop all services:
```bash
docker compose down
```

---

## 👥 How to Share the Images with the Team

### Option A: Via Docker Hub (Recommended)

1. **Tag and push the images:**
   ```bash
   # Ollama with model
   docker tag enterprise-ollama:qwen2.5-coder your-username/enterprise-ollama:qwen2.5-coder
   docker push your-username/enterprise-ollama:qwen2.5-coder

   # Other services (optional)
   docker tag enterprise-ai-service your-username/enterprise-ai-service:latest
   docker push your-username/enterprise-ai-service:latest
   ```

2. **Any team member can pull and run:**
   ```bash
   docker pull your-username/enterprise-ollama:qwen2.5-coder
   docker run -d -p 11434:11434 your-username/enterprise-ollama:qwen2.5-coder
   ```

---

### Option B: Offline Sharing (USB Drive / Google Drive)

If team members have limited internet access:

1. **Export the Ollama image to a single archive file:**
   ```bash
   docker save -o enterprise-ollama-qwen.tar enterprise-ollama:qwen2.5-coder
   ```

2. **Send `enterprise-ollama-qwen.tar` to the team member.**

3. **They import it on their machine:**
   ```bash
   docker load -i enterprise-ollama-qwen.tar
   ```
   Now they have the exact same model ready without downloading a single byte from the internet!

---

## 🛠️ Common Operations

### Run a single service
```bash
# Run only the AI service and Ollama
docker compose up ai-service ollama

# Run only the frontend
docker compose up frontend
```

### Rebuild after modifying code
```bash
# Rebuild only frontend
docker compose up --build frontend

# Rebuild only backend
docker compose up --build backend

# Rebuild only ai-service
docker compose up --build ai-service
```

### View service logs
```bash
docker compose logs -f ai-service
docker compose logs -f backend
```
