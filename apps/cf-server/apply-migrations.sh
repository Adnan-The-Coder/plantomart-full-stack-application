#!/bin/bash

set -e

DB_NAME="frigus-fiesta-DB"
MIGRATIONS_DIR="./drizzle"

echo "🚀 Applying all migrations in $MIGRATIONS_DIR to local D1 DB: $DB_NAME"

for file in "$MIGRATIONS_DIR"/*.sql; do
  echo "📄 Applying migration: $file"
  wrangler d1 execute "$DB_NAME" --local --file="$file"
done

echo "✅ All migrations applied successfully."
