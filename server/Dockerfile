# Vimersion API server — zero npm dependencies, so no `npm install` step.
# node:sqlite is stable enough on Node 24 to need no flag.
FROM node:24-alpine

WORKDIR /app
COPY package.json index.mjs ./
COPY lib ./lib

# The SQLite database lives on a volume at /data; make it writable for the
# unprivileged `node` user (named volumes inherit this ownership on first use).
RUN mkdir -p /data && chown node:node /data

USER node
ENV NODE_ENV=production \
    PORT=3001 \
    DB_PATH=/data/vimersion.db

EXPOSE 3001
CMD ["node", "index.mjs"]
