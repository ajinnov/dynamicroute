# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DynamicRoute53 is a multi-user dynamic DNS management tool for AWS Route53 with Slack integration. It automatically detects public IP changes and updates DNS records, with a web interface for management.

## Architecture

**Tech Stack:**
- Backend: Python FastAPI + SQLAlchemy + PostgreSQL
- Frontend: React 18 + TypeScript + Tailwind CSS + Vite
- Container: Docker Compose
- Database: PostgreSQL with Alembic migrations
- Background Tasks: APScheduler

**Key Components:**
- `backend/app/main.py` - FastAPI application entry point with lifespan management for scheduler
- `backend/app/services/scheduler.py` - Background IP monitoring (runs every 5 minutes)
- `backend/app/services/route53.py` - AWS Route53 DNS management
- `backend/app/services/ip_detection.py` - Public IP detection from multiple sources
- `backend/app/services/slack_notification.py` - Slack webhook notifications
- `frontend/src/components/Dashboard.tsx` - Main navigation and page routing

## Development Commands

**Start/Stop Services:**
```bash
docker-compose up -d                    # Start all services
docker-compose restart backend         # Restart backend only
docker-compose logs backend           # View backend logs
```

**Backend Development:**
```bash
cd backend
uvicorn app.main:app --reload          # Development server
alembic revision --autogenerate -m "message"  # Create migration
alembic upgrade head                   # Apply migrations
python -m app.cli create-user <user> <email>  # Create user via CLI
python -m app.cli list-users          # List all users
```

**Frontend Development:**
```bash
cd frontend
npm run dev                           # Development server (port 3000)
npm run build                        # Production build
```

**Database Management:**
```bash
docker-compose exec backend alembic upgrade head     # Apply migrations
docker-compose exec backend python -m app.cli list-users  # CLI operations
```

## Key Configuration

**Environment Variables (backend/.env):**
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT signing key
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token validity (default: 30)

**API Routes Structure:**
- `/api/auth` - Authentication (login only, no public registration)
- `/api/users` - User management (admin functions)
- `/api/domains` - Domain/DNS record management
- `/api/aws-accounts` - AWS credentials management
- `/api/slack-accounts` - Slack webhook management
- `/api/dashboard` - Statistics and current IP info

## Data Model Relationships

```
User (1) -> (N) AWSAccount
User (1) -> (N) SlackAccount  
User (1) -> (N) Domain

Domain (N) -> (1) AWSAccount (required)
Domain (N) -> (1) SlackAccount (optional)
```

**Domain Model Key Fields:**
- `slack_account_id` - Optional Slack notifications on IP change
- `current_ip` - Last known IP address
- `last_updated` - Timestamp of last DNS update
- `is_active` - Whether domain participates in automatic updates

## Security Model

- JWT authentication required for all APIs except login
- Users can only access their own resources
- AWS credentials stored per-user
- No public user registration (admin-only via CLI or web interface)
- Slack webhooks tested before saving

## Background Processing

The scheduler (`UpdateScheduler`) runs every 5 minutes:
1. Detects current public IPv4/IPv6
2. Compares with stored IP for each active domain
3. Updates Route53 DNS records if changed
4. Sends Slack notifications if configured
5. Updates database with new IP and timestamp

## Frontend Architecture

**Navigation:**
- `Layout.tsx` - Sidebar navigation wrapper
- `Dashboard.tsx` - Main page router component
- Pages: Dashboard, Domains, AWS Accounts, Slack, Users, Settings

**State Management:**
- React Query for API state and caching
- Local form state with react-hook-form
- React Hot Toast for notifications

**Key Frontend Patterns:**
- All API calls go through `services/api.ts`
- Forms use react-hook-form with validation
- Tables include inline actions (edit, delete, test)
- Modals/forms toggle with local state

## Common Development Tasks

**Adding New API Endpoints:**
1. Add route in `backend/app/api/`
2. Update `backend/app/main.py` to include router
3. Add API calls to `frontend/src/services/api.ts`
4. Create/update React components

**Database Schema Changes:**
1. Modify models in `backend/app/models/`
2. Run `alembic revision --autogenerate -m "description"`
3. Apply with `alembic upgrade head`
4. Update API responses and frontend types

**Adding Slack Notifications:**
- Notifications sent via `SlackNotificationService.send_ip_change_notification()`
- Called from both manual IP updates and scheduled updates
- Failure doesn't interrupt DNS updates (graceful degradation)

## Testing Approach

The codebase uses manual testing via the web interface and API endpoints. Key test scenarios:
- User authentication and authorization
- AWS credential validation and Route53 access
- Slack webhook testing (built into creation flow)
- IP detection and DNS record updates

## Development Best Practices

**IMPORTANT: Always test modifications after implementing them!**

**Testing Commands to Run After Changes:**
```bash
# Check service health
docker-compose logs frontend | tail -10     # Frontend compilation errors
docker-compose logs backend | tail -10      # Backend runtime errors

# Test frontend accessibility
curl -s http://localhost:3000 | head -10    # Frontend serving correctly

# Test backend API (without auth)
curl -s http://localhost:8000/docs          # API documentation accessible
curl -s http://localhost:8000/api/dashboard/stats  # Should return auth error

# Test authenticated API calls (with token)
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/domains

# Test database connectivity
docker-compose exec backend python -c "from app.core.database import engine; print('DB OK')"
```

**When Making Frontend Changes:**
- Check for TypeScript compilation errors in logs
- Verify React Hot Module Replacement is working
- Test navigation and form submissions
- Check browser console for JavaScript errors

**When Making Backend Changes:**
- Verify API endpoints respond correctly
- Check database operations work
- Test authentication/authorization
- Verify background scheduler still runs

**When Making Database Changes:**
- Test migration up/down
- Verify foreign key constraints
- Check data integrity after schema changes

## Internationalization Guidelines

**IMPORTANT: All user-facing text must be in English in source code**

The application uses an internationalization system where:
- All source code contains English text only
- Text is dynamically translated based on browser language detection
- French translations are provided through the translation system

**Current State:**
- The existing codebase contains French text directly in components (legacy)
- New code should follow the English-first approach
- Future refactoring should move existing French text to translation keys

**Best Practices for New Code:**
```tsx
// ❌ Wrong - Direct French text
<h1>Gestion des domaines</h1>
toast.error('Erreur lors de la connexion');

// ✅ Correct - English text with translation
<h1>{t('domains.management')}</h1>
toast.error(t('auth.connection_error'));
```

**Translation System Setup (To Be Implemented):**
- Add react-i18next dependency
- Create translation files (en.json, fr.json)
- Setup language detection based on browser locale
- Wrap components with translation provider