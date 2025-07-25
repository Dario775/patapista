# --- frontend ---
FROM node:18-alpine

WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RRUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm run build        # compila Next.js

EXPOSE 3000
CMD ["pnpm", "start"]     # o "next start" según tu script
