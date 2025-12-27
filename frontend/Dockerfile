# 1. Build stage (stejné jako předtím)
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Pro produkci nastavíme API URL na relativní cestu (protože Nginx to pořeší)
ENV VITE_API_URL=/api
RUN npm run build

# 2. Production stage s Nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Vytvoření konfigurace Nginx přímo v Dockerfile
# Důležité: proxy_pass odkazuje na 'http://backend:5000' (název služby z docker-compose)
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
    \
    location /api { \
        proxy_pass http://backend:5000; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]