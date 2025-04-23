#!/bin/bash

# Exit on error
set -e

# Configuration
APP_NAME="gocloser"
APP_DIR="/var/www/gocloser"
REPO_URL="your-repository-url"
BRANCH="main"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment of $APP_NAME...${NC}"

# Check if the application directory exists
if [ ! -d "$APP_DIR" ]; then
  echo -e "${GREEN}Creating application directory...${NC}"
  mkdir -p $APP_DIR
  cd $APP_DIR
  git clone $REPO_URL .
  git checkout $BRANCH
else
  echo -e "${GREEN}Updating existing application...${NC}"
  cd $APP_DIR
  git fetch
  git checkout $BRANCH
  git pull origin $BRANCH
fi

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
npm ci

# Build the application
echo -e "${GREEN}Building the application...${NC}"
npm run build

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
  echo -e "${GREEN}Installing PM2...${NC}"
  npm install -g pm2
fi

# Set up environment variables
echo -e "${GREEN}Setting up environment variables...${NC}"
if [ ! -f ".env.production" ]; then
  echo -e "${RED}Warning: .env.production file not found. Creating a template...${NC}"
  echo "NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key" > .env.production
  echo -e "${RED}Please update the .env.production file with your actual API keys.${NC}"
fi

# Start or restart the application with PM2
echo -e "${GREEN}Starting the application with PM2...${NC}"
if pm2 list | grep -q "$APP_NAME"; then
  pm2 restart $APP_NAME
else
  pm2 start npm --name "$APP_NAME" -- run start:prod
fi

# Set up Nginx if the configuration file exists
if [ -f "nginx.conf" ]; then
  echo -e "${GREEN}Setting up Nginx...${NC}"
  sudo cp nginx.conf /etc/nginx/sites-available/$APP_NAME
  
  # Create symbolic link if it doesn't exist
  if [ ! -f "/etc/nginx/sites-enabled/$APP_NAME" ]; then
    sudo ln -s /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
  fi
  
  # Test Nginx configuration
  echo -e "${GREEN}Testing Nginx configuration...${NC}"
  sudo nginx -t
  
  # Reload Nginx
  echo -e "${GREEN}Reloading Nginx...${NC}"
  sudo systemctl reload nginx
fi

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Your application should now be running at your domain.${NC}"
echo -e "${GREEN}If you haven't set up SSL yet, consider running:${NC}"
echo -e "${GREEN}sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com${NC}"
