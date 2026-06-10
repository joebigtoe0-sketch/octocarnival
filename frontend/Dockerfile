FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["sh", "-c", "npx serve dist -s -l tcp://0.0.0.0:${PORT:-3000}"]
