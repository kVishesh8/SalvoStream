# VPS Deployment Guide: Oracle Free Tier VPS (Stage 5)

This guide walks you step-by-step through deploying **SalvoStream** as a stable, personal-use remote streaming platform on an **Oracle Cloud Free Tier VPS (Virtual Private Server)**. It is optimized for maximum simplicity, strong security, and 100% cost-free operation.

Stremio requires your addon to be accessible over a secure **HTTPS (SSL)** connection. To achieve this simply and automatically, we use a Dockerized **Caddy** container which handles SSL registration and renewals on ports `80`/`443` without any host dependencies.

---

## Architecture & Security Posture

The deployment stack runs in a fully containerized architecture inside a private Docker bridge network. 

```
┌────────────────────────────────────────────────────────┐
│ Client Devices (Stremio TV, Mobile, Web)               │
└───────────────────────────┬────────────────────────────┘
                            │ (HTTPS:443)
                            ▼
┌────────────────────────────────────────────────────────┐
│ Cloudflare DNS-Only (Grey Cloud)                       │
└───────────────────────────┬────────────────────────────┘
                            │ (Redirects / Proxy)
                            ▼
┌────────────────────────────────────────────────────────┐
│ Host Firewall (Security Lists & iptables)              │
│ - Port 80 (HTTP) -> Redirects to 443                   │
│ - Port 443 (HTTPS) -> Publicly Exposed                 │
│ - Port 22 (SSH) -> Administratively Restricted         │
│ - Ports 3000, 9696, 8191, 6379 -> CLOSED TO PUBLIC     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│ salvostream-network (Private Docker Bridge)            │
│ ┌───────────────┐                                      │
│ │    Caddy      │ ─── (Reverse Proxy) ──────────────── │
│ └───────────────┘                                    │
│        │                                             │
│        ▼                                             │
│ ┌───────────────┐       ┌───────────────┐            │
│ │   Backend     │ ─────►│    Redis      │            │
│ │   (Port 3000) │       │    (Cache)    │            │
│ └───────────────┘       └───────────────┘            │
│        │                                             │
│        ▼                                             │
│ ┌───────────────┐                                    │
│ │   Prowlarr    │ ◄─── (SSH Tunnel for Admin UI)     │
│ │   (Port 9696) │                                    │
│ └───────────────┘                                    │
│        │                                             │
│        ▼                                             │
│ ┌───────────────┐                                    │
│ │ FlareSolverr  │                                    │
│ └───────────────┘                                    │
└────────────────────────────────────────────────────────┘
```

* **No Exposed Admin Dashboards:** Ports `9696` (Prowlarr), `8191` (FlareSolverr), `6379` (Redis), and `3000` (Backend) are **not** opened in the firewalls. They are accessible only within the private Docker network.
* **Administrative Access:** Prowlarr is accessed securely using an **SSH Tunnel** from your local PC.
* **Centralized Storage:** All persistent databases and configurations are mapped to `/opt/salvostream` on the VPS host for clean, centralized backup management.

---

## 1. Domain & Cloudflare DNS Setup

You need a domain name (e.g. `yourdomain.com`). To map it:

1. **Log in to Cloudflare** (or your domain registrar).
2. Go to **DNS** -> **Records**.
3. Add a new **A Record**:
   * **Type:** `A`
   * **Name:** `api` (creates the subdomain `api.yourdomain.com`)
   * **IPv4 Address:** *Your Oracle VPS Public IP*
   * **Proxy status:** **DNS-Only (Grey Cloud)**
4. Click **Save**.

> [!NOTE]
> Keeping Cloudflare DNS in **DNS-Only** (Grey Cloud) mode during initial setup ensures Caddy can automatically solve Let's Encrypt HTTP-01 challenges without certificate verification conflicts.

---

## 2. Oracle Cloud Dashboard Port Exposure

By default, Oracle blocks all incoming internet traffic to your VPS. You must allow traffic on ports `80` (HTTP) and `443` (HTTPS):

1. Log in to the **Oracle Cloud Console**.
2. Go to **Compute** -> **Instances** -> Click your Instance Name.
3. Under **Instance Information**, click your **Virtual Cloud Network (VCN)**.
4. Click on **Security Lists** in the left sidebar, then click on the **Default Security List**.
5. Click **Add Ingress Rules** and add the following two TCP rules:
   
   **Rule 1: HTTP Traffic**
   * **Source Type:** CIDR
   * **Source CIDR:** `0.0.0.0/0`
   * **IP Protocol:** `TCP`
   * **Source Port Range:** `All`
   * **Destination Port Range:** `80`

   **Rule 2: HTTPS Traffic**
   * **Source Type:** CIDR
   * **Source CIDR:** `0.0.0.0/0`
   * **IP Protocol:** `TCP`
   * **Source Port Range:** `All`
   * **Destination Port Range:** `443`

6. Click **Add Ingress Rules**.

---

## 3. Server Initialization & Docker Installation

Establish an SSH connection to your remote VPS:
```bash
ssh -i /path/to/your-ssh-key.key ubuntu@YOUR_VPS_PUBLIC_IP
```

Once connected, update the operating system packages and install Docker + Docker Compose:
```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
sudo apt install docker.io -y

# 3. Add active user to the Docker group (so you don't need 'sudo' for Docker commands)
sudo usermod -aG docker $USER

# 4. Install Docker Compose
sudo apt install docker-compose-v2 -y

# 5. Terminate active SSH session to apply group settings
exit
```

Now, SSH back into your VPS to verify the installation:
```bash
ssh -i /path/to/your-ssh-key.key ubuntu@YOUR_VPS_PUBLIC_IP

# Verify versions
docker --version
docker compose version
```

---

## 4. Centralized Directory & Firewall Configuration

To keep deployment structures clean, we will centralize the application inside `/opt/salvostream`:

```bash
# 1. Create directory structure
sudo mkdir -p /opt/salvostream
sudo mkdir -p /opt/salvostream/data
sudo mkdir -p /opt/salvostream/prowlarr
sudo mkdir -p /opt/salvostream/redis_data
sudo mkdir -p /opt/salvostream/caddy_data
sudo mkdir -p /opt/salvostream/caddy_config

# 2. Transfer directory ownership to the standard 'ubuntu' user
sudo chown -R ubuntu:ubuntu /opt/salvostream
```

### OS Firewall (Ubuntu `iptables`)
Oracle Cloud Ubuntu images use a default `iptables` ruleset that blocks internet traffic. You must explicitly allow ports `80` and `443` inside the OS:

```bash
# 1. Inject rules to allow TCP traffic on ports 80 & 443
sudo iptables -I INPUT 6 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT

# 2. Install the persistence utility to save these settings across reboots
sudo apt install iptables-persistent -y
# Select 'Yes' on prompts to save current IPv4 and IPv6 rules
```

---

## 5. Clone Repository & Setup Configurations

Clone the project repository directly into `/opt/salvostream`:
```bash
git clone https://github.com/your-username/salvostream.git /opt/salvostream
cd /opt/salvostream
```

### Create Environment File (`.env`)
Generate your production configuration file from the template:
```bash
cp infrastructure/production/.env.prod.example .env
nano .env
```
Inside the editor, update the following fields:
* Set `DOMAIN` to your subdomain (e.g., `DOMAIN=api.yourdomain.com`).
* Keep `PROWLARR_API_KEY` blank for now (you will configure this in Step 7).
* Save and close (`Ctrl + O`, `Enter`, `Ctrl + X`).

### Copy Caddyfile to central volume mount
Caddy requires the `Caddyfile` to reside at the volume mount path `/opt/salvostream/Caddyfile`:
```bash
cp infrastructure/production/Caddyfile /opt/salvostream/Caddyfile
```

---

## 6. Launch the Container Stack

Start the Docker Compose services in the background:
```bash
docker compose -f infrastructure/production/docker-compose.prod.yml up -d --build
```

Verify that all five services (`salvostream-caddy`, `salvostream-backend`, `salvostream-redis`, `salvostream-prowlarr`, `salvostream-flaresolverr`) are online:
```bash
docker compose -f infrastructure/production/docker-compose.prod.yml ps
```

To view backend initialization logs:
```bash
docker compose -f infrastructure/production/docker-compose.prod.yml logs backend
```

---

## 7. Secure Prowlarr Configuration (SSH Tunneling)

> [!CAUTION]
> **Do NOT expose Port 9696 publicly!**
> Prowlarr contains your indexer keys and torrent tracker configurations. The SalvoStream backend communicates with it securely inside Docker's internal virtual bridge network (`http://prowlarr:9696`). Keep it blocked from the public web.

To configure indexers safely, map Prowlarr's dashboard to your local computer using an SSH Tunnel:

### Step 1: Open the SSH Tunnel locally
Open a Command Prompt, PowerShell, or Terminal window **on your home PC** (not the VPS) and run:
```bash
ssh -i /path/to/your-ssh-key.key -L 9696:localhost:9696 ubuntu@YOUR_VPS_PUBLIC_IP
```
*Leave this terminal window open. It securely forwards port 9696 of the remote VPS directly to your local web browser.*

### Step 2: Configure Prowlarr & Retrieve API Key
1. On your home PC, open a web browser and go to `http://localhost:9696`.
2. Follow the setup wizard.
3. Go to **Settings** -> **General** on the sidebar menu.
4. Locate the **API Key** in the **Security** section. Copy it to your clipboard.
5. Go to **Indexers** -> **Add Indexer (+)** -> Add public torrent trackers (e.g., *YTS*, *1337x*, *EZTV*). Save them.

### Step 3: Apply the API Key to the VPS
Return to your VPS SSH connection (or open a new terminal window to connect to the VPS):
```bash
nano /opt/salvostream/.env
```
Paste your copied API key:
```env
PROWLARR_API_KEY=your_prowlarr_api_key_here
```
Save and exit. Now, restart the backend container to apply the changes:
```bash
docker compose -f infrastructure/production/docker-compose.prod.yml up -d backend
```

---

## 8. Final Verification

Verify that your SalvoStream deployment is secure, fully functional, and accessible over HTTPS:

1. Open your web browser and navigate to:
   ```text
   https://api.yourdomain.com/manifest.json
   ```
2. **Result:** You should see the secure padlock icon in the browser address bar, and your Stremio manifest JSON should render perfectly!
3. To test stream indexing, query a movie ID (e.g. *Fight Club*):
   ```text
   https://api.yourdomain.com/stream/movie/tt0137523.json
   ```
4. **Result:** Playable stream objects should render under a `streams` key.

### Installing in Stremio
* Open Stremio (Desktop, Web, or Android TV).
* Navigate to **Addons**.
* Paste your HTTPS URL into the repository box: `https://api.yourdomain.com/manifest.json`
* Click **Install**. You can now stream outside your home network!

---

## 9. Operations & Maintenance Workflows

These scripts reside in `/opt/salvostream/infrastructure/production/` and automate core upkeep operations.

### A. Manual Updates
To pull the latest code and rebuild the stack without data loss:
```bash
# Make the update script executable
chmod +x /opt/salvostream/infrastructure/production/update.sh

# Run the update
/opt/salvostream/infrastructure/production/update.sh
```
*What this does:* Pulls the latest git commit, compiles libraries, rebuilds the docker images, restarts the stack, and prunes old container build caches to conserve VPS disk space.

### B. Lightweight Backups
To create dated, compressed archive snapshots of all databases and configurations:
```bash
# Make the backup script executable
chmod +x /opt/salvostream/infrastructure/production/backup.sh

# Run the backup
/opt/salvostream/infrastructure/production/backup.sh
```
*What this does:* Stops nothing, creates a gzip tarball containing all SQLite databases and configurations, saves them inside `/opt/salvostream/backups/`, and automatically deletes backups older than 7 days.

You can set this backup to run automatically once a day using a lightweight standard cron job:
```bash
# Open cron editor
crontab -e

# Add this line to run the backup every day at 3:00 AM
0 3 * * * /opt/salvostream/infrastructure/production/backup.sh >/dev/null 2>&1
```

### C. Useful Commands
* **Restart the entire stack:**
  ```bash
  docker compose -f /opt/salvostream/infrastructure/production/docker-compose.prod.yml restart
  ```
* **View container resource usage:**
  ```bash
  docker stats salvostream-backend salvostream-redis salvostream-prowlarr
  ```
* **Check Caddy SSL logs:**
  ```bash
  docker compose -f /opt/salvostream/infrastructure/production/docker-compose.prod.yml logs caddy
  ```
