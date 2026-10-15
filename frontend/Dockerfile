# Stage 1: Build the React application
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Accept the API URL as a build argument
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Serve via Nginx
FROM nginx:alpine AS runner
# Copy the compiled Vite output to the Nginx html directory
COPY --from=builder /app/dist /usr/share/nginx/html
# Override the default Nginx configuration with our SPA routing config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]