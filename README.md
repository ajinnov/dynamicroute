# DynamicRoute53

Un outil de DNS dynamique compatible avec AWS Route53, conçu avec une architecture extensible pour supporter d'autres services DNS à l'avenir.

## Fonctionnalités

- ✅ **Multi-domaines** : Gestion de plusieurs domaines et sous-domaines
- ✅ **Multi-comptes AWS** : Support de plusieurs comptes AWS Route53
- ✅ **Types d'enregistrements** : Support des enregistrements A (IPv4) et AAAA (IPv6)
- ✅ **Détection d'IP automatique** : Suivi automatique de l'IP publique
- ✅ **Interface web** : Interface utilisateur simple et intuitive
- ✅ **Authentification** : Protection par compte utilisateur
- ✅ **Mises à jour automatiques** : Scheduler pour les mises à jour périodiques
- ✅ **Containerisé** : Déploiement facile avec Docker

## Architecture

```
DynamicRoute53/
├── backend/                 # API Python FastAPI
│   ├── app/
│   │   ├── models/         # Modèles de données (User, Domain, AWSAccount)
│   │   ├── services/       # Services (Route53, détection IP, scheduler)
│   │   ├── api/           # Routes API (auth, domaines, comptes AWS)
│   │   └── core/          # Configuration, sécurité, base de données
│   └── requirements.txt
├── frontend/               # Interface React
│   ├── src/
│   │   ├── components/    # Composants React
│   │   └── services/      # Services API
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Technologies

- **Backend** : Python 3.11, FastAPI, SQLAlchemy, PostgreSQL
- **Frontend** : React 18, TypeScript, Tailwind CSS, Vite
- **AWS** : Boto3 pour l'intégration Route53
- **Containerisation** : Docker, Docker Compose
- **Authentification** : JWT avec bcrypt

## Installation et démarrage

### Prérequis

- Docker et Docker Compose
- Comptes AWS avec accès à Route53

### Démarrage rapide

1. **Cloner le projet**
```bash
git clone <repo-url>
cd DynamicRoute53
```

2. **Configuration**
```bash
# Copier le fichier d'exemple de configuration
cp backend/.env.example backend/.env

# Modifier les variables d'environnement
nano backend/.env
```

3. **Démarrer les services**
```bash
docker-compose up -d
```

4. **Accéder à l'application**
- Interface web : http://localhost:3000
- API : http://localhost:8000
- Documentation API : http://localhost:8000/docs

### Configuration manuelle (développement)

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou venv\\Scripts\\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Base de données
```bash
# Avec Docker
docker run --name postgres-dynroute53 -e POSTGRES_PASSWORD=password -e POSTGRES_DB=dynamicroute53 -p 5432:5432 -d postgres:15

# Ou installer PostgreSQL localement
```

## Configuration AWS

1. **Créer un utilisateur IAM** avec les permissions Route53 :
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

2. **Obtenir les clés d'accès** (Access Key ID et Secret Access Key)

3. **Ajouter le compte AWS** dans l'interface web

## Utilisation

1. **Créer un compte** sur l'interface web
2. **Ajouter un compte AWS** avec vos clés d'accès
3. **Configurer un domaine** :
   - Nom du domaine/sous-domaine
   - Zone ID Route53
   - Type d'enregistrement (A ou AAAA)
   - TTL (optionnel, défaut : 300s)
4. **Activer la surveillance** : Le système mettra automatiquement à jour vos enregistrements DNS toutes les 5 minutes

## Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|---------|
| `DATABASE_URL` | URL de connexion PostgreSQL | `postgresql://user:password@db:5432/dynamicroute53` |
| `SECRET_KEY` | Clé secrète JWT | `your-secret-key-here` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Durée de validité des tokens | `30` |

## API Documentation

L'API REST est documentée automatiquement avec FastAPI. Accédez à la documentation interactive sur http://localhost:8000/docs

### Endpoints principaux

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/domains` - Liste des domaines
- `POST /api/domains` - Créer un domaine
- `PUT /api/domains/{id}/update-ip` - Forcer la mise à jour d'un domaine
- `GET /api/aws-accounts` - Liste des comptes AWS
- `POST /api/aws-accounts` - Ajouter un compte AWS

## Développement

### Structure du code

- **Models** : Définition des entités (User, Domain, AWSAccount)
- **Services** : Logique métier (Route53, détection IP, scheduler)
- **API** : Endpoints REST avec validation
- **Frontend** : Interface React avec React Query pour la gestion d'état

### Ajout d'un nouveau provider DNS

L'architecture est conçue pour être extensible. Pour ajouter un nouveau provider :

1. Créer un nouveau service dans `backend/app/services/`
2. Implémenter l'interface standard (update_record, get_current_record)
3. Ajouter le modèle de configuration dans `models/`
4. Créer les endpoints API correspondants

## Sécurité

- Authentification JWT avec tokens expirables
- Hachage des mots de passe avec bcrypt
- Validation des entrées avec Pydantic
- Isolation des environnements avec Docker
- Chiffrement des communications HTTPS (en production)

## Production

Pour un déploiement en production :

1. **Changer les secrets** dans `.env`
2. **Configurer HTTPS** avec un reverse proxy (nginx)
3. **Sauvegardes de base de données** automatiques
4. **Monitoring et logs** (Prometheus, Grafana)
5. **Variables d'environnement sécurisées**

## Licence

MIT License

## Support

Pour signaler un bug ou demander une fonctionnalité, veuillez créer une issue sur le repository GitHub.