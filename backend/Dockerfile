FROM node:20-bookworm-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips42 \
    && rm -rf /var/lib/apt/lists/*

# Install deps before full copy, but skip postinstall (scripts/ not present yet)
COPY package*.json ./
RUN npm install --ignore-scripts

COPY . .
RUN node scripts/ensure-uuid-cjs.js && npm rebuild sharp
RUN chmod +x start.sh

CMD ["sh", "start.sh"]
