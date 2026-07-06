/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static HTML export for deployment to S3 + CloudFront.
  // Remove this line if switching to a server-rendered (ECS/SSR) deployment.
  output: "export",

  // Expose the backend API base URL to the browser bundle.
  // Set NEXT_PUBLIC_API_URL at build time (e.g. the ALB DNS name).
  // Falls back to localhost for local development.
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  },
};

module.exports = nextConfig;
