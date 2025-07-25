# --- backend ---
FROM node:18-alpine

WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm prisma generate

EXPOSE 4000
CMD ["pnpm", "dev"]       # o "node dist/index.js" si compilas
