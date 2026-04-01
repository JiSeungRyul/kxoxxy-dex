#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

SKIP_COMPOSE=0

usage() {
  cat <<'EOF'
Usage:
  sh scripts/setup-local-db.sh
  sh scripts/setup-local-db.sh --skip-compose

Options:
  --skip-compose   Skip `docker compose up -d` and only run migrate + seed.
EOF
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

wait_for_db() {
  container_id=$(docker compose ps -q db)

  if [ -z "$container_id" ]; then
    echo "Could not find the db container from docker compose." >&2
    exit 1
  fi

  echo "Waiting for PostgreSQL to become healthy..."

  attempts=0
  while [ "$attempts" -lt 30 ]; do
    health_status=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$container_id")

    if [ "$health_status" = "healthy" ] || [ "$health_status" = "running" ]; then
      echo "PostgreSQL is ready."
      return 0
    fi

    attempts=$((attempts + 1))
    sleep 2
  done

  echo "PostgreSQL did not become ready in time." >&2
  exit 1
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --skip-compose)
      SKIP_COMPOSE=1
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
  shift
done

require_command npm

cd "$REPO_ROOT"

if [ "$SKIP_COMPOSE" -eq 0 ]; then
  require_command docker
  echo "Starting PostgreSQL with Docker Compose..."
  docker compose up -d
  wait_for_db
else
  echo "Skipping Docker Compose startup."
fi

echo "Applying database migrations..."
npm run db:migrate

echo "Seeding Pokedex catalog data..."
npm run db:seed:pokedex

echo "Local database setup completed."
