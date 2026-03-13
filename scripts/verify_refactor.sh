#!/bin/bash
# Script de verificación post-refactor para Alertero

set -e

echo "╔═══════════════════════════════════════════════════╗"
echo "║   ALERTERO - Verificación Post-Refactorización   ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# Go to project root
cd "$(dirname "$0")/.."
BACKEND_DIR="backend"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0

check_command() {
    command -v "$1" >/dev/null 2>&1
}

print_check() {
    if [ $2 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
        ERRORS=$((ERRORS + 1))
    fi
}

echo "📋 Verificando estructura de archivos..."

# Check critical files
[ -f "$BACKEND_DIR/app/main.py" ]
print_check "$BACKEND_DIR/app/main.py existe" $?

[ -f "$BACKEND_DIR/app/core/config.py" ]
print_check "$BACKEND_DIR/app/core/config.py existe" $?

[ -f "$BACKEND_DIR/app/db/session.py" ]
print_check "$BACKEND_DIR/app/db/session.py existe" $?

[ -f "$BACKEND_DIR/app/api/v1/__init__.py" ]
print_check "$BACKEND_DIR/app/api/v1/__init__.py existe" $?

[ -f "$BACKEND_DIR/tests/conftest.py" ]
print_check "$BACKEND_DIR/tests/conftest.py existe" $?

[ -f "$BACKEND_DIR/pyproject.toml" ]
print_check "$BACKEND_DIR/pyproject.toml existe" $?

[ -f "$BACKEND_DIR/requirements.txt" ]
print_check "$BACKEND_DIR/requirements.txt existe" $?

echo ""
echo "🐍 Verificando sintaxis Python..."

python3 -m py_compile $BACKEND_DIR/app/main.py 2>/dev/null
print_check "$BACKEND_DIR/app/main.py compila" $?

python3 -m py_compile $BACKEND_DIR/app/core/config.py 2>/dev/null
print_check "$BACKEND_DIR/app/core/config.py compila" $?

python3 -m py_compile $BACKEND_DIR/app/api/v1/__init__.py 2>/dev/null
print_check "$BACKEND_DIR/app/api/v1/__init__.py compila" $?

echo ""
echo "🔧 Verificando herramientas de desarrollo..."

check_command python3
print_check "python3 instalado" $?

check_command pip3
print_check "pip3 instalado" $?

check_command docker
print_check "docker instalado" $?

python3 -c "import fastapi" 2>/dev/null
print_check "FastAPI instalado" $?

python3 -c "import sqlalchemy" 2>/dev/null
print_check "SQLAlchemy instalado" $?

python3 -c "import pydantic" 2>/dev/null
print_check "Pydantic instalado" $?

echo ""
echo "📦 Verificando dependencias opcionales..."

python3 -c "import pytest" 2>/dev/null
print_check "pytest instalado" $?

python3 -c "import ruff" 2>/dev/null
print_check "ruff instalado" $?

python3 -c "import black" 2>/dev/null
print_check "black instalado" $?

echo ""
echo "🗄️  Verificando Alembic..."

[ -f "$BACKEND_DIR/alembic.ini" ]
print_check "$BACKEND_DIR/alembic.ini existe" $?

[ -d "$BACKEND_DIR/alembic/versions" ]
print_check "$BACKEND_DIR/alembic/versions existe" $?

echo ""
echo "🐳 Verificando Docker..."

[ -f "$BACKEND_DIR/Dockerfile" ]
print_check "$BACKEND_DIR/Dockerfile existe" $?

[ -f "docker-compose.yml" ]
print_check "docker-compose.yml existe" $?

echo ""
echo "📄 Verificando documentación..."

[ -f "ARCHITECTURE.md" ]
print_check "ARCHITECTURE.md existe" $?

[ -f "REFACTOR_SUMMARY.md" ]
print_check "REFACTOR_SUMMARY.md existe" $?

echo ""
echo "═══════════════════════════════════════════════════"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ TODAS LAS VERIFICACIONES PASARON${NC}"
    echo ""
    echo "🚀 Próximos pasos:"
    echo "   1. Instalar dependencias: pip3 install -r requirements.txt"
    echo "   2. Ejecutar linting: python3 -m ruff check app/"
    echo "   3. Ejecutar tests: python3 -m pytest tests/"
    echo "   4. Build Docker: docker compose build"
    echo "   5. Start containers: docker compose up -d"
    exit 0
else
    echo -e "${RED}✗ $ERRORS VERIFICACIONES FALLARON${NC}"
    echo ""
    echo "⚠️  Por favor revisar los errores arriba."
    exit 1
fi
