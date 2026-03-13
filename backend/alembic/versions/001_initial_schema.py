"""initial schema

Revision ID: 001
Revises: 
Create Date: 2026-01-30

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # alerts_current
    op.create_table('alerts_current',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('fingerprint', sa.String(length=64), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('alertname', sa.String(length=255), nullable=False),
        sa.Column('instance', sa.String(length=255), nullable=True),
        sa.Column('team', sa.String(length=100), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('labels', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('annotations', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('generator_url', sa.String(length=512), nullable=True),
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ends_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('acked', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('silenced', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('acked_by', sa.String(length=100), nullable=True),
        sa.Column('acked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('ack_note', sa.Text(), nullable=True),
        sa.Column('raw', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('fingerprint')
    )
    op.create_index('ix_alerts_current_acked', 'alerts_current', ['acked'])
    op.create_index('ix_alerts_current_alertname', 'alerts_current', ['alertname'])
    op.create_index('ix_alerts_current_severity', 'alerts_current', ['severity'])
    op.create_index('ix_alerts_current_silenced', 'alerts_current', ['silenced'])
    op.create_index('ix_alerts_current_status', 'alerts_current', ['status'])
    op.create_index('ix_alerts_current_team', 'alerts_current', ['team'])
    op.create_index('ix_alerts_current_updated_at', 'alerts_current', ['updated_at'])
    
    # alert_events  
    op.create_table('alert_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('fingerprint', sa.String(length=64), nullable=False),
        sa.Column('event_type', sa.String(length=20), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('alertname', sa.String(length=255), nullable=False),
        sa.Column('instance', sa.String(length=255), nullable=True),
        sa.Column('team', sa.String(length=100), nullable=True),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('labels', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('annotations', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('generator_url', sa.String(length=512), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('raw', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_alert_events_created_at', 'alert_events', ['created_at'])
    op.create_index('ix_alert_events_fingerprint', 'alert_events', ['fingerprint'])
    
    # silences
    op.create_table('silences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('matchers', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', sa.String(length=100), nullable=False),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('active', sa.Boolean(), nullable=False, server_default='true'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_silences_active', 'silences', ['active'])
    op.create_index('ix_silences_active_expires', 'silences', ['active', 'expires_at'])
    op.create_index('ix_silences_expires_at', 'silences', ['expires_at'])

def downgrade():
    op.drop_table('silences')
    op.drop_table('alert_events')
    op.drop_table('alerts_current')
