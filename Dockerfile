# Stage 1: Builder
FROM node:22-alpine AS builder

WORKDIR /app

# Copy files for installing dependencies
COPY package.json pnpm-lock.yaml .npmrc prisma ./

# Install pnpm
RUN corepack enable && corepack install

# Install dependencies
RUN pnpm install --frozen-lockfile

# run database migrations
RUN npx prisma migrate deploy

# Copy all files
COPY . .

# Build the app
RUN pnpm run build

# Stage 2: Runner
FROM node:22-alpine AS runner

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/.npmrc ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build

# Expose port
EXPOSE 3000

# Run the app
CMD ["npm", "start"]
