# DynamicRoute

A dynamic DNS tool compatible with AWS Route53, designed with an extensible architecture to support other DNS services in the future.

![Capture d’écran 2025-06-05 à 20 26 58](https://github.com/user-attachments/assets/58cfedb4-5623-4f6e-b832-528a4aac6dec)


## Features

- ✅ **Multi-domain Support** : Manage multiple domains and subdomains
- ✅ **Multi-AWS Accounts** : Support for multiple AWS Route53 accounts
- ✅ **Record Types** : Support for A (IPv4) and AAAA (IPv6) records
- ✅ **Automatic IP Detection** : Automatic public IP tracking with configurable sources
- ✅ **Web Interface** : Simple and intuitive user interface with internationalization (English/French)
- ✅ **Authentication** : User account protection with JWT tokens
- ✅ **Automatic Updates** : Configurable scheduler for periodic updates (supports sub-minute intervals)
- ✅ **Slack Notifications** : Optional Slack integration for IP change notifications
- ✅ **Configuration Management** : Web-based settings for IP sources and refresh intervals
- ✅ **Containerized** : Easy deployment with Docker

## Architecture

```
DynamicRoute53/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── models/         # Data models (User, Domain, AWSAccount, Settings)
│   │   ├── services/       # Services (Route53, IP detection, scheduler)
│   │   ├── api/           # API routes (auth, domains, AWS accounts, settings)
│   │   └── core/          # Configuration, security, database
│   └── requirements.txt
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Application pages
│   │   ├── services/      # API services
│   │   └── locales/       # i18n translations (en/fr)
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Technology Stack

- **Backend** : Python 3.11, FastAPI, SQLAlchemy, PostgreSQL, APScheduler
- **Frontend** : React 18, TypeScript, Tailwind CSS, Vite, React Query, i18next
- **AWS** : Boto3 for Route53 integration
- **Containerization** : Docker, Docker Compose
- **Authentication** : JWT with bcrypt password hashing
- **Database** : PostgreSQL with Alembic migrations

## Quick Start

### Prerequisites

- Docker and Docker Compose
- AWS accounts with Route53 access

### Getting Started

1. **Clone the repository**
```bash
git clone <repo-url>
cd DynamicRoute53
```

2. **Configuration**
```bash
# Copy the example configuration file
cp backend/.env.example backend/.env

# Edit the environment variables
nano backend/.env
```

3. **Start the services**
```bash
docker-compose up -d
```

4. **Access the application**
- Web interface: http://localhost:3000
- API: http://localhost:8000
- API documentation: http://localhost:8000/docs

5. **Initial setup**
   - Create your first user account
   - Add your AWS credentials
   - Configure your domains
   - Customize settings (IP detection sources, refresh interval)

### Manual Setup (Development)

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or venv\\Scripts\\activate  # Windows
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Database
```bash
# With Docker
docker run --name postgres-dynroute53 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=dynamicroute53 -p 5432:5432 -d postgres:15

# Or install PostgreSQL locally
```

## AWS Configuration

1. **Create an IAM user** with Route53 permissions:
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "route53:ListHostedZones",
                "route53:GetHostedZone",
                "route53:ListResourceRecordSets",
                "route53:ChangeResourceRecordSets"
            ],
            "Resource": "*"
        }
    ]
}
```

2. **Get access keys** (Access Key ID and Secret Access Key)

3. **Add the AWS account** in the web interface

## Application Features

### Domain Management
- **Multi-domain support**: Manage unlimited domains and subdomains
- **Record types**: Support for both A (IPv4) and AAAA (IPv6) records
- **Flexible TTL**: Configure custom TTL values for each domain
- **Automatic monitoring**: Enable/disable monitoring per domain
- **Manual updates**: Force immediate IP updates when needed
  
![Capture d’écran 2025-06-05 à 20 27 14](https://github.com/user-attachments/assets/632dbc4a-42d9-4e9e-bd32-5845f1ccc587)

![Capture d’écran 2025-06-05 à 20 27 26](https://github.com/user-attachments/assets/13b68418-cbda-44bc-a561-efb828853faa)
![Capture d’écran 2025-06-05 à 20 27 41](https://github.com/user-attachments/assets/9d51bf73-5e1b-4264-b960-2f9cb540f340)
![Capture d’écran 2025-06-05 à 20 27 45](https://github.com/user-attachments/assets/61edd7b5-a8d8-4991-921d-912befcce11e)


### IP Detection
- **Configurable sources**: Customize IPv4 and IPv6 detection URLs from the web interface
- **Fallback system**: Multiple sources ensure reliability
- **Real-time detection**: Automatic detection of public IP changes
- **Dual-stack support**: Independent IPv4 and IPv6 detection
  
![Capture d’écran 2025-06-05 à 20 28 12](https://github.com/user-attachments/assets/5fa94751-1b8c-408f-a8f4-b3ba90e1abf9)

### Scheduling & Automation
- **Flexible intervals**: Configure refresh intervals in seconds (supports sub-minute intervals)
- **Dynamic reconfiguration**: Change intervals without restarting the service
- **Reliable scheduling**: Built on APScheduler for robust task management
- **Status monitoring**: Real-time scheduler status in the web interface

### Notifications
- **Slack integration**: Optional webhooks for IP change notifications
- **Multi-account support**: Configure multiple Slack workspaces
- **Webhook testing**: Built-in webhook testing functionality
  
![Capture d’écran 2025-06-05 à 20 27 51](https://github.com/user-attachments/assets/88427be9-2ce2-4e26-90ab-359fe37591e8)

### Settings Management
- **Web-based configuration**: All settings configurable from the interface
- **Real-time updates**: Changes apply immediately without restarts
- **Reset to defaults**: Easy reset functionality for all settings
- **Inline editing**: Edit settings directly in the interface

### Internationalization
- **Multi-language support**: English and French interfaces
- **Browser detection**: Automatic language detection
- **Complete translations**: All UI text properly internationalized

## Usage Examples

### Example 1: Basic Home Server Setup
```
Domain: home.example.com
Zone ID: Z1PA6795UKMFR9
Record Type: A (IPv4)
TTL: 300 seconds
Refresh Interval: 300 seconds (5 minutes)
```

### Example 2: Dual-Stack Configuration
```
Domain: server.example.com
- IPv4 record (A): Monitoring enabled
- IPv6 record (AAAA): Monitoring enabled
Both using the same Zone ID with different record types
```

### Example 3: High-Frequency Updates
```
Domain: api.example.com
Refresh Interval: 30 seconds
Multiple IP detection sources for redundancy
Slack notifications enabled for changes
```

### Example 4: Multiple Subdomains
```
- mail.example.com (A record)
- ftp.example.com (A record)  
- vpn.example.com (AAAA record)
All managed from the same interface with individual TTL settings
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection URL | `postgresql://user:password@db:5432/dynamicroute53` |
| `SECRET_KEY` | JWT secret key | `your-secret-key-here` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token validity duration | `30` |
| `CORS_ORIGINS` | Allowed CORS origins | `["http://localhost:3000"]` |

## API Documentation

The REST API is automatically documented with FastAPI. Access the interactive documentation at http://localhost:8000/docs

### Main Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

#### Domain Management
- `GET /api/domains` - List domains
- `POST /api/domains` - Create domain
- `PUT /api/domains/{id}` - Update domain
- `PUT /api/domains/{id}/update-ip` - Force IP update
- `DELETE /api/domains/{id}` - Delete domain

#### AWS Account Management
- `GET /api/aws-accounts` - List AWS accounts
- `POST /api/aws-accounts` - Add AWS account
- `DELETE /api/aws-accounts/{id}` - Delete AWS account

#### Settings Management
- `GET /api/settings` - Get all settings
- `PUT /api/settings/{key}` - Update setting
- `POST /api/settings/reset/{key}` - Reset setting to default

#### Slack Integration
- `GET /api/slack-accounts` - List Slack accounts
- `POST /api/slack-accounts` - Add Slack account
- `POST /api/slack-accounts/{id}/test` - Test webhook
- `DELETE /api/slack-accounts/{id}` - Delete Slack account

## Development

### Code Structure

- **Models**: Entity definitions (User, Domain, AWSAccount, Settings)
- **Services**: Business logic (Route53, IP detection, scheduler)
- **API**: REST endpoints with validation
- **Frontend**: React interface with React Query for state management

### Adding a New DNS Provider

The architecture is designed to be extensible. To add a new provider:

1. Create a new service in `backend/app/services/`
2. Implement the standard interface (update_record, get_current_record)
3. Add the configuration model in `models/`
4. Create corresponding API endpoints
5. Update the frontend to support the new provider

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Database Migrations

```bash
# Create a new migration
cd backend
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head
```

## Security

- JWT authentication with expirable tokens
- Password hashing with bcrypt
- Input validation with Pydantic
- Environment isolation with Docker
- HTTPS communication encryption (in production)
- SQL injection protection with SQLAlchemy ORM
- CORS configuration for frontend security

## Production Deployment

For production deployment:

1. **Secure configuration**
   - Change all secrets in `.env`
   - Use strong passwords and keys
   - Configure proper CORS origins

2. **HTTPS setup**
   - Configure reverse proxy (nginx)
   - Obtain SSL certificates (Let's Encrypt)

3. **Database**
   - Set up automated backups
   - Configure database replication if needed
   - Monitor database performance

4. **Monitoring**
   - Set up logging (structured logging recommended)
   - Configure monitoring (Prometheus, Grafana)
   - Set up alerts for failures

5. **Security hardening**
   - Regular security updates
   - Firewall configuration
   - Access log monitoring

### Docker Production Example

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    environment:
      - SECRET_KEY=${SECRET_KEY}
      - DATABASE_URL=${DATABASE_URL}
    restart: unless-stopped
    
  frontend:
    environment:
      - REACT_APP_API_URL=https://api.yourdomain.com
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    restart: unless-stopped
```

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check PostgreSQL is running
   - Verify DATABASE_URL format
   - Ensure database exists

2. **AWS authentication failures**
   - Verify Access Key ID and Secret Access Key
   - Check IAM permissions
   - Confirm AWS region settings

3. **IP detection not working**
   - Check internet connectivity
   - Verify IP detection source URLs
   - Review firewall settings

4. **Frontend not loading**
   - Verify CORS settings in backend
   - Check frontend build process
   - Confirm API endpoint configuration

### Logs

```bash
# View application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# View specific service logs
docker-compose logs backend
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License

## Support

To report bugs or request features, please create an issue on the GitHub repository.

## Roadmap

- [ ] Support for additional DNS providers (Cloudflare, DigitalOcean)
- [ ] Advanced monitoring and alerting
- [ ] API rate limiting and throttling
- [ ] Database backup automation
- [ ] Mobile-responsive interface improvements
- [ ] Bulk domain management features
