FROM node:22.13.1-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json ./
RUN npm install --production

# Copy source
COPY src/ ./src/

# Create data directory for SQLite volume mount
RUN mkdir -p /app/data

EXPOSE 3001

CMD ["node", "src/index.js"]
