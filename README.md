# Reviewer.AI

Reviewer.AI is an AI-powered mock interview platform designed to help developers prepare for technical job interviews. Users register with their profession, years of experience, and tech stack. The system then generates personalized interview questions, evaluates submitted answers in real time using a large language model, and provides a scored feedback report. The platform supports both English and Hebrew (RTL), and allows users to track their interview history and export results as a PDF.

---

## Tech Stack

**Frontend:** React, React Router, Vite, Nginx
**Backend:** Node.js, Express, SQLite, JWT, bcrypt
**AI Service:** Node.js, Express, Google Gemini API
**Infrastructure:** Docker, Docker Compose
**Testing:** Jest, React Testing Library, Supertest, Babel

---

## Running Locally

### Prerequisites

You need the following tools installed on your machine before anything else.

#### 1. Install Docker Desktop
Docker runs all three services (frontend, backend, AI service) in isolated containers. You do not need to install Node.js manually for production — Docker handles everything inside the containers.

- Download from: https://www.docker.com/products/docker-desktop
- Install and launch Docker Desktop.
- Wait until the Docker icon in your taskbar shows **"Docker is running"**.
- Verify by running:
  ```bash
  docker --version
  docker compose version
  ```

#### 3. Get a Google Gemini API Key
The AI service requires a free API key from Google AI Studio to generate and evaluate interview questions.

- Go to: https://aistudio.google.com/app/apikey
- Sign in with a Google account.
- Click **"Create API key"** and copy the generated key. Keep it somewhere safe.

---

### Setup (required for both modes)

#### 1. Clone the repository

```bash
git clone https://github.com/RonGamzu/reviewer-ai.git
cd reviewer-ai
```

#### 2. Create the environment file
The project requires a `.env` file with your secrets and configuration. A template is provided:

```bash
# macOS / Linux
cp .env.example .env

# Windows (Command Prompt)
copy .env.example .env
```

#### 3. Fill in the `.env` file
Open `.env` in any text editor and update these three values:

```env
JWT_SECRET=choose_any_long_random_string_here
AI_SERVICE_SECRET=choose_any_other_long_random_string_here
GEMINI_API_KEY=paste_your_google_gemini_api_key_here
```

The other values can stay as-is for local development.

---

### Production Mode (Docker)

This is the recommended way to run the project. Docker builds and runs all three services automatically. Node.js does **not** need to be installed.

#### 1. Build and start all containers

From the project root (the folder containing `docker-compose.yml`):

```bash
docker compose up --build
```

This will:
- Build a production image for each service
- Compile the React frontend with Vite and serve it via Nginx
- Start the backend API and AI service
- Connect all three on a private internal network

The first build takes a few minutes. On subsequent runs, Docker uses cached layers and starts much faster.

#### 2. Open the application

Once you see log output from all three services, open your browser at:

```
http://localhost:5173
```

#### 3. Stop the application

Press `Ctrl+C` in the terminal, or from a separate terminal:

```bash
docker compose down
```

To also delete the local database:

```bash
docker compose down -v
```

#### Running in the background

```bash
docker compose up --build -d

# View logs while running detached
docker compose logs -f
```

---

### Development Mode

In development mode each service runs with live-reload — the server restarts automatically whenever you save a source file. The frontend uses the Vite dev server instead of Nginx.

#### 1. Install Node.js
Node.js is required to run the services directly (outside Docker).

- Download **Node.js v22 LTS** from: https://nodejs.org
- Run the installer and follow the steps.
- Verify:
  ```bash
  node --version   # should print v22.x.x
  npm --version    # should print 11.x.x
  ```

#### 2. Install dependencies
From the project root, install dependencies for each service:

```bash
cd backend    && npm install && cd ..
cd ai-service && npm install && cd ..
cd frontend   && npm install && cd ..
```

#### 3. Start all services
Open **three separate terminal windows** (or tabs) and run one command in each.

**Terminal 1 — Backend** (http://localhost:3001):
```bash
cd backend
npm run dev
```

**Terminal 2 — AI Service** (http://localhost:3002):
```bash
cd ai-service
npm run dev
```

**Terminal 3 — Frontend** (http://localhost:5173):
```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

> The SQLite database file is created automatically at `backend-data/database.sqlite` on first run.

#### Running Tests

Each service has its own test suite. Run from inside the service directory:

```bash
npm test                # run all tests once
npm run test:watch      # re-run tests on file changes
npm run test:coverage   # generate a coverage report
```

---

## Project Structure

```
reviewer-ai/
├── backend/           # Express REST API, JWT auth, SQLite database
├── ai-service/        # Express service, Google Gemini integration
├── frontend/          # React SPA, Vite build, Nginx (production)
├── backend-data/      # SQLite database file — created on first run, git-ignored
├── docker-compose.yml
├── .env.example       # Copy to .env and fill in your secrets
└── README.md
```

---

## Environment Variables Reference

| Variable | Description | Default |
|---|---|---|
| `JWT_SECRET` | Secret key for signing JWT tokens | *(required)* |
| `AI_SERVICE_SECRET` | Shared secret between backend and AI service | *(required)* |
| `GEMINI_API_KEY` | Google Gemini API key (from Google AI Studio) | *(required)* |
| `BACKEND_PORT` | Port the backend listens on | `3001` |
| `AI_SERVICE_PORT` | Port the AI service listens on | `3002` |
| `FRONTEND_PORT` | Port the frontend is served on | `5173` |
| `VITE_API_URL` | Backend URL visible to the browser | `http://localhost:3001` |
| `VITE_APP_VERSION` | App version displayed in the UI | `1.0.0` |
