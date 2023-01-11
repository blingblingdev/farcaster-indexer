FROM --platform=linux/amd64 node:16-alpine AS deps
# RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json yarn.lock prisma ./
RUN yarn --prod

FROM --platform=linux/amd64 node:16-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN yarn build

FROM --platform=linux/amd64 node:16-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 aegis
RUN adduser --system --uid 1001 aegis
RUN chown aegis /app
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules

USER aegis

CMD ["node", "dist/index.js"]