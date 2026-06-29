FROM oven/bun:1.3 AS base

FROM base AS builder

RUN apt-get update
RUN apt-get install -y --no-install-recommends libc6

# Set working directory
WORKDIR /app

# Replace <your-major-version> with the major version installed in your repository. For example:
# RUN bun install -g turbo@^2
RUN bun install -g turbo@2.9.14
COPY . .

# Generate a partial monorepo with a pruned lockfile for a target workspace.
# Assuming "web" is the name entered in the project's package.json: { name: "web" }
RUN turbo prune web --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
WORKDIR /app

# First install the dependencies (as they change less often)
COPY --from=builder /app/out/json/ .
RUN bun install -g turbo@2.9.15
RUN bun install


# Build the project
COPY --from=builder /app/out/full/ .

ENV NODE_ENV="production"
RUN turbo run build

FROM base AS runner
WORKDIR /app

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=installer /app/apps/web/.next/standalone ./
COPY --from=installer /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer /app/apps/web/public ./apps/web/public

ENV PORT=${PORT}
ENV HOSTNAME="0.0.0.0"
ENV NODE_ENV="production"

EXPOSE ${PORT}

CMD bun apps/web/server.js -p ${PORT} -H 0.0.0.0
