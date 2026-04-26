.PHONY: verify verify-down verify-openclaw-e2e verify-openclaw-e2e-down clean help

# Default endpoint for host-run tests (docker-compose maps 8080:8080)
REDACT_VERIFY_ENDPOINT ?= http://127.0.0.1:8080
OPENCLAW_TAG ?= 2026.4.24

help:
	@echo "Targets:"
	@echo "  verify               - Tier 1: Redact + Vitest harness (fast)"
	@echo "  verify-down          - Stop tier-1 compose stack"
	@echo "  verify-openclaw-e2e  - Tier 2: OpenClaw gateway in Docker + mock LLM E2E"
	@echo "  verify-openclaw-e2e-down - Stop tier-2 compose stack"
	@echo "  clean                - Remove dist/, *.tgz, verification-report.json, .verification/"

clean:
	rm -rf dist
	rm -f *.tgz
	rm -f verification-report.json
	rm -rf .verification

verify:
	docker compose -f docker-compose.verify.yml up -d
	REDACT_VERIFY_ENDPOINT=$(REDACT_VERIFY_ENDPOINT) node scripts/wait-for-redact.mjs
	REDACT_VERIFY_ENDPOINT=$(REDACT_VERIFY_ENDPOINT) npm run test:verification
	@$(MAKE) verify-down

verify-down:
	docker compose -f docker-compose.verify.yml down -v

verify-openclaw-e2e:
	npm run build
	npm pack --pack-destination .
	cp censgate-openclaw-redact-0.1.0.tgz openclaw-redact.tgz
	@$(MAKE) verify-openclaw-e2e-down
	OPENCLAW_TAG=$(OPENCLAW_TAG) docker compose -f docker-compose.openclaw-e2e.yml build
	OPENCLAW_TAG=$(OPENCLAW_TAG) docker compose -f docker-compose.openclaw-e2e.yml up -d
	REDACT_VERIFY_ENDPOINT=$(REDACT_VERIFY_ENDPOINT) node scripts/wait-for-redact.mjs
	OPENCLAW_GATEWAY_URL=http://127.0.0.1:18789 node scripts/wait-for-openclaw.mjs
	npm run test:openclaw-e2e
	@$(MAKE) verify-openclaw-e2e-down

verify-openclaw-e2e-down:
	OPENCLAW_TAG=$(OPENCLAW_TAG) docker compose -f docker-compose.openclaw-e2e.yml down -v
