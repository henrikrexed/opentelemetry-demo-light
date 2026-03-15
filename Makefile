.PHONY: build up down logs clean proto

# Build all Docker images
build:
	docker compose build

# Start all services
up:
	docker compose up -d

# Stop all services
down:
	docker compose down

# Tail logs from all services
logs:
	docker compose logs -f

# Stop services and remove volumes
clean:
	docker compose down -v --remove-orphans

# Compile proto definitions (requires protoc installed locally)
proto:
	@echo "Proto compilation is handled inside each service's Docker build."
	@echo "To compile locally, see each service's build instructions."
