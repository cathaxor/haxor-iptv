# Haxor IPTV CMS 📺

A high-performance, production-ready IPTV Content Management System with a modern, TiviMate-inspired user interface. Built with React, Tailwind CSS, Node.js, Express, and MariaDB.

## Features ✨

### Admin Panel
- **M3U Playlist Management**: Upload local files or import remote URLs.
- **Auto-Refresh**: Background cron jobs to automatically update URL-based playlists.
- **XMLTV EPG Support**: Stream parsing of huge XMLTV files with auto-refresh.
- **Channel & Category Management**: Search, filter, disable/enable streams, and override categories.
- **Dashboard & Analytics**: View stream quality breakdowns, user activity, and system stats.
- **User Management**: Role-based access (admin/user) with activity tracking.

### User Interface
- **TiviMate-Inspired Design**: Glassmorphism, smooth animations, and a rich dark theme.
- **Live TV Player**: Built-in HLS.js player for seamless `.m3u8` stream playback.
- **Favorites & Watch History**: Keep track of loved channels and recently watched streams.
- **Fast Search**: Debounced, responsive full-text channel search.

## Tech Stack 🛠

- **Frontend**: React 18, Vite, Tailwind CSS, React Router, HLS.js
- **Backend**: Node.js 22, Express, MariaDB, JWT, node-cron
- **Parsers**: Custom regex-based M3U parser, `sax` based XMLTV streaming parser
- **Caching**: `node-cache` for high-performance data retrieval
- **Process Manager**: PM2 Cluster Mode

## Installation Guide (Debian 12) 🚀

### 1. Prerequisites
Ensure you have Node.js 22, MariaDB, and Nginx installed.
```bash
# Install Node 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs nginx mariadb-server pm2
```

### 2. Database Setup
```bash
sudo mysql -u root
```
```sql
CREATE DATABASE haxor_iptv;
CREATE USER 'haxor'@'localhost' IDENTIFIED BY 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON haxor_iptv.* TO 'haxor'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```
Import the schema and seed data:
```bash
mysql -u haxor -p haxor_iptv < database/schema.sql
mysql -u haxor -p haxor_iptv < database/seed.sql
```
*Note: The default admin login is `admin` / `Admin@Haxor2024!`*

### 3. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials and strong JWT secrets
npm install
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
npm run build
```

### 5. Deployment
We recommend placing the app in `/var/www/haxor-iptv`.

**Start the Backend with PM2:**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**Configure Nginx:**
Copy `nginx.conf` to your Nginx sites-available:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/haxor-iptv
sudo ln -s /etc/nginx/sites-available/haxor-iptv /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Secure with Let's Encrypt (Certbot):**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d iptv.cathaxor.com
```

## Docker Deployment 🐳

You can also deploy the entire stack using the provided `docker-compose.yml`.

```bash
docker-compose up -d --build
```
This will spin up the MariaDB database, the Node.js backend cluster, and an Nginx container serving the built frontend.

---
**CatHaxor Security** - Code gracefully.
