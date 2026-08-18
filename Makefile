# =============================================================================
# Cukkr Monorepo — Dev Orchestration Makefile
# -----------------------------------------------------------------------------
# Menjalankan 3 project sekaligus dengan urutan:
#   1. cukkr-backend  (Elysia API, port 3000)
#   2. cukkr-frontend (Expo app,  port 8081)
#   3. cukkr-web      (Next.js,    port 3001)   <- port 3001 karena 3000
#                                                    sudah dipakai backend
#
# Strapi sengaja TIDAK dijalankan (belum dibutuhkan).
#
# Perintah utama:
#   make dev     → mulai backend dulu, tunggu sehat, baru frontend + web
#   make stop    → matikan semua dev server
#   make status  → cek server mana yang jalan
#   make logs    → tail semua log secara bersamaan
#   make clean   → hapus folder log (.logs/)
# =============================================================================

SHELL  := /bin/bash
ROOT   := $(CURDIR)

# --- Port & URL --------------------------------------------------------------
BACKEND_PORT  := 3000
FRONTEND_PORT := 8081
WEB_PORT      := 3001

BACKEND_URL  := http://localhost:$(BACKEND_PORT)
FRONTEND_URL := http://localhost:$(FRONTEND_PORT)
WEB_URL      := http://localhost:$(WEB_PORT)

# --- Log files ---------------------------------------------------------------
LOG_DIR      := $(ROOT)/.logs
BACKEND_LOG  := $(LOG_DIR)/backend.log
FRONTEND_LOG := $(LOG_DIR)/frontend.log
WEB_LOG      := $(LOG_DIR)/web.log

# Backend docs paths
OPENAPI_UI  := $(BACKEND_URL)/openapi
OPENAPI_JSON := $(BACKEND_URL)/openapi/json
EDEN_TYPES  := $(BACKEND_URL)/types/app.d.ts

.DEFAULT_GOAL := help

.PHONY: help dev run stop status logs clean check-deps \
        wait-backend wait-frontend wait-web urls

help: ## Tampilkan semua perintah yang tersedia
	@echo "Cukkr Monorepo — dev commands"
	@echo ""
	@echo "  make dev      Mulai backend → frontend (Expo) → web (Next.js), lalu cetak URL"
	@echo "  make run      Alias dari make dev"
	@echo "  make stop     Matikan semua dev server (berdasarkan port)"
	@echo "  make status   Cek status tiap dev server"
	@echo "  make logs     Tail log backend + frontend + web (Ctrl+C untuk keluar)"
	@echo "  make clean    Hapus folder log (.logs/)"

dev: check-deps ## Jalankan semua dev server (backend dulu, lalu frontend & web)
	@$(MAKE) --no-print-directory stop
	@mkdir -p $(LOG_DIR)
	@rm -f $(BACKEND_LOG) $(FRONTEND_LOG) $(WEB_LOG)
	@echo ""
	@echo "  ┌─────────────────────────────────────────────────────────┐"
	@echo "  │  🚀  Cukkr dev stack                                   │"
	@echo "  └─────────────────────────────────────────────────────────┘"
	@echo ""
	@echo "  [1/3] 🦊 Backend  (Elysia, port $(BACKEND_PORT))"
	@cd $(ROOT)/cukkr-backend && nohup bun run dev > $(BACKEND_LOG) 2>&1 < /dev/null &
	@$(MAKE) --no-print-directory wait-backend
	@echo ""
	@echo "  [2/3] 📱 Frontend (Expo, port $(FRONTEND_PORT))"
	@cd $(ROOT)/cukkr-frontend && nohup bun run web > $(FRONTEND_LOG) 2>&1 < /dev/null &
	@echo "  [3/3] 🌐 Web      (Next.js, port $(WEB_PORT))"
	@cd $(ROOT)/cukkr-web && nohup bun run dev -- --port $(WEB_PORT) > $(WEB_LOG) 2>&1 < /dev/null &
	@$(MAKE) --no-print-directory wait-frontend
	@$(MAKE) --no-print-directory wait-web
	@echo ""
	@$(MAKE) --no-print-directory urls

run: dev ## Alias dari make dev

# --- Wait targets ------------------------------------------------------------

wait-backend:
	@printf "      menunggu backend di $(BACKEND_URL)/health-check "
	@for i in $$(seq 1 60); do \
		if curl -sf $(BACKEND_URL)/health-check > /dev/null 2>&1; then \
			echo "✅ ($${i}s)"; \
			exit 0; \
		fi; \
		printf "."; \
		sleep 1; \
	done; \
	echo "❌ backend tidak hidup dalam 60s — cek $(BACKEND_LOG)"; \
	exit 1

wait-frontend:
	@printf "      menunggu frontend di $(FRONTEND_URL) "
	@for i in $$(seq 1 60); do \
		if curl -sf $(FRONTEND_URL) > /dev/null 2>&1; then \
			echo "✅ ($${i}s)"; \
			exit 0; \
		fi; \
		printf "."; \
		sleep 1; \
	done; \
	echo "⚠️  frontend belum merespons dalam 60s — cek $(FRONTEND_LOG)"; \
	exit 0

wait-web:
	@printf "      menunggu web di $(WEB_URL) "
	@for i in $$(seq 1 60); do \
		if curl -sf $(WEB_URL) > /dev/null 2>&1; then \
			echo "✅ ($${i}s)"; \
			exit 0; \
		fi; \
		printf "."; \
		sleep 1; \
	done; \
	echo "⚠️  web belum merespons dalam 60s — cek $(WEB_LOG)"; \
	exit 0

# --- Info / status -----------------------------------------------------------

urls:
	@echo ""
	@echo "  ═════════════════════════════════════════════════════════════"
	@echo "   ✅ Semua service berjalan! All services are up 🎉"
	@echo "  ═════════════════════════════════════════════════════════════"
	@echo ""
	@echo "   🔌  Backend API            $(BACKEND_URL)"
	@echo "   📖  API Docs (Scalar UI)   $(OPENAPI_UI)"
	@echo "   📋  OpenAPI JSON spec      $(OPENAPI_JSON)"
	@echo "   🧬  Eden types (auto)      $(EDEN_TYPES)"
	@echo ""
	@echo "   📱  Frontend (Expo app)    $(FRONTEND_URL)"
	@echo "   🌐  Web (Next.js landing)  $(WEB_URL)"
	@echo ""
	@echo "   Sync frontend types setelah backend berubah:"
	@echo "     cd cukkr-frontend && bunx type-share-eden-elysia sync $(EDEN_TYPES)"
	@echo ""
	@echo "   📄  Log:  make logs    |    🛑  Stop:  make stop"
	@echo ""

status: ## Cek status tiap dev server
	@echo "Cukkr dev server status:"
	@if curl -sf $(BACKEND_URL)/health-check > /dev/null 2>&1; then \
		echo "  ✅ backend  jalan  → $(BACKEND_URL)"; \
	else \
		echo "  ❌ backend  mati   → $(BACKEND_URL)"; \
	fi
	@if curl -sf $(FRONTEND_URL) > /dev/null 2>&1; then \
		echo "  ✅ frontend jalan  → $(FRONTEND_URL)"; \
	else \
		echo "  ❌ frontend mati   → $(FRONTEND_URL)"; \
	fi
	@if curl -sf $(WEB_URL) > /dev/null 2>&1; then \
		echo "  ✅ web      jalan  → $(WEB_URL)"; \
	else \
		echo "  ❌ web      mati   → $(WEB_URL)"; \
	fi

logs: ## Tail log semua dev server (Ctrl+C untuk keluar)
	@if [ ! -f $(BACKEND_LOG) ]; then echo "Tidak ada log — jalankan 'make dev' dulu."; exit 1; fi
	tail -f $(BACKEND_LOG) $(FRONTEND_LOG) $(WEB_LOG)

# --- Stop / clean ------------------------------------------------------------

stop: ## Matikan semua dev server (berdasarkan port 3000, 8081, 3001)
	@echo "Menghentikan dev server..."
	@killed=0; \
	for port in $(BACKEND_PORT) $(FRONTEND_PORT) $(WEB_PORT); do \
		pids=$$(lsof -ti tcp:$$port 2>/dev/null); \
		if [ -n "$$pids" ]; then \
			kill $$pids 2>/dev/null; \
			echo "  ✔ port $$port dimatikan ($$pids)"; \
			killed=1; \
		fi; \
	done; \
	if [ "$$killed" = "0" ]; then echo "  (tidak ada server yang berjalan)"; fi
	@sleep 1
	@echo "Selesai."

clean: ## Hapus folder log (.logs/)
	@rm -rf $(LOG_DIR)
	@echo "Folder $(LOG_DIR) dihapus."

check-deps:
	@command -v bun > /dev/null 2>&1 || { echo "❌ 'bun' tidak ditemukan. Install dulu: https://bun.sh"; exit 1; }
	@for d in cukkr-backend cukkr-frontend cukkr-web; do \
		if [ ! -d "$(ROOT)/$$d/node_modules" ]; then \
			echo "❌ $(ROOT)/$$d/node_modules belum ada — jalankan 'cd $$d && bun install' dulu"; \
			exit 1; \
		fi; \
	done
