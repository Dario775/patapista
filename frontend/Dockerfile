# --- frontend ---
FROM node:18-alpine

WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build        # compila Next.js

EXPOSE 3000
CMD ["pnpm", "start"]     # o "next start" según tu script
