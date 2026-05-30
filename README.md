# SalvoStream — Stage 1 Scaffold Addon

Welcome to **SalvoStream**! This is the Stage 1 scaffolding for a modular monolith Stremio addon, designed to run in a Dockerized environment or locally with ease. 

This repository sets up a reliable infrastructure with **Node.js (Node 22 LTS)**, **TypeScript**, **Fastify** (web server), **Redis** (in-memory cache/broker), and **SQLite** (lightweight SQL database).

---

## Repository Structure

```
/salvostream
  ├── package.json             # Root monorepo workspace configuration
  ├── tsconfig.json            # Strict TypeScript rules
  ├── eslint.config.js         # Pragmatic coding standards
  ├── .editorconfig            # Code formatting parameters
  ├── .gitignore               # Ignored version control paths
  ├── .dockerignore            # Ignored Docker container paths
  ├── docker-compose.yml       # Docker orchestrator
  ├── apps/
  │   └── backend/             # Fastify backend application (Node.js)
  ├── packages/
  │   ├── shared-types/        # Common interfaces and strict type schemas
  │   ├── shared-constants/    # Shared global variables (addon name, defaults)
  │   └── shared-utils/        # Shared uptime and formatting functions
  ├── infrastructure/
  │   └── docker/              # Configurations (e.g. redis.conf)
  └── docs/
      └── DEPLOYMENT.md        # VPS Deployment Guide for Oracle Free Tier
```

---

## 1. Local Development Setup (Without Docker)

This method runs the server directly on your operating system.

### Prerequisites
1. **Node.js 22 LTS (Active)**
   - Download and install Node.js 22 from [nodejs.org](https://nodejs.org/).
   - Verify it is installed by running in your terminal:
     ```bash
     node -v
     ```
     *(Should output `v22.x.x`)*

2. **Redis Server (Optional for local, required for active healthcheck)**
   - To have a fully healthy local setup, ensure Redis is installed and running on `localhost:6379`.
   - If you do not have Redis locally, we recommend using the **Docker Compose** setup below, which handles Redis for you automatically!

### Step 1: Install Dependencies
Open your command prompt/terminal, navigate to the project directory, and run:
```bash
npm install
```

### Step 2: Build the Packages
Compile the shared libraries and backend application:
```bash
npm run build
```

### Step 3: Set up Configuration
Copy the template configuration file to create your own configuration:
- On Windows PowerShell:
  ```powershell
  Copy-Item .env.example .env
  ```
- On macOS/Linux:
  ```bash
  cp .env.example .env
  ```

### Step 4: Run the Development Server
Start the backend server in hot-reload mode (it will restart automatically when you edit files):
```bash
npm run dev
```
The server will start on `http://localhost:3000`.

---

## 2. Running with Docker (Recommended)

Docker packages the backend application, SQLite database, and Redis container so they run identically on any computer without manual database or Redis installs.

### Prerequisites
* Install **Docker Desktop** on Windows, macOS, or Linux from [docker.com](https://www.docker.com/products/docker-desktop/).

### Step 1: Run the Containers
Open your command prompt/terminal inside the project directory and run:
```bash
docker compose up --build
```
* **What this does:** Docker compiles the Node 22 backend workspace, starts a Redis container, initializes an SQLite database inside the `./data` directory, and binds everything to port `3000` of your computer.
* **To stop the server:** Press `Ctrl + C` in the terminal, or run `docker compose down`.

---

## 2.5. Configuring Prowlarr & Torrent Indexers (Stage 2)

Stage 2 integrates **Prowlarr** to search torrent trackers. To configure the search pipeline:

### Step 1: Open Prowlarr Web Interface
1. Ensure the Docker stack is running (`docker compose up -d`).
2. Open your web browser and go to `http://localhost:9696`.
3. Complete the initial setup wizard if prompted (use basic or default settings, you do not need authentication for local testing).

### Step 2: Retrieve the API Key
1. In Prowlarr, go to **Settings** -> **General** in the left navigation sidebar.
2. Locate the **API Key** field in the **Security** section.
3. Click the copy button to copy the API key.

### Step 3: Configure the Backend Environment
1. Open the `.env` file in the root of your project.
2. Paste the copied API key into the `PROWLARR_API_KEY` field:
   ```env
   PROWLARR_API_KEY=your_copied_api_key_here
   ```
3. Restart your Docker containers to load the new key:
   ```bash
   docker compose up -d backend
   ```
   *(The backend server will log a startup summary confirming that the API key is recognized and masked safely.)*

### Step 4: Add Indexers in Prowlarr
1. In Prowlarr web UI, go to **Indexers** on the sidebar.
2. Click **Add Indexer** (+).
3. Search for and add public torrent indexers (e.g., **YTS**, **EZTV**, or **1337x**).
4. Save the indexers. You are now ready to stream!

---

## 2.7. Optional FlareSolverr Proxy & Tracker Health (Stage 3.5)

Stage 3.5 expands the source ecosystem with optional FlareSolverr proxy connectivity, lightweight tracker health tracking, expanded Hindi/dual-audio coverage, and compact TV-friendly stream labels.

### Configuring FlareSolverr (Optional)
If you want to use FlareSolverr to solve Cloudflare challenges on protected indexers:
1. In your `.env` file, enable FlareSolverr:
   ```env
   FLARESOLVERR_ENABLED=true
   FLARESOLVERR_URL=http://localhost:8191
   ```
2. Restart the Docker stack:
   ```bash
   docker compose up -d
   ```
3. Open your Prowlarr web UI (`http://localhost:9696`).
4. Navigate to **Settings** -> **Indexer Proxies** and click **+** (Add).
5. Select **FlareSolverr** from the list.
6. Enter `http://flaresolverr:8191` in the **Host** field.
7. Under **Tags**, enter a tag name (e.g. `flaresolverr`) and click **Save**.
8. Go to **Settings** -> **Indexers**, click edit on any protected indexer (e.g. Torrent9), add the matching tag `flaresolverr`, and click **Save**.
9. Prowlarr will now automatically proxy challenge requests through FlareSolverr!

### Lightweight Tracker Health
The backend dynamically monitors query success and latency for each torrent indexer. You can check the health status of all indexers by querying the GET `/health` endpoint under the `trackers` field.
If a tracker fails 5 consecutive times, the system softly bypasses it to prevent pipeline latency. If all trackers fail, the system safely falls back to querying all active indexers to ensure you always get streams.

---

## 3. Testing the Addon & API Endpoints

Once the server is running (either locally or through Docker), you can test these URLs in your web browser:

### 1. Stremio Addon Manifest
* **URL:** `http://localhost:3000/manifest.json`
* **Purpose:** Returns the Stremio metadata. Stremio reads this URL to understand what your addon is called and what resources it serves.
* **Expected Response:**
  ```json
  {
    "id": "org.salvostream",
    "name": "SalvoStream",
    "version": "0.1.0",
    "description": "...",
    "resources": ["stream"],
    "types": ["movie", "series"],
    "idPrefixes": ["org.salvostream", "tt"]
  }
  ```

### 2. Readiness Probe
* **URL:** `http://localhost:3000/ready`
* **Purpose:** Verifies that both the SQLite database and the Redis cache are successfully connected and functioning.

### 3. Comprehensive Health Report
* **URL:** `http://localhost:3000/health`
* **Purpose:** Returns deep diagnostic information including memory usage and process uptime.

### 4. Stream Results Endpoint (Stage 2 Validation)
* **URL:** `http://localhost:3000/stream/movie/tt0137523.json` (Fight Club)
* **Purpose:** Serves streams to Stremio. It parses the IMDb ID, does a title query to Cinemeta, searches Prowlarr, applies spam filters and deduplication, and returns the sorted playable torrents.
* **Expected Response:**
  ```json
  {
    "streams": [
      {
        "name": "SalvoStream\n1080p",
        "title": "Fight Club 1999 1080p BluRay x264-YTS\n1080p • 1.39 GB • 120 seeders • YTS",
        "infoHash": "8c2227d84b74fb95c23d1193b8d1764619b0222a",
        "fileIdx": 0
      }
    ]
  }
  ```

---

## 4. How to Install in Stremio

To test the addon in the actual Stremio application:

1. Open **Stremio** (Desktop or Web version at [web.stremio.com](https://web.stremio.com/)).
2. Navigate to the **Addons** tab in the sidebar menu.
3. Paste the following URL in the **Addon Repository URL** search box at the top right:
   ```text
   http://localhost:3000/manifest.json
   ```
4. Click **Install**.
5. SalvoStream will now appear in your list of installed addons!
