# VPS Deployment Guide: Oracle Free Tier VPS

This guide walks you step-by-step through deploying **SalvoStream** on an **Oracle Cloud Free Tier VPS (Virtual Private Server)**. It is written to be extremely beginner-friendly.

Stremio Web requires your addon to be accessible over a secure **HTTPS (SSL)** connection. To achieve this simply and for free, we will use a tool called **Caddy** which automatically provisions and manages free SSL certificates for your domain.

---

## Prerequisites
1. An **Oracle Cloud Free Tier Account** (signup at [oracle.com/cloud/free/](https://oracle.com/cloud/free/)).
2. An **Ubuntu 22.04 LTS or Ubuntu 24.04 LTS** instance created in Oracle Cloud (using standard ARM Ampere or AMD shape).
3. A **Domain Name** (e.g. from Namecheap, Cloudflare, or GoDaddy) pointing its `A Record` to your Oracle VPS Public IP Address (e.g., `salvostream.yourdomain.com -> 123.45.67.89`).

---

## Step 1: Open Firewall Ports in Oracle Cloud Dashboard

By default, Oracle blocks incoming internet traffic to your server. We must open ports `80` (HTTP) and `443` (HTTPS) so the world can connect securely.

1. In the Oracle Cloud Console, navigate to: **Compute** -> **Instances** -> Click your Instance Name.
2. Under **Instance Information**, click on your **Virtual Cloud Network (VCN)**.
3. Click on the **Security List** for your subnet.
4. Click **Add Ingress Rules** and add two rules:
   * **Rule 1: HTTP Access**
     - **Source CIDR:** `0.0.0.0/0`
     - **IP Protocol:** `TCP`
     - **Destination Port Range:** `80`
   * **Rule 2: HTTPS Access**
     - **Source CIDR:** `0.0.0.0/0`
     - **IP Protocol:** `TCP`
     - **Destination Port Range:** `443`
5. Click **Add Ingress Rules**.

---

## Step 2: Connect to Your VPS and Install Docker

Open your terminal (macOS/Linux) or PowerShell (Windows) and connect to your VPS using SSH:
```bash
ssh -i /path/to/your-key.key ubuntu@YOUR_VPS_PUBLIC_IP
```

Once connected, run the following commands to update your server and install Docker + Docker Compose:

```bash
# 1. Update system packages
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
sudo apt install docker.io -y

# 3. Add your user to the Docker group (so you don't have to type 'sudo' for docker commands)
sudo usermod -aG docker $USER

# 4. Install Docker Compose
sudo apt install docker-compose-v2 -y

# 5. Log out and log back in to apply Docker group changes
exit
```
Now SSH back in:
```bash
ssh -i /path/to/your-key.key ubuntu@YOUR_VPS_PUBLIC_IP
```
Verify installations:
```bash
docker --version
docker compose version
```

---

## Step 3: Configure Ubuntu OS Firewall

Ubuntu has an internal firewall called `iptables` that Oracle configures strictly. We must tell the OS to let HTTP/HTTPS traffic through:

```bash
sudo iptables -I INPUT 6 -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -p tcp --dport 443 -j ACCEPT

# Save the firewall changes so they survive server restarts
sudo apt install iptables-persistent -y
# Select 'Yes' in the interactive prompts to save current rules
```

---

## Step 4: Transfer Code Files to Your VPS

You can clone your repository onto the VPS, or copy files using `git` or an SFTP program like **FileZilla**:

If using Git, run on your VPS:
```bash
git clone https://github.com/your-username/salvostream.git
cd salvostream
```

Once in the project directory, initialize the environment file:
```bash
cp .env.example .env
```

---

## Step 5: Start SalvoStream via Docker Compose

Run the following command to build and run the services in the background (detached mode):
```bash
docker compose up -d --build
```
Verify the containers are running successfully:
```bash
docker compose ps
```
And check logs to confirm SQLite and Redis initialized cleanly:
```bash
docker compose logs backend
```

---

## Step 5.5: Securely Accessing Prowlarr Web UI on a VPS (SSH Tunneling)

> [!CAUTION]
> **Security Best Practice:**
> Do NOT open Prowlarr's port `9696` in your Oracle Cloud firewall or expose it to the public internet! Prowlarr handles your indexing APIs, private keys, and search configurations. The SalvoStream backend connects to it safely inside the private Docker bridge network (`http://prowlarr:9696`), which is completely hidden from the outside world.

To configure and manage indexers on your remote VPS securely without exposing ports to the public internet:

1. **Create an SSH Tunnel** from a terminal/PowerShell window on your local machine:
   ```bash
   ssh -i /path/to/your-key.key -L 9696:localhost:9696 ubuntu@YOUR_VPS_PUBLIC_IP
   ```
   *What this does:* This secure tunnel binds port `9696` of your local machine directly to port `9696` of the remote VPS over SSH. Keep this terminal open while you use the dashboard.

2. **Open the Prowlarr Web UI locally**:
   Open your browser on your own machine and navigate to:
   ```text
   http://localhost:9696
   ```
   You can now safely configure indexers, copy the API key, paste it into the remote VPS `.env` file, and restart the backend stack!

---

## Step 6: Set up Caddy for Automated HTTPS (SSL)

To expose your addon securely to Stremio clients over `https://`, we will install **Caddy** directly on the host VPS. It will listen on port `80`/`443`, automatically manage your SSL certificate, and forward requests to your Docker backend container on port `3000`.

### 1. Install Caddy on Ubuntu
Run the following commands:
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy -y
```

### 2. Configure Caddy
Create/edit Caddy's configuration file:
```bash
sudo nano /etc/caddy/Caddyfile
```

Delete everything in that file and paste the following, replacing `salvostream.yourdomain.com` with your actual domain or subdomain:

```text
salvostream.yourdomain.com {
    reverse_proxy localhost:3000
}
```

*Press `Ctrl + O` then `Enter` to save, and `Ctrl + X` to exit.*

### 3. Restart Caddy
Apply your changes:
```bash
sudo systemctl restart caddy
```

---

## Step 7: Final Verification

1. Open your web browser and navigate to:
   ```text
   https://salvostream.yourdomain.com/manifest.json
   ```
2. **Success Check:** It should display your Stremio manifest and show a secure lock icon (HTTPS) next to the URL!
3. Paste `https://salvostream.yourdomain.com/manifest.json` inside **Stremio** to install the production addon instantly!
