FROM node:24.3.0-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ cairo-dev pango-dev jpeg-dev giflib-dev librsvg-dev pixman-dev
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24.3.0-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
