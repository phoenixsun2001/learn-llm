# ============================================
# Stage 1: Build React SPA
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Build-time environment variables (Vite bakes these in)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_ADMIN_TOKEN
ENV VITE_ADMIN_TOKEN=${VITE_ADMIN_TOKEN}
ENV VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
ENV VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --production=false

# Build with env vars
COPY . .
RUN npm run build

# ============================================
# Stage 2: Serve with nginx
# ============================================
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
