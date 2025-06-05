import boto3
from typing import Optional
from app.models import Domain, AWSAccount

class Route53Service:
    def __init__(self, aws_account: AWSAccount):
        self.client = boto3.client(
            'route53',
            aws_access_key_id=aws_account.access_key_id,
            aws_secret_access_key=aws_account.secret_access_key,
            region_name=aws_account.region
        )

    async def update_record(self, domain: Domain, new_ip: str) -> bool:
        try:
            response = self.client.change_resource_record_sets(
                HostedZoneId=domain.zone_id,
                ChangeBatch={
                    'Comment': f'DynamicRoute53 update for {domain.name}',
                    'Changes': [{
                        'Action': 'UPSERT',
                        'ResourceRecordSet': {
                            'Name': domain.name,
                            'Type': domain.record_type.value,
                            'TTL': domain.ttl,
                            'ResourceRecords': [{'Value': new_ip}]
                        }
                    }]
                }
            )
            return response['ResponseMetadata']['HTTPStatusCode'] == 200
        except Exception as e:
            print(f"Error updating DNS record: {e}")
            return False

    async def get_current_record(self, domain: Domain) -> Optional[str]:
        try:
            response = self.client.list_resource_record_sets(
                HostedZoneId=domain.zone_id,
                StartRecordName=domain.name,
                StartRecordType=domain.record_type.value,
                MaxItems='1'
            )
            
            for record_set in response['ResourceRecordSets']:
                if (record_set['Name'].rstrip('.') == domain.name.rstrip('.') and 
                    record_set['Type'] == domain.record_type.value):
                    if 'ResourceRecords' in record_set:
                        return record_set['ResourceRecords'][0]['Value']
            return None
        except Exception as e:
            print(f"Error getting current DNS record: {e}")
            return None

    async def list_hosted_zones(self) -> list:
        try:
            response = self.client.list_hosted_zones()
            return response.get('HostedZones', [])
        except Exception as e:
            print(f"Error listing hosted zones: {e}")
            return []