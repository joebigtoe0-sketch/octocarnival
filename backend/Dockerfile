FROM node:20-bookworm-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips42 \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --ignore-scripts

COPY . .
RUN node scripts/ensure-uuid-cjs.js && npm rebuild sharp
RUN chmod +x start.sh

# Mint compositing needs bundled rat sprites (backend/assets/sprites in repo)
RUN test -d assets/sprites && ls assets/sprites/*.png >/dev/null

CMD ["sh", "start.sh"]
