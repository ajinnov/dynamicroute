import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import Domain, RecordType, Settings
from app.services.route53 import Route53Service
from app.services.ip_detection import ip_service
from app.services.slack_notification import SlackNotificationService
from datetime import datetime

class UpdateScheduler:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.current_job_id = None
        
    def _get_refresh_interval(self) -> int:
        """Get refresh interval from settings, default to 300 seconds (5 minutes)"""
        db = SessionLocal()
        try:
            setting = db.query(Settings).filter(Settings.key == "scheduler.refresh_interval").first()
            if setting and isinstance(setting.value, int):
                return setting.value
            return 300  # Default 5 minutes
        except Exception:
            return 300
        finally:
            db.close()
        
    def start(self):
        interval_seconds = self._get_refresh_interval()
        
        self.current_job_id = 'update_domains'
        self.scheduler.add_job(
            self.update_all_domains,
            'interval',
            seconds=interval_seconds,
            id=self.current_job_id
        )
        self.scheduler.start()
        print(f"Scheduler started with {interval_seconds} seconds interval")
        
    def restart_with_new_interval(self):
        """Restart scheduler with updated interval from settings"""
        if self.current_job_id and self.scheduler.get_job(self.current_job_id):
            self.scheduler.remove_job(self.current_job_id)
        
        interval_seconds = self._get_refresh_interval()
        self.scheduler.add_job(
            self.update_all_domains,
            'interval', 
            seconds=interval_seconds,
            id=self.current_job_id
        )
        print(f"Scheduler restarted with {interval_seconds} seconds interval")
        
    def stop(self):
        self.scheduler.shutdown()
        
    async def update_all_domains(self):
        db = SessionLocal()
        try:
            active_domains = db.query(Domain).filter(Domain.is_active == True).all()
            
            current_ipv4 = await ip_service.get_public_ipv4()
            current_ipv6 = await ip_service.get_public_ipv6()
            
            for domain in active_domains:
                try:
                    if domain.record_type == RecordType.A and current_ipv4:
                        if domain.current_ip != current_ipv4:
                            await self.update_domain_record(domain, current_ipv4, db)
                    elif domain.record_type == RecordType.AAAA and current_ipv6:
                        if domain.current_ip != current_ipv6:
                            await self.update_domain_record(domain, current_ipv6, db)
                except Exception as e:
                    print(f"Error updating domain {domain.name}: {e}")
                    
        finally:
            db.close()
            
    async def update_domain_record(self, domain: Domain, new_ip: str, db: Session):
        try:
            old_ip = domain.current_ip
            route53_service = Route53Service(domain.aws_account)
            success = await route53_service.update_record(domain, new_ip)
            
            if success:
                domain.current_ip = new_ip
                domain.last_updated = datetime.utcnow()
                db.commit()
                print(f"Updated {domain.name} to {new_ip}")
                
                # Envoyer la notification Slack si configurée
                if domain.slack_account and domain.slack_account.is_active:
                    try:
                        slack_service = SlackNotificationService(domain.slack_account)
                        await slack_service.send_ip_change_notification(domain, old_ip, new_ip)
                        print(f"Slack notification sent for {domain.name}")
                    except Exception as e:
                        print(f"Error sending Slack notification for {domain.name}: {e}")
            else:
                print(f"Failed to update {domain.name}")
                
        except Exception as e:
            print(f"Error updating {domain.name}: {e}")

scheduler = UpdateScheduler()