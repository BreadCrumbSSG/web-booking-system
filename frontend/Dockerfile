# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm i
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_GOOGLE_MAPS_ID
ARG VITE_MAPS_LANGUAGE
ARG VITE_MAPS_REGION
COPY . .
# write .env for Vite build
RUN echo "VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY}" >> .env \
 && echo "VITE_GOOGLE_MAPS_ID=${VITE_GOOGLE_MAPS_ID}" >> .env \
 && echo "VITE_MAPS_LANGUAGE=${VITE_MAPS_LANGUAGE}" >> .env \
 && echo "VITE_MAPS_REGION=${VITE_MAPS_REGION}" >> .env
RUN npm run build

# Serve stage
FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY --from=build /app/dist ./
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
