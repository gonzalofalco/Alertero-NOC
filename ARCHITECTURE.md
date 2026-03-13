# Alertero - Architecture Refactor

## 🏗️ New Architecture

This refactor implements clean architecture principles with clear separation of concerns:

```
backend/app/
├── main_new.py              # FastAPI application entry point
├── api/                     # API layer
│   └── v1/                  # API version 1
│       ├── __init__.py      # API router aggregation
│       └── routers/         # HTTP endpoint handlers
│           ├── alerts.py
│           ├── webhook.py
│           ├── health.py
│           ├── silences.py
│           └── maintenance.py
├── core/                    # Core configuration
│   ├── config.py            # Settings management
│   └── logging.py           # Logging configuration
├── db/                      # Database layer
│   ├── base.py              # SQLAlchemy Base
│   ├── session.py           # Database session management
│   └── models/              # SQLAlchemy models
│       ├── alert.py
│       └── silence.py
├── schemas/                 # Pydantic schemas (API contracts)
│   ├── alert.py
│   ├── silence.py
│   └── common.py
├── services/                # Business logic layer
│   ├── alerts_service.py
│   └── silences_service.py
├── repositories/            # Data access layer
│   ├── alerts_repo.py
│   └── silences_repo.py
├── dependencies/            # Dependency injection
│   └── db.py
└── utils/                   # Utility functions
    └── alerts.py
```

## 📋 Key Improvements

### 1. **Layered Architecture**
- **Routers**: Handle HTTP requests/responses only
- **Services**: Contain business logic
- **Repositories**: Encapsulate database queries
- **Clear dependency chain**: Router → Service → Repository → Database

### 2. **API Versioning**
- Endpoints under `/api/v1/` for future evolution
- **Backward compatibility**: Legacy `/api/` routes still work (redirected to v1)
- Easy to add v2 without breaking existing clients

### 3. **Enhanced Configuration**
- Environment-aware settings (dev/staging/prod/test)
- Typed configuration with Pydantic Settings
- Centralized in `core/config.py`

### 4. **Professional Logging**
- JSON logs in production (for log aggregation)
- Human-readable logs in development
- Request ID tracking for tracing
- Consistent logger usage across app

### 5. **Type Safety & Code Quality**
- Ruff for fast linting
- Black for consistent formatting
- MyPy for type checking
- Pre-configured in `pyproject.toml`

### 6. **Testing Infrastructure**
- Pytest with async support
- HTTPx TestClient for API testing
- Fixtures for database and authentication
- Coverage reporting

### 7. **CI/CD Ready**
- GitHub Actions workflow
- Automated linting, formatting, testing
- Docker build verification
- Migration testing

## 🚀 Quick Start

### Development Setup

```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Run linting and formatting
ruff check app/ tests/
black app/ tests/

# Run tests
pytest tests/ -v

# Run migrations
alembic upgrade head

# Start development server
uvicorn app.main_new:app --reload --host 0.0.0.0 --port 8000
```

### Using Make

```bash
# Show all commands
make help

# Install dependencies
make install

# Format code
make format

# Run tests
make test

# Run with coverage
make test-cov

# Run linters
make lint
```

### Docker Compose

```bash
# Build and start
docker compose up -d

# View logs
docker compose logs -f backend

# Stop
docker compose down
```

## 🔄 Migration from Old Structure

The refactor maintains **100% backward compatibility**:

### File Mapping

| Old Location | New Location |
|-------------|--------------|
| `app/config.py` | `app/core/config.py` |
| `app/database.py` | `app/db/session.py` + `app/db/base.py` |
| `app/models.py` | `app/db/models/alert.py` + `app/db/models/silence.py` |
| `app/schemas.py` | `app/schemas/alert.py` + `app/schemas/silence.py` |
| `app/utils.py` | `app/utils/alerts.py` |
| `app/routers/*.py` | `app/api/v1/routers/*.py` |
| `app/main.py` | `app/main_new.py` |

### Import Changes

Old:
```python
from app.database import get_db
from app.models import AlertCurrent
from app.schemas import AlertCurrentResponse
```

New:
```python
from app.dependencies import get_db
from app.db.models import AlertCurrent
from app.schemas import AlertCurrentResponse
```

### API Routes

- Old: `/api/alerts/current` ✅ Still works (legacy)
- New: `/api/v1/alerts/current` ✅ Recommended

Both routes work! The refactor maintains backward compatibility.

## 🧪 Testing

### Run All Tests
```bash
cd backend
pytest tests/ -v
```

### Run Specific Test File
```bash
pytest tests/test_alerts.py -v
```

### With Coverage
```bash
pytest tests/ -v --cov=app --cov-report=term-missing
```

### Test Structure
- `tests/conftest.py`: Fixtures and test configuration
- `tests/test_health.py`: Health check tests
- `tests/test_alerts.py`: Alert functionality tests

## 📊 Code Quality

### Linting
```bash
ruff check app/ tests/
```

### Auto-fix Issues
```bash
ruff check --fix app/ tests/
```

### Format Code
```bash
black app/ tests/
```

### Type Checking
```bash
mypy app/
```

## 🔧 Configuration

### Environment Variables

Create `.env` file in project root:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/alertero

# Security
WEBHOOK_SECRET=your-secret-here
SECRET_KEY=your-secret-key

# Application
ENVIRONMENT=development  # or production, staging, test
LOG_LEVEL=INFO           # DEBUG, INFO, WARNING, ERROR
DEBUG=false

# CORS (optional)
CORS_ORIGINS=["http://localhost:3000"]
```

### Settings Management

Settings are managed via `app/core/config.py` using Pydantic Settings:

```python
from app.core.config import settings

print(settings.environment)  # development
print(settings.database_url)  # postgresql://...
print(settings.is_production)  # False
```

## 📦 Dependencies

### Core
- **FastAPI**: Web framework
- **SQLAlchemy**: ORM
- **Alembic**: Database migrations
- **Pydantic**: Data validation

### Development
- **pytest**: Testing framework
- **ruff**: Fast linter
- **black**: Code formatter
- **mypy**: Type checker
- **httpx**: Test client

## 🗄️ Database Migrations

### Create Migration
```bash
cd backend
alembic revision --autogenerate -m "description"
```

### Apply Migrations
```bash
alembic upgrade head
```

### Rollback
```bash
alembic downgrade -1
```

### Check Current Version
```bash
alembic current
```

## 🎯 Next Steps

### Recommended Improvements

1. **Authentication & Authorization**
   - Add JWT authentication
   - Role-based access control (RBAC)
   - API key management

2. **Performance**
   - Redis caching layer
   - Query optimization
   - Connection pooling tuning

3. **Observability**
   - Prometheus metrics
   - OpenTelemetry tracing
   - APM integration (Datadog, New Relic)

4. **Scalability**
   - Message queue (RabbitMQ/Redis) for webhooks
   - Horizontal scaling with load balancer
   - Database read replicas

5. **Security**
   - Rate limiting
   - Input sanitization
   - Security headers
   - HTTPS enforcement

6. **Features**
   - Notification channels (Slack, Email, PagerDuty)
   - Alert routing rules
   - SLA tracking
   - Reporting dashboard

## 📝 Contributing

### Code Style
- Follow PEP 8
- Use type hints
- Write docstrings for public functions
- Keep functions small and focused

### Before Committing
```bash
make format  # Format code
make lint    # Check linting
make test    # Run tests
```

### Commit Messages
Follow conventional commits:
```
feat: add new feature
fix: bug fix
docs: documentation changes
refactor: code refactoring
test: add tests
chore: maintenance
```

## 📞 Support

For issues or questions:
1. Check the docs in `/docs`
2. Review test cases in `/tests`
3. Contact the team

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Architecture**: Clean Architecture with Repository Pattern
