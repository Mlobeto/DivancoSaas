# ==============================================
# DivancoSaaS Backend - Production Dockerfile
# Uses Playwright for PDF generation
# ==============================================

FROM node:20-slim

# Install dependencies for Playwright browsers
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    fonts-noto-color-emoji \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies first (including dev for Prisma generation and build)
RUN npm install && npm cache clean --force

# Install Playwright Chromium browser in a global location
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN npx playwright install --with-deps chromium && \
    chmod -R 755 /ms-playwright

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript code (requires dev dependencies)
RUN npm run build

# Remove dev dependencies for smaller image
RUN npm prune --production

# Non-root user for security
RUN groupadd -r nodejs && useradd -r -g nodejs -m nodejs
RUN chown -R nodejs:nodejs /app

# Set Playwright browsers path for runtime
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

USER nodejs

# Expose port
EXPOSE 3000

# Health check - increased start-period and retries for Azure
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD node -e "const p=process.env.PORT||3000;require('http').get('http://localhost:'+p+'/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

# Start command: server handles DB connection and migrations internally
CMD ["npm", "run", "start"]
