# Install dependencies only when needed
FROM node:alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN yarn build && yarn install --production --ignore-scripts --prefer-offline

FROM node:alpine AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/certs/ ./certs/

RUN apk --update add redis

USER nextjs

ENV TEBEX_SECRET ""
ENV CRAFTING_STORE_SECRET ""
ENV COIN_KEY ""
ENV COIN_SECRET ""
ENV COIN_MERCHANT_ID ""
ENV COIN_IPN_SECRET ""
ENV PORT 3000
ENV NODE_ENV=production

EXPOSE 3000

# You don't need to install & run a Redis server but it's for local testing
CMD redis-server & node server.js