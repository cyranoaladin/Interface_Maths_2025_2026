FROM node:20-alpine AS deps

WORKDIR /app
RUN chown node:node /app
USER node

COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder

WORKDIR /app
RUN chown node:node /app
USER node

ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

ARG NEXT_PUBLIC_BASE_PATH
ENV NEXT_PUBLIC_BASE_PATH=$NEXT_PUBLIC_BASE_PATH

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node app ./app
COPY --chown=node:node components ./components
COPY --chown=node:node lib ./lib
COPY --chown=node:node public ./public
COPY --chown=node:node next-env.d.ts next.config.mjs postcss.config.js tailwind.config.ts tsconfig.json ./
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
USER node

COPY --from=builder --chown=node:node /app/package.json /app/package-lock.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/.next ./.next

EXPOSE 3000
CMD ["npm", "start"]
