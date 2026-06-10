FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD sh -c "node src/db/migrate.js; node src/index.js"
