#!/bin/bash

# ETIM Classifier - Installation Script for Ubuntu 24.04 Server
# This script installs and configures the ETIM Classifier with ETIM International API support

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===========================================${NC}"
echo -e "${BLUE}    ETIM Classifier - Ubuntu 24.04 Setup   ${NC}"
echo -e "${BLUE}    with ETIM International API Support     ${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root or with sudo${NC}"
   exit 1
fi

# Configuration
APP_NAME="etim-classifier"
APP_DIR="/var/www/$APP_NAME"
SERVICE_USER="www-data"
NODE_VERSION="20"

# Update system
echo -e "${GREEN}Updating system packages...${NC}"
apt update && apt upgrade -y

# Install dependencies
echo -e "${GREEN}Installing system dependencies...${NC}"
apt install -y curl wget git nginx build-essential

# Install Node.js 20.x
echo -e "${GREEN}Installing Node.js $NODE_VERSION...${NC}"
curl -fsSL https://deb.nodesource.com/setup_$NODE_VERSION.x | bash -
apt install -y nodejs

# Verify Node.js installation
node_version=$(node --version)
npm_version=$(npm --version)
echo -e "${GREEN}✓ Node.js installed: $node_version${NC}"
echo -e "${GREEN}✓ npm installed: $npm_version${NC}"

# Create application directory
echo -e "${GREEN}Creating application directory...${NC}"
mkdir -p $APP_DIR
chown $SERVICE_USER:$SERVICE_USER $APP_DIR

# Copy application files
echo -e "${GREEN}Copying application files...${NC}"
cp -r . $APP_DIR/
chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR

# Install npm dependencies
echo -e "${GREEN}Installing npm dependencies...${NC}"
cd $APP_DIR
sudo -u $SERVICE_USER npm install

# Build the application
echo -e "${GREEN}Building the application...${NC}"
sudo -u $SERVICE_USER npm run build

# Create systemd service
echo -e "${GREEN}Creating systemd service...${NC}"
cat > /etc/systemd/system/$APP_NAME.service << EOF
[Unit]
Description=ETIM Classifier Server
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node dist/api/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3001

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=$APP_DIR/logs
ProtectHome=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictRealtime=true
RestrictNamespaces=true
LockPersonality=true
MemoryDenyWriteExecute=true
RestrictAddressFamilies=AF_INET AF_INET6 AF_UNIX
SystemCallFilter=@system-service
SystemCallErrorNumber=EPERM

[Install]
WantedBy=multi-user.target
EOF

# Configure nginx
echo -e "${GREEN}Configuring nginx...${NC}"
cat > /etc/nginx/sites-available/$APP_NAME << EOF
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://etimapi.etim-international.com https://etimauth.etim-international.com;" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_buffering off;
        proxy_request_buffering off;
        
        # Timeouts for API calls to ETIM
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        access_log off;
    }
    
    # Static files
    location / {
        root $APP_DIR/dist;
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Security - block access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location ~ ~$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
EOF

# Enable nginx site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/

# Remove default nginx site
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Create log directory
mkdir -p $APP_DIR/logs
chown $SERVICE_USER:$SERVICE_USER $APP_DIR/logs

# Configure firewall
echo -e "${GREEN}Configuring firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Reload systemd and start services
echo -e "${GREEN}Starting services...${NC}"
systemctl daemon-reload
systemctl enable $APP_NAME
systemctl start $APP_NAME

# Restart nginx
systemctl restart nginx

# Create environment configuration script
echo -e "${GREEN}Creating ETIM API configuration script...${NC}"
cat > $APP_DIR/configure-etim-api.sh << 'EOF'
#!/bin/bash

# ETIM Classifier Environment Configuration Script for Ubuntu 24.04
# This script creates the .env file with ETIM International API configuration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== ETIM Classifier Environment Configuration ===${NC}"
echo ""

# Check if running as root or with sudo
if [[ $EUID -ne 0 ]]; then
   echo -e "${YELLOW}This script should be run as root or with sudo${NC}"
   exit 1
fi

# Configuration
APP_DIR="/var/www/etim-classifier"
ENV_FILE="$APP_DIR/.env"
SERVICE_USER="www-data"

# Check if application directory exists
if [[ ! -d "$APP_DIR" ]]; then
    echo -e "${RED}Error: Application directory $APP_DIR does not exist${NC}"
    echo "Please run the installation script first."
    exit 1
fi

echo -e "${GREEN}Configuring ETIM International API...${NC}"
echo ""

# Function to get user input
get_input() {
    local prompt="$1"
    local default="$2"
    local input
    
    if [[ -n "$default" ]]; then
        read -p "$prompt [$default]: " input
        echo "${input:-$default}"
    else
        read -p "$prompt: " input
        echo "$input"
    fi
}

# Get ETIM API configuration from user
echo -e "${YELLOW}ETIM International API Configuration${NC}"
echo "Please enter your ETIM API credentials (you can leave empty for now and edit .env later)"
echo ""

ETIM_CLIENT_ID=$(get_input "ETIM Client ID" "")
ETIM_CLIENT_SECRET=$(get_input "ETIM Client Secret" "")
ETIM_AUTH_URL=$(get_input "ETIM Auth URL" "https://etimauth.etim-international.com")
ETIM_BASE_URL=$(get_input "ETIM API Base URL" "https://etimapi.etim-international.com")
ETIM_SCOPE=$(get_input "ETIM Scope" "EtimApi")

# Get server configuration
SERVER_PORT=$(get_input "Server Port" "3001")
SERVER_HOST=$(get_input "Server Host" "0.0.0.0")
NODE_ENV=$(get_input "Node Environment" "production")
DEFAULT_DATA_SOURCE=$(get_input "Default Data Source (local/dataset/api)" "local")

# Create .env file
echo -e "${GREEN}Creating .env file...${NC}"
cat > "$ENV_FILE" << EOF
# ETIM International API Configuration
ETIM_AUTH_URL=$ETIM_AUTH_URL
ETIM_BASE_URL=$ETIM_BASE_URL
ETIM_CLIENT_ID=$ETIM_CLIENT_ID
ETIM_CLIENT_SECRET=$ETIM_CLIENT_SECRET
ETIM_SCOPE=$ETIM_SCOPE

# Server Configuration
PORT=$SERVER_PORT
HOST=$SERVER_HOST
NODE_ENV=$NODE_ENV

# Data Sources Priority (local, dataset, api)
DEFAULT_DATA_SOURCE=$DEFAULT_DATA_SOURCE

# Security
# Add any additional security-related environment variables here

# Logging
LOG_LEVEL=info

# Cache Settings
CACHE_TTL=3600
ENABLE_CACHE=true
EOF

# Set proper permissions
chown "$SERVICE_USER:$SERVICE_USER" "$ENV_FILE"
chmod 600 "$ENV_FILE"

echo -e "${GREEN}✓ .env file created successfully${NC}"
echo "Location: $ENV_FILE"
echo ""

# Display configuration summary
echo -e "${GREEN}Configuration Summary:${NC}"
echo "ETIM Auth URL: $ETIM_AUTH_URL"
echo "ETIM API URL: $ETIM_BASE_URL"
echo "Client ID: $([ -n "$ETIM_CLIENT_ID" ] && echo "✓ Configured" || echo "✗ Not configured")"
echo "Client Secret: $([ -n "$ETIM_CLIENT_SECRET" ] && echo "✓ Configured" || echo "✗ Not configured")"
echo "Server Port: $SERVER_PORT"
echo "Server Host: $SERVER_HOST"
echo "Environment: $NODE_ENV"
echo "Default Data Source: $DEFAULT_DATA_SOURCE"
echo ""

# Check if credentials are configured
if [[ -n "$ETIM_CLIENT_ID" && -n "$ETIM_CLIENT_SECRET" ]]; then
    echo -e "${GREEN}✓ ETIM API credentials are configured${NC}"
    echo "The application can now connect to ETIM International API."
else
    echo -e "${YELLOW}⚠ ETIM API credentials are not configured${NC}"
    echo "To enable ETIM International API integration:"
    echo "1. Request your client_id and client_secret from ETIM International"
    echo "2. Edit the .env file: sudo nano $ENV_FILE"
    echo "3. Restart the service: sudo systemctl restart etim-classifier"
fi

echo ""
echo -e "${GREEN}✓ Environment configuration completed successfully!${NC}"
echo "The application will automatically load these settings on next restart."

# Optional: Test the configuration
read -p "Would you like to test the configuration now? (y/N): " test_config
if [[ "$test_config" =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${GREEN}Testing configuration...${NC}"
    
    # Test if service is running
    if systemctl is-active --quiet etim-classifier; then
        echo "Service is running. Testing API endpoint..."
        sleep 2
        curl -s "http://localhost:$SERVER_PORT/api/etim/config" | python3 -m json.tool
    else
        echo -e "${YELLOW}Service is not running. Start it with: sudo systemctl start etim-classifier${NC}"
    fi
fi

echo ""
echo -e "${GREEN}=== Configuration Complete ===${NC}"
EOF

chmod +x $APP_DIR/configure-etim-api.sh

# Final status check
echo ""
echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}✓ Installation completed successfully!${NC}"
echo -e "${GREEN}===========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Configure ETIM International API:"
echo "   sudo $APP_DIR/configure-etim-api.sh"
echo ""
echo "2. Check service status:"
echo "   sudo systemctl status $APP_NAME"
echo ""
echo "3. View logs:"
echo "   sudo journalctl -u $APP_NAME -f"
echo ""
echo "4. Access the application:"
echo "   http://your-server-ip"
echo ""
echo "5. Test API endpoints:"
echo "   curl http://localhost:3001/health"
echo "   curl http://localhost:3001/api/etim/config"
echo ""
echo -e "${YELLOW}For ETIM International API integration:${NC}"
echo "- Request your client_id and client_secret from ETIM International"
echo "- Run the configuration script to set up API access"
echo "- The application supports automatic fallback to local data if API is unavailable"
echo ""
echo -e "${GREEN}✓ ETIM Classifier is ready for production use!${NC}"