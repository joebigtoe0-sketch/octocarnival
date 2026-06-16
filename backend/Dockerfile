FROM node:20-bookworm-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips42 \
    && rm -rf /var/lib/apt/lists/*

# Monorepo build: backend service + rat sprite PNGs for NFT compositing
COPY package*.json ./
COPY backend/package*.json ./backend/
RUN npm install --ignore-scripts --workspace=scraprats-backend

COPY backend ./backend
COPY frontend/public/assets/sprites ./frontend/public/assets/sprites
RUN node backend/scripts/bundle-sprites.js

WORKDIR /app/backend
RUN node scripts/ensure-uuid-cjs.js && npm rebuild sharp
RUN chmod +x start.sh

CMD ["sh", "start.sh"]
