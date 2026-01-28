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