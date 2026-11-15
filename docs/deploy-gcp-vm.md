# Deploying CreatorFeed on the GCP VM (Ubuntu 22.04+)

How to run CreatorFeed on a Compute Engine VM against Cloud SQL, then move
`feed.creedom.ai` over from the old DigitalOcean VPS. The layout is the same as
the old server (nginx → PM2 → `next start` in `/var/www/creatorfeed`).

| Piece | Value |
|---|---|
| Database | Cloud SQL `casttree:asia-southeast1:creatorfeed-db`, PostgreSQL 17, database `creatorfeed`, user `creatorfeed_app` |
| DB private IP | `10.34.113.3` (VPC `default`) |
| App directory | `/var/www/creatorfeed` |
| App process | PM2 app `creatorfeed`, port 3000 |
| Public URL | `https://feed.creedom.ai` |

Run all commands as written. `sudo` lines need an account with sudo; everything
else runs as the `creatorfeed` user.

---

## 1. Check the VM

In the console (Compute Engine → VM instances → your VM), confirm:

- **Region:** `asia-southeast1` (same as Cloud SQL; another region adds latency to every query).
- **Network interface:** VPC `default`. Without it the VM can't reach `10.34.113.3`.
- **Machine type:** at least `e2-small` (2 GB RAM). `next build` and the embedding model are memory-hungry; section 2 adds swap as a safety net.
- **External IP:** reserve it as **static** (VPC network → IP addresses → promote the VM's ephemeral IP). DNS will point at it.
- **Firewall:** VM → Edit → tick **Allow HTTP traffic** and **Allow HTTPS traffic**. Leave port 3000 closed; nginx is the only way in.

SSH in with the console's **SSH** button or `gcloud compute ssh <vm-name> --zone <zone>`.

## 2. Install system packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx certbot python3-certbot-nginx build-essential postgresql-client

# Node.js 20 or 22 LTS (skip if `node -v` already shows one of these)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v22.x

# PM2 (process manager)
sudo npm install -g pm2

# 2 GB swap so `next build` doesn't get OOM-killed on small VMs
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## 3. Create the app user and directories

The app runs as its own unprivileged user, not root.

```bash
sudo useradd --create-home --shell /bin/bash creatorfeed
sudo mkdir -p /var/www/creatorfeed /etc/creatorfeed
sudo chown creatorfeed:creatorfeed /var/www/creatorfeed
```

## 4. Install the Cloud SQL server CA certificate

The app refuses to connect over SSL without it (`DATABASE_CA_CERT is required...`).

1. Console → **SQL → creatorfeed-db → Connections → Security** → **Manage server CA certificates** → **Download** the current CA (`server-ca.pem`).
2. Put it on the VM:
   ```bash
   sudo nano /etc/creatorfeed/server-ca.pem      # paste the whole PEM, including BEGIN/END lines
   sudo chown root:creatorfeed /etc/creatorfeed/server-ca.pem
   sudo chmod 640 /etc/creatorfeed/server-ca.pem
   ```
3. Check that the VM reaches the database and the certificate verifies:
   ```bash
   psql "host=10.34.113.3 dbname=creatorfeed user=creatorfeed_app sslmode=verify-ca sslrootcert=/etc/creatorfeed/server-ca.pem" \
     -c "select count(*) from threads"
   ```
   Enter the `creatorfeed_app` password. A row count means networking, SSL and credentials all work.
   If it hangs, the VM isn't on the `default` VPC (see section 1).

## 5. Get the code

Give the VM read-only access to the GitHub repo with a deploy key:

```bash
sudo -iu creatorfeed
ssh-keygen -t ed25519 -C "creatorfeed-gcp-vm" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```

On GitHub: repo → **Settings → Deploy keys → Add deploy key**, paste the key, leave **Allow write access** unchecked.

```bash
# still as creatorfeed
git clone git@github.com:<org>/creatorfeed.git /var/www/creatorfeed
cd /var/www/creatorfeed
git checkout main        # use feat/gcp-postgres-migration until it is merged
```

## 6. Production environment file

Next.js reads `.env.production.local` automatically during `build` and `start`.
It's git-ignored. Only the `creatorfeed` user can read it.

```bash
# as creatorfeed, in /var/www/creatorfeed
touch .env.production.local && chmod 600 .env.production.local
nano .env.production.local
```

```bash
# --- Database (private IP, verified TLS) ---
DATABASE_URL=postgresql://creatorfeed_app:<password>@10.34.113.3:5432/creatorfeed?sslmode=require
DATABASE_CA_CERT=/etc/creatorfeed/server-ca.pem
# Never set DATABASE_SSL_INSECURE here.

# --- Auth.js ---
AUTH_URL=https://feed.creedom.ai     # required: behind nginx, Next 14 reports its own URL as localhost:3000
AUTH_SECRET=<run: openssl rand -base64 33   (new value, not the one from your laptop)>
AUTH_GOOGLE_ID=<same OAuth client as local>
AUTH_GOOGLE_SECRET=<same OAuth client as local>

# --- Internal API key (server-to-server + GitHub Actions seed job) ---
INTERNAL_API_KEY=<run: openssl rand -hex 32   (copy the same value into GitHub secrets, section 10)>

# --- Third-party APIs ---
ANTHROPIC_API_KEY=<key>
YOUTUBE_API_KEY=<key>

# --- Public URLs (baked into the client bundle at build time) ---
NEXT_PUBLIC_APP_URL=https://feed.creedom.ai
NEXT_PUBLIC_SITE_URL=https://feed.creedom.ai
# NEXT_PUBLIC_GA_ID=<Google Analytics id, if used>
```

If a password contains special characters (`@ : / ? # % &`), URL-encode it inside
`DATABASE_URL`, or use a letters-and-digits password.

## 7. Build and start with PM2

```bash
# as creatorfeed, in /var/www/creatorfeed
npm ci
npm run build              # connects to Cloud SQL: some pages are prerendered from data
pm2 start npm --name creatorfeed -- start
pm2 save
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/   # expect 200
exit                       # back to your sudo user
```

Start PM2 on boot (this prints a command; run it exactly as printed):

```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u creatorfeed --hp /home/creatorfeed
```

The first debate submission downloads the embedding model (about 90 MB) into
`node_modules/@xenova/transformers/.cache`, so the VM needs outbound internet access.

## 8. nginx

```bash
sudo nano /etc/nginx/sites-available/creatorfeed
```

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name feed.creedom.ai;

    client_max_body_size 1m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        # Overwrite (don't append) so clients can't spoof the IP used for rate limiting
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Real-IP $remote_addr;
        # Auth.js builds its Google callback URL from these
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        # Submissions call Claude before responding
        proxy_read_timeout 120s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/creatorfeed /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Smoke test through nginx before DNS changes
curl -s -o /dev/null -w "%{http_code}\n" -H "Host: feed.creedom.ai" http://127.0.0.1/
```

The old server's nginx also routed `/api/backend/` to a separate service on
port 4000. That service isn't part of this repo. Confirm whether it's still
needed before turning the old VPS off.

Google login can't be tested until the domain points here and TLS works
(Google only accepts the `https://feed.creedom.ai/...` redirect URI).

## 9. Cutover

Do these in order.

1. **A day ahead (optional):** lower the TTL of the `feed.creedom.ai` DNS record to 300 seconds so the switch spreads fast.
2. **Pause the seed job:** GitHub → Actions → *Seed Creator Debates* → **Disable workflow**, so nothing writes to Supabase mid-copy.
3. **Final data refresh**, from the laptop that ran the original migration (it needs `SUPABASE_DB_URL` and `CLOUDSQL_DB_URL` in `.env.local`, and its IP must still be in Cloud SQL's authorized networks):
   ```bash
   scripts/migrate-to-cloudsql.sh --reset
   ```
   It only reads from Supabase. It replaces all CreatorFeed tables in Cloud SQL with
   Supabase's current data and prints a row-count comparison. Every line must say `ok`.
   Accounts created while testing against Cloud SQL are wiped; sign in again afterwards.
4. **Restart the app** so caches don't serve pre-refresh data: `sudo -iu creatorfeed pm2 restart creatorfeed`
5. **Switch DNS:** at your DNS provider, set the `A` record for `feed.creedom.ai` to the VM's static IP (and remove any `AAAA` record that still points at the old server). Check with `dig +short feed.creedom.ai`.
6. **TLS certificate**, once DNS resolves to the VM:
   ```bash
   sudo certbot --nginx -d feed.creedom.ai --redirect -m <your-email> --agree-tos
   ```
   Certbot adds the 443 server block and the HTTP→HTTPS redirect, and installs a renewal timer (`systemctl list-timers | grep certbot`).
7. **Smoke test** at `https://feed.creedom.ai`: home feed, a debate page, Google sign-in, post and delete a reply, `/my-debates`, `/sitemap.xml`.

## 10. After cutover

1. **GitHub secrets** (repo → Settings → Secrets and variables → Actions):
   - `INTERNAL_API_KEY`: the same value as on the VM
   - `APP_URL`: `https://feed.creedom.ai`
   - `ANTHROPIC_API_KEY`: unchanged
   - Delete `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

   Then re-enable the *Seed Creator Debates* workflow and run it once by hand (**Run workflow**).
2. **Close Cloud SQL's public IP:** SQL → creatorfeed-db → Connections → Networking → untick **Public IP** → Save. From then on the database is only reachable from inside the VPC. For future manual access, run `psql` on the VM, or use the Cloud SQL Auth Proxy.
3. **Keep the fallbacks for two weeks, then remove them:**
   - DigitalOcean VPS: stop it, and delete it once nothing is missed (including the `/api/backend/` service).
   - Supabase: leave it untouched (read-only) as a fallback, then pause or delete the project.
4. **Change Cloud SQL passwords** if they were ever pasted anywhere other than env files.

## Deploying updates

```bash
sudo -iu creatorfeed
cd /var/www/creatorfeed
git pull origin main
npm ci                     # only needed when package-lock.json changed
npm run build
pm2 restart creatorfeed
pm2 logs creatorfeed --lines 50
```

## Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| `DATABASE_CA_CERT is required for SSL connections` | `DATABASE_CA_CERT` missing from `.env.production.local`, or the file path is wrong. |
| `self-signed certificate` / `unable to verify` | The PEM isn't the current Cloud SQL server CA. Download it again (section 4). |
| Connection timeout to `10.34.113.3` | The VM isn't on the `default` VPC, or isn't in a region with access to it. |
| `password authentication failed` | Wrong `creatorfeed_app` password, or special characters not URL-encoded in `DATABASE_URL`. |
| 502 Bad Gateway | The app isn't running: `sudo -iu creatorfeed pm2 status` / `pm2 logs creatorfeed`. |
| Google `redirect_uri_mismatch` | `AUTH_URL` missing (callback becomes `http://localhost:3000/...`; check `curl -s localhost:3000/api/auth/providers`), or the OAuth client lacks `https://feed.creedom.ai/api/auth/callback/google`. |
| Login loop / `MissingSecret` | `AUTH_SECRET` not set; restart PM2 after editing env. |
| Build killed / exit 137 | Out of memory: check swap (`free -h`) or use a larger machine type. |
| Debates stay in "debating" | `INTERNAL_API_KEY` missing or different between callers; check `pm2 logs` for `Unauthorized attempt to trigger debate engine`. |
