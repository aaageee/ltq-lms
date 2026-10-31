FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# uploads dibuat & dimount sebagai volume
RUN mkdir -p /app/uploads

ENV NODE_ENV=production
EXPOSE 4000

# migrate deploy saat container start (butuh DATABASE_URL), lalu jalankan server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
