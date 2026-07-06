# =============================================================================
# TraPac TAS — Frontend (Next.js static export)
# Multi-stage production build for deployment to S3 + CloudFront
# =============================================================================

# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy source
COPY . .

# NEXT_PUBLIC_API_URL must be provided at build time for static export
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

# ---- Serve stage ----
# The static output is in /app/out after `next build` with output: 'export'.
# Use a lightweight web server to serve it locally (e.g. for smoke testing),
# but the primary deployment target is S3 + CloudFront via deploy.sh.
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/out /usr/share/nginx/html

# nginx default config serves index.html for all routes
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
