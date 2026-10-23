# Base Node image
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and subpackage definitions including lockfiles
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies in their respective directories
RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# Copy full source code
COPY . .

# Build client production bundle
RUN cd client && npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Copy root dependencies and packages
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 5000

CMD ["node", "server/index.js"]

