# 1. Build stage
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV VITE_API_URL=/api
RUN npm run build

# 2. Production stage
FROM nginx:alpine

# Zkopírujeme buildnutou aplikaci
COPY --from=build /app/dist /usr/share/nginx/html

# !!! ZDE JE ZMĚNA !!!
# Kopírujeme šablonu do složky templates. 
# Nginx při startu vezme ENV proměnné, dosadí je a vygeneruje /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Defaultně Nginx v Dockeru exponuje 80, my to ale budeme řídit přes ENV
CMD ["nginx", "-g", "daemon off;"]