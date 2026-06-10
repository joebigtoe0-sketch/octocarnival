#!/bin/sh
echo "==> Running migrations..."
node src/db/migrate.js
echo "==> Starting server..."
node src/index.js
