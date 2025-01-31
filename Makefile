setup: setup-backend setup-client setup-core setup-common

run:	
	@echo "Starting development environment..."
	@./scripts/devrun.sh

stop:
	@echo "Stopping development environment..."
	./scripts/devstop.sh

setup-backend:
	@echo "Installing backend dependencies..."
	cd backend && npm install || (echo "Backend setup failed"; exit 1)

setup-client:
	@echo "Installing client dependencies..."	
	cd client && npm install || (echo "Backend setup failed"; exit 1)
	@echo "Building client..."
	cd client && npm run build || (echo "Backend setup failed"; exit 1)

setup-core:
	@echo "Installing core dependencies..."
	cd core && pip install -r requirements.txt || (echo "Backend setup failed"; exit 1)

setup-common:
	@if [ ! -x ./scripts/devrun.sh ]; then chmod +x ./scripts/devrun.sh; fi
	@if [ ! -x ./scripts/devstop.sh ]; then chmod +x ./scripts/devstop.sh; fi
	@if [ ! -f .env ]; then cp .env.example .env; fi

.PHONY: setup setup-backend setup-client setup-core setup-common run stop
.DEFAULT_GOAL := setup