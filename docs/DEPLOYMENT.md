# Deployment Guide

## Local Development

### 1. Start the Proxy

```bash
cd /Users/mac/Sync/project/drsell/chatbot-node
npm run dev
```

Server starts on `http://localhost:3000`

### 2. Verify It's Running

```bash
curl http://localhost:3000/health

# Should return:
{
  "status": "ok",
  "timestamp": "2025-10-28T08:28:00.699Z",
  "uptime": 2.98,
  "backend": "http://localhost:48080"
}
```

### 3. Test with Backend

Ensure chatbotadmin is running:
```bash
curl http://localhost:48080/actuator/health
```

If not running:
```bash
cd /Users/mac/Sync/project/drsell/chatbotadmin
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
mvn spring-boot:run -pl yudao-server -Dspring-boot.run.profiles=local
```

---

## Production Deployment

### Option 1: Standalone Node.js

```bash
# Build
npm run build

# Set environment
export NODE_ENV=production
export BACKEND_URL=https://chatbotadmin.fly.dev
export PORT=3000
export LOG_LEVEL=warn
export CORS_ORIGIN=https://myapp.com

# Run
npm start
```

### Option 2: PM2 Process Manager

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'chatbot-proxy',
    script: 'dist/index.js',
    instances: 2,
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      BACKEND_URL: 'https://chatbotadmin.fly.dev',
      LOG_LEVEL: 'warn',
    }
  }]
};
EOF

# Start
pm2 start ecosystem.config.js --env production

# Monitor
pm2 status
pm2 logs chatbot-proxy

# Auto-restart on server reboot
pm2 startup
pm2 save
```

### Option 3: Docker

```bash
# Build image
docker build -t chatbot-node:latest .

# Run container
docker run -d \
  --name chatbot-proxy \
  -p 3000:3000 \
  -e BACKEND_URL=https://chatbotadmin.fly.dev \
  -e NODE_ENV=production \
  -e LOG_LEVEL=warn \
  -e CORS_ORIGIN=https://myapp.com \
  -v $(pwd)/config:/app/config:ro \
  --restart unless-stopped \
  chatbot-node:latest

# View logs
docker logs -f chatbot-proxy

# Stop
docker stop chatbot-proxy

# Remove
docker rm chatbot-proxy
```

### Option 4: Fly.io Deployment

```bash
# Create fly.toml
cat > fly.toml << 'EOF'
app = "chatbot-proxy"
primary_region = "sin"

[build]
  dockerfile = "Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "8080"
  LOG_LEVEL = "warn"
  DEFAULT_TENANT_ID = "1"

[[services]]
  internal_port = 8080
  protocol = "tcp"
  auto_stop_machines = false
  auto_start_machines = true
  min_machines_running = 1

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [[services.http_checks]]
    interval = "30s"
    grace_period = "10s"
    method = "get"
    path = "/health"
    timeout = "5s"

[[vm]]
  memory_mb = 512
  cpu_kind = "shared"
  cpus = 1
EOF

# Launch
fly launch --no-deploy

# Set secrets
fly secrets set \
  BACKEND_URL=https://chatbotadmin.fly.dev \
  COZE_CLIENT_ID=1133483935040 \
  COZE_PUBLIC_KEY=_VzHkKSlwVT2yfAcNrZraFCpusQjQ7pXpEagzYheN7s \
  COZE_BASE_URL=https://api.coze.cn

# Deploy
fly deploy

# Check status
fly status

# View logs
fly logs
```

---

## Nginx Reverse Proxy

### Configuration

```nginx
# /etc/nginx/sites-available/chatbot-proxy
upstream chatbot_proxy {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.myapp.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.myapp.com;

    ssl_certificate /etc/ssl/certs/myapp.crt;
    ssl_certificate_key /etc/ssl/private/myapp.key;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Proxy to Node.js
    location /api/ {
        proxy_pass http://chatbot_proxy;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # SSE support
        proxy_buffering off;
        proxy_read_timeout 3600s;
        proxy_connect_timeout 3600s;
        
        # CORS headers (if needed)
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, POST, PUT, DELETE, OPTIONS';
        add_header Access-Control-Allow-Headers 'Authorization, Content-Type, tenant-id';
    }

    # Health check
    location /health {
        proxy_pass http://chatbot_proxy/health;
        access_log off;
    }
}
```

Enable and reload:
```bash
sudo ln -s /etc/nginx/sites-available/chatbot-proxy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Systemd Service

Create `/etc/systemd/system/chatbot-proxy.service`:

```ini
[Unit]
Description=Chatbot Node Proxy
After=network.target

[Service]
Type=simple
User=nodejs
WorkingDirectory=/opt/chatbot-node
Environment="NODE_ENV=production"
Environment="BACKEND_URL=http://localhost:48080"
Environment="PORT=3000"
Environment="LOG_LEVEL=warn"
ExecStart=/usr/bin/node /opt/chatbot-node/dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=chatbot-proxy

[Install]
WantedBy=multi-user.target
```

Manage service:
```bash
sudo systemctl enable chatbot-proxy
sudo systemctl start chatbot-proxy
sudo systemctl status chatbot-proxy
sudo journalctl -u chatbot-proxy -f
```

---

## Kubernetes Deployment

### Deployment YAML

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chatbot-proxy
  labels:
    app: chatbot-proxy
spec:
  replicas: 3
  selector:
    matchLabels:
      app: chatbot-proxy
  template:
    metadata:
      labels:
        app: chatbot-proxy
    spec:
      containers:
      - name: chatbot-proxy
        image: chatbot-node:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: BACKEND_URL
          value: "http://chatbotadmin-service:48080"
        - name: LOG_LEVEL
          value: "warn"
        - name: COZE_CLIENT_ID
          valueFrom:
            secretKeyRef:
              name: coze-secrets
              key: client-id
        - name: COZE_PUBLIC_KEY
          valueFrom:
            secretKeyRef:
              name: coze-secrets
              key: public-key
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: chatbot-proxy-service
spec:
  selector:
    app: chatbot-proxy
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

Deploy:
```bash
kubectl apply -f k8s/deployment.yaml
kubectl get pods
kubectl logs -f deployment/chatbot-proxy
```

---

## Environment-Specific Configuration

### Development

```bash
NODE_ENV=development
BACKEND_URL=http://localhost:48080
PORT=3000
LOG_LEVEL=debug
CORS_ORIGIN=*
```

### Staging

```bash
NODE_ENV=staging
BACKEND_URL=https://chatbotadmin-staging.example.com
PORT=3000
LOG_LEVEL=info
CORS_ORIGIN=https://staging.myapp.com
```

### Production

```bash
NODE_ENV=production
BACKEND_URL=https://chatbotadmin.fly.dev
PORT=8080
LOG_LEVEL=warn
CORS_ORIGIN=https://myapp.com,https://www.myapp.com
```

---

## Monitoring & Logging

### Log Aggregation with LogDNA

```bash
# Install LogDNA agent
npm install --save @logdna/logger

# src/lib/logger.ts
import logdna from '@logdna/logger';

if (config.server.env === 'production') {
  const logdnaLogger = logdna.createLogger(process.env.LOGDNA_API_KEY, {
    app: 'chatbot-proxy',
    env: config.server.env,
  });
  
  // Send logs to LogDNA
  logger.on('data', (log) => {
    logdnaLogger.log(log.message, { meta: log });
  });
}
```

### Prometheus Metrics

```typescript
// src/lib/metrics.ts
import promClient from 'prom-client';

const register = new promClient.Registry();

export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Add /metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

---

## Health Checks

The `/health` endpoint returns:

```json
{
  "status": "ok",
  "timestamp": "2025-10-28T08:28:00.699Z",
  "uptime": 2.98,
  "backend": "http://localhost:48080"
}
```

Use this for:
- Load balancer health checks
- Kubernetes liveness/readiness probes
- Uptime monitoring (Pingdom, UptimeRobot)
- CI/CD deployment verification

---

## Security Hardening

### 1. Use HTTPS in Production

```bash
# Let's Encrypt with certbot
sudo certbot --nginx -d api.myapp.com
```

### 2. Disable CORS in Production

```bash
# Only allow specific origins
CORS_ORIGIN=https://myapp.com
```

### 3. Add Rate Limiting

Install `express-rate-limit`:
```bash
npm install express-rate-limit
```

Add to `src/app.ts`:
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 4. Helmet Configuration

Already included, but can customize:
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));
```

### 5. Secure Private Keys

```bash
# Set restrictive permissions
chmod 600 config/coze-private-key.pem

# Never commit to git
echo "config/*.pem" >> .gitignore
```

---

## Performance Tuning

### 1. Enable Compression

```bash
npm install compression
```

```typescript
import compression from 'compression';
app.use(compression());
```

### 2. Cluster Mode

```typescript
// src/cluster.ts
import cluster from 'cluster';
import os from 'os';

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} died, restarting...`);
    cluster.fork();
  });
} else {
  require('./index');
}
```

Run:
```bash
node dist/cluster.js
```

### 3. Connection Pooling

Already configured in Axios client with `keepalive`.

---

## Backup & Recovery

### Backup Configuration

```bash
# Backup .env and config/
tar -czf chatbot-node-config-$(date +%Y%m%d).tar.gz .env config/
```

### Disaster Recovery

```bash
# Restore from backup
tar -xzf chatbot-node-config-20251028.tar.gz

# Reinstall dependencies
npm ci --only=production

# Rebuild
npm run build

# Restart
pm2 restart chatbot-proxy
```

---

## Scaling

### Horizontal Scaling

The proxy is stateless, so you can run multiple instances:

```bash
# PM2 cluster mode (recommended)
pm2 start dist/index.js -i max

# Or Docker Swarm
docker service create \
  --name chatbot-proxy \
  --replicas 3 \
  -p 3000:3000 \
  chatbot-node:latest

# Or Kubernetes
kubectl scale deployment chatbot-proxy --replicas=5
```

### Load Balancer

nginx upstream with least connections:

```nginx
upstream chatbot_proxy {
    least_conn;
    server proxy1:3000;
    server proxy2:3000;
    server proxy3:3000;
}
```

---

## Monitoring Checklist

- [ ] Health endpoint responding
- [ ] Logs being written and aggregated
- [ ] Error rate < 1%
- [ ] Response time < 100ms (p95)
- [ ] Backend connectivity stable
- [ ] Memory usage < 200MB per instance
- [ ] CPU usage < 50% average
- [ ] No memory leaks (check with `node --inspect`)

---

## Rollback Plan

If deployment fails:

```bash
# PM2
pm2 restart chatbot-proxy --update-env

# Docker
docker stop chatbot-proxy
docker rm chatbot-proxy
docker run -d ... chatbot-node:previous-version

# Fly.io
fly releases
fly releases rollback <version>
```

---

## Cost Optimization

### Fly.io Pricing

With 512MB RAM, shared CPU:
- ~$3.50/month (single instance)
- ~$7/month (with auto-scaling)

### AWS EC2

t3.micro (1 vCPU, 1GB RAM):
- ~$7.50/month
- Can run proxy + small backend

### DigitalOcean

Basic Droplet ($6/month):
- 1 GB RAM, 1 vCPU
- Run proxy + backend + database

---

## Success Criteria

Deployment is successful when:

1. ✅ Health check returns 200
2. ✅ All 48 endpoints respond correctly
3. ✅ Authentication forwarding works
4. ✅ SSE streaming works for chat
5. ✅ File downloads work for exports
6. ✅ Logs show no errors
7. ✅ Response times < 100ms
8. ✅ Memory usage stable
9. ✅ Frontend can authenticate and call APIs
10. ✅ Graceful shutdown works

Test all criteria:
```bash
./examples/test-api.sh
```

