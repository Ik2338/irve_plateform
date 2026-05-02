.PHONY: up down logs reset seed

up:
	cp -n .env.example .env || true
	docker compose up -d --build

down:
	docker compose down

logs:
	docker compose logs -f

reset:
	docker compose down -v
	docker compose up -d --build

seed:
	docker compose exec backend npx prisma db seed

migrate:
	docker compose exec backend npx prisma migrate deploy

studio:
	docker compose exec backend npx prisma studio

bash-backend:
	docker compose exec backend sh

bash-db:
	docker compose exec postgres psql -U irve -d irvedb

dev-tools:
	docker compose --profile dev-tools up -d adminer
