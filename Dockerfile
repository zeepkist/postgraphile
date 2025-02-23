# Global args, set before the first FROM, shared by all stages
ARG NODE_ENV="production"

################################################################################
# Build stage FINAL - COPY everything, once, and then do a clean `yarn install`

FROM node:22-alpine
# Import our shared args
ARG NODE_ENV

EXPOSE 5000
WORKDIR /app/
# Copy everything from stage 2, it's already been filtered
COPY --from=clean /app/ /app/

# Install yarn ASAP because it's the slowest
RUN yarn install --frozen-lockfile --production=true --no-progress

LABEL description="My PostGraphile-powered server"

# You might want to disable GRAPHILE_TURBO if you have issues
ENV GRAPHILE_TURBO=1
ENV NODE_ENV=$NODE_ENV
ENTRYPOINT yarn start
