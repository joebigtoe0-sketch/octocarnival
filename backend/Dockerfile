FROM node:20-bookworm-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips42 \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install && node scripts/ensure-uuid-cjs.js && npm rebuild sharp

COPY . .
RUN chmod +x start.sh

CMD ["sh", "start.sh"]
