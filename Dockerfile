# Frontend Dockerfile

# Stage 1: Build the Angular application
FROM node:16-alpine AS build
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build --prod

# Stage 2: Serve the application with Nginx
FROM nginx:1.21-alpine
COPY --from=build /app/dist/nordeus-challange-front /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
