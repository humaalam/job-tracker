# Build from the repo root, because the npm workspaces share one package-lock.json:
#   docker build -f server/Dockerfile -t job-tracker-server .
FROM node:24-slim

# Prisma's migration engine needs OpenSSL, which the slim image leaves out.
RUN apt-get update -y \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Package files first: Docker reuses this cached layer until they change, so
# editing server code doesn't reinstall every dependency.
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci --omit=dev -w server

COPY server/ server/
WORKDIR /app/server

# The Prisma client is generated code and isn't in Git. prisma.config.js loads
# our config, which requires these two variables; generate never connects.
RUN DATABASE_URL=postgresql://build JWT_SECRET=build npx prisma generate

# RDS certificates are signed by Amazon's own authority, which Node doesn't
# trust by default. Adding it lets the database connection be verified.
ADD --chmod=644 https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /app/rds-ca.pem
ENV NODE_EXTRA_CA_CERTS=/app/rds-ca.pem

ENV NODE_ENV=production
EXPOSE 4000

# The official image's unprivileged user, so a compromised app isn't root.
USER node

# Run node directly: npm doesn't pass SIGTERM on to its child process.
CMD ["node", "src/server.js"]
