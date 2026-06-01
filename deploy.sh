#!/usr/bin/env bash
set -euo pipefail

# =============================================
# Learn-LLM Docker Deployment Script
# =============================================
# Usage:
#   ./deploy.sh              # Deploy with existing config
#   ./deploy.sh --build      # Force rebuild all images
#   ./deploy.sh --down       # Stop and remove containers
#   ./deploy.sh --logs       # Tail all logs
#   ./deploy.sh --status     # Show container status
# =============================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*"; }

status() {
    echo ""
    echo "============================================"
    echo "  Learn-LLM Docker Status"
    echo "============================================"
    docker compose ps 2>/dev/null || echo "No containers running"
    echo ""
    echo "Services:"
    curl -s -o /dev/null -w "  Frontend (80):   HTTP %{http_code}\n" http://localhost:80/ 2>/dev/null || echo "  Frontend:       not reachable"
    curl -s -o /dev/null -w "  Backend (8400):  HTTP %{http_code}\n" http://localhost:8400/admin 2>/dev/null || echo "  Backend:        not reachable"
    echo ""
}

down() {
    log "Stopping containers..."
    docker compose down
    log "Done."
}

logs() {
    docker compose logs -f --tail=50
}

build() {
    log "Building Docker images..."
    docker compose build "$@"
    log "Build complete."
}

up() {
    # Check .env file
    if [ ! -f ".env" ]; then
        warn ".env file not found. Copying from .env.example..."
        cp .env.example .env
        warn "Please edit .env with your Supabase credentials before deploying."
        echo ""
        echo "  Required:"
        echo "    VITE_SUPABASE_URL=https://your-project.supabase.co"
        echo "    VITE_SUPABASE_ANON_KEY=your-anon-key"
        echo "  Optional:"
        echo "    ADMIN_TOKEN=learn-llm-admin"
        echo "    ANTHROPIC_API_KEY=sk-ant-..."
        echo ""
        read -rp "  Press Enter after editing .env, or Ctrl+C to cancel..."
    fi

    log "Starting containers..."
    docker compose up -d "$@"

    # Wait for health
    log "Waiting for services to be ready..."
    for i in $(seq 1 15); do
        if curl -s -o /dev/null http://localhost:80/ 2>/dev/null; then
            break
        fi
        sleep 2
    done

    echo ""
    log "============================================"
    log "  Deployment Complete!"
    log "============================================"
    echo "  Frontend:  http://localhost"
    echo "  Backend:   http://localhost:8400/admin"
    echo "  Token:     ${ADMIN_TOKEN:-learn-llm-admin}"
    echo "============================================"
    echo ""
    echo "Useful commands:"
    echo "  ./deploy.sh --logs     View all logs"
    echo "  ./deploy.sh --status   Check status"
    echo "  ./deploy.sh --down     Stop everything"
    echo "  docker compose exec backend python run_pipeline.py --full"
}

pipeline() {
    log "Running content pipeline..."
    docker compose exec backend python run_pipeline.py "$@"
}

# Main
case "${1:-}" in
    --down)
        down
        ;;
    --logs)
        logs
        ;;
    --status)
        status
        ;;
    --build)
        build
        up
        ;;
    --pipeline)
        shift
        pipeline "$@"
        ;;
    --help|-h)
        echo "Usage: ./deploy.sh [OPTION]"
        echo ""
        echo "Options:"
        echo "  (no args)     Deploy (start containers, build if needed)"
        echo "  --build       Force rebuild images then deploy"
        echo "  --down        Stop and remove containers"
        echo "  --logs        Tail all container logs"
        echo "  --status      Show container status and health"
        echo "  --pipeline    Run content pipeline (pass args after)"
        echo "  --help        Show this help"
        echo ""
        echo "Examples:"
        echo "  ./deploy.sh"
        echo "  ./deploy.sh --pipeline --full"
        echo "  ./deploy.sh --pipeline --source langchain_blog"
        ;;
    *)
        up
        ;;
esac
