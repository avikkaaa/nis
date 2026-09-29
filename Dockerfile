FROM node:22-bookworm-slim AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client ./
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY
RUN npm run build

FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --omit=dev
COPY server ./
COPY --from=client-build /app/client/dist /app/client/dist
ENV PORT=8080
EXPOSE 8080
CMD ["node","src/index.js"]
