# VPSデプロイ手順

この手順は、VPS上で Docker Compose + Nginx + Let's Encrypt を使って FishDex を公開する想定です。

## 1. ドメインを用意する

ドメインのDNSで、VPSのIPv4アドレスへ `A` レコードを向けます。

```text
fisdexfordiving.sbs      A      162.43.22.161
www.fisdexfordiving.sbs  A      162.43.22.161
```

ドメインは `fisdexfordiving.sbs`、VPSのIPv4は `162.43.22.161` です。

## 2. VPSに必要なものを入れる

Ubuntu系の例です。

```bash
sudo apt update
sudo apt install -y git nginx certbot python3-certbot-nginx docker.io docker-compose-plugin
sudo systemctl enable --now docker nginx
```

## 3. アプリを配置する

```bash
git clone https://github.com/IwaneDaigo/fishdex.git
cd fishdex
cp .env.example .env.production
```

`.env.production` に本番値を入れます。

```bash
NEXT_PUBLIC_SUPABASE_URL=https://enfdppddlmicnnrxsdmh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=<Google AI Studioで作成したAPIキー>
USE_GEMINI_MOCK=false
```

Geminiを使わず固定候補で試す場合は、`GEMINI_API_KEY=` を空にして `USE_GEMINI_MOCK=true` にします。

## 4. Dockerで起動する

```bash
docker compose up -d --build
docker compose logs -f fishdex
```

ローカル確認:

```bash
curl -I http://127.0.0.1:3001
```

## 5. Nginxを設定する

```bash
sudo cp deploy/nginx/fishdex.conf /etc/nginx/sites-available/fishdex
sudo ln -s /etc/nginx/sites-available/fishdex /etc/nginx/sites-enabled/fishdex
sudo nginx -t
sudo systemctl reload nginx
```

## 6. HTTPS化する

```bash
sudo certbot --nginx -d fisdexfordiving.sbs -d www.fisdexfordiving.sbs
```

## 更新するとき

```bash
cd fishdex
git pull
docker compose up -d --build
```

## よく見るログ

```bash
docker compose logs -f fishdex
sudo tail -f /var/log/nginx/error.log
```
