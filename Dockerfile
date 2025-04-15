FROM node:22-alpine

WORKDIR /app

# Copy files for installing dependencies
COPY package.json pnpm-lock.yaml .npmrc prisma ./

# Install pnpm
RUN corepack enable && corepack install

# Install dependencies
RUN pnpm install --frozen-lockfile

# run database 
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL
RUN npx prisma migrate deploy

# Copy all files
COPY . .

ENV PUBLIC_FONT_PROXY="1"

# Build the app
RUN pnpm run build

ENV PORT="3000"
ENV ORIGIN="https://dorkhani.ir"

# Expose port
EXPOSE 3000

# Run the app
CMD ["npm", "start"]
