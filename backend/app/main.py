from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.api import domains, aws_accounts, auth, dashboard, users, slack_accounts, hosted_zones
from app.api import settings as settings_api
from app.services.scheduler import scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.start()
    yield
    scheduler.stop()

app = FastAPI(title="DynamicRoute53", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(domains.router, prefix="/api/domains", tags=["domains"])
app.include_router(aws_accounts.router, prefix="/api/aws-accounts", tags=["aws-accounts"])
app.include_router(slack_accounts.router, prefix="/api/slack-accounts", tags=["slack-accounts"])
app.include_router(hosted_zones.router, prefix="/api/hosted-zones", tags=["hosted-zones"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(settings_api.router, prefix="/api/settings", tags=["settings"])

@app.get("/")
async def root():
    return {"message": "DynamicRoute53 API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)