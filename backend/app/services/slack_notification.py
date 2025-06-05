import httpx
import json
from typing import Optional
from app.models import SlackAccount, Domain

class SlackNotificationService:
    def __init__(self, slack_account: SlackAccount):
        self.webhook_url = slack_account.webhook_url
        self.account_name = slack_account.name

    async def send_ip_change_notification(self, domain: Domain, old_ip: Optional[str], new_ip: str) -> bool:
        """Envoyer une notification de changement d'IP"""
        try:
            # Préparer le message
            if old_ip:
                title = f"🔄 Changement d'IP détecté"
                message = f"Le domaine `{domain.name}` a changé d'IP"
                fields = [
                    {
                        "title": "Ancienne IP",
                        "value": f"`{old_ip}`",
                        "short": True
                    },
                    {
                        "title": "Nouvelle IP",
                        "value": f"`{new_ip}`",
                        "short": True
                    }
                ]
                color = "#ff9500"  # Orange
            else:
                title = f"🆕 Première configuration IP"
                message = f"Le domaine `{domain.name}` a été configuré pour la première fois"
                fields = [
                    {
                        "title": "IP assignée",
                        "value": f"`{new_ip}`",
                        "short": True
                    }
                ]
                color = "#36a64f"  # Vert

            # Construire le payload Slack
            payload = {
                "username": "DynamicRoute53",
                "icon_emoji": ":globe_with_meridians:",
                "attachments": [
                    {
                        "color": color,
                        "title": title,
                        "text": message,
                        "fields": fields + [
                            {
                                "title": "Type d'enregistrement",
                                "value": domain.record_type.value,
                                "short": True
                            },
                            {
                                "title": "TTL",
                                "value": f"{domain.ttl}s",
                                "short": True
                            }
                        ],
                        "footer": "DynamicRoute53",
                        "ts": int(__import__('time').time())
                    }
                ]
            }

            # Envoyer la notification
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    self.webhook_url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                return response.status_code == 200

        except Exception as e:
            print(f"Erreur lors de l'envoi de la notification Slack: {e}")
            return False

    async def test_webhook(self) -> bool:
        """Tester la connexion webhook"""
        try:
            payload = {
                "username": "DynamicRoute53",
                "icon_emoji": ":white_check_mark:",
                "text": f"✅ Test de connexion réussi pour le compte Slack `{self.account_name}`",
                "attachments": [
                    {
                        "color": "#36a64f",
                        "text": "Votre webhook Slack est correctement configuré !",
                        "footer": "DynamicRoute53 - Test de connexion"
                    }
                ]
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    self.webhook_url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )
                return response.status_code == 200

        except Exception as e:
            print(f"Erreur lors du test webhook Slack: {e}")
            return False