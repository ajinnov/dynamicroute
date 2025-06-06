"""add_hosted_zones_table

Revision ID: 60ce81df8091
Revises: cf29d02b1417
Create Date: 2025-06-05 20:27:09.213643

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '60ce81df8091'
down_revision = 'cf29d02b1417'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('hosted_zones',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('aws_zone_id', sa.String(), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('comment', sa.String(), nullable=True),
    sa.Column('is_private', sa.Boolean(), nullable=True),
    sa.Column('record_count', sa.Integer(), nullable=True),
    sa.Column('aws_account_id', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
    sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['aws_account_id'], ['aws_accounts.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_hosted_zones_aws_zone_id'), 'hosted_zones', ['aws_zone_id'], unique=True)
    op.create_index(op.f('ix_hosted_zones_id'), 'hosted_zones', ['id'], unique=False)
    op.add_column('domains', sa.Column('hosted_zone_id', sa.Integer(), nullable=True))
    op.create_foreign_key(None, 'domains', 'hosted_zones', ['hosted_zone_id'], ['id'])
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'domains', type_='foreignkey')
    op.drop_column('domains', 'hosted_zone_id')
    op.drop_index(op.f('ix_hosted_zones_id'), table_name='hosted_zones')
    op.drop_index(op.f('ix_hosted_zones_aws_zone_id'), table_name='hosted_zones')
    op.drop_table('hosted_zones')
    # ### end Alembic commands ###