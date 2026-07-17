import asyncio
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.database import engine, Base
from app.core.config import get_settings
from app.models.tenant import Tenant, TenantStatus
from app.models.user import User
from app.models.membership import TenantUser, TenantUserRole
from app.models.billing import Subscription, SubscriptionStatus, Invoice
from app.models.site import Site

settings = get_settings()
MONGO_URL = 'mongodb+srv://nicholasgerber15_db_user:***@cluster0.6sbuaza.mongodb.net/the_dirt_place?retryWrites=true&w=majority'

async def ensure_tables():
    db_path = Path(settings.database_url.replace('sqlite+aiosqlite:///', '').replace('sqlite:///', ''))
    if db_path.exists():
        db_path.unlink()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


import hashlib, base64
PBKDF2 = lambda p: base64.b64encode(hashlib.pbkdf2_hmac('sha256', p.encode() if isinstance(p, str) else p, b'nfinnite-seed', 150000)).decode()

async def seed_tenants_and_sites():
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as db:
        slug = 'theboernedirtplace'
        tenant = (await db.execute(select(Tenant).where(Tenant.slug == slug))).scalar_one_or_none()
        if not tenant:
            tenant = Tenant(name='The Boerne Dirt Place', slug=slug, status=TenantStatus.ACTIVE, plan='basic')
            db.add(tenant)
            await db.flush()

        admin_email = 'admin@theboernedirtplace.com'
        user = (await db.execute(select(User).where(User.email == admin_email))).scalar_one_or_none()
        if not user:
            user = User(email=admin_email, username='dirtadmin', full_name='Dirt Admin',
                        hashed_password=PBKDF2('ChangeMe123'), role='admin')
            db.add(user)
            await db.flush()

        member = (await db.execute(
            select(TenantUser).where(TenantUser.tenant_id == tenant.id, TenantUser.user_id == user.id)
        )).scalar_one_or_none()
        if not member:
            member = TenantUser(tenant_id=tenant.id, user_id=user.id, role=TenantUserRole.TENANT_ADMIN)
            db.add(member)

        sub = (await db.execute(select(Subscription).where(Subscription.tenant_id == tenant.id))).scalar_one_or_none()
        if not sub:
            sub = Subscription(tenant_id=tenant.id, status=SubscriptionStatus.ACTIVE, plan='basic', interval='month',
                                current_period_end=datetime.now(timezone.utc))
            db.add(sub)
            await db.flush()

            invoice = Invoice(tenant_id=tenant.id, subscription_id=sub.id, amount_cents=4900, status='paid',
                              paid_at=datetime.now(timezone.utc), created_at=datetime.now(timezone.utc))
            db.add(invoice)

        site = (await db.execute(
            select(Site).where(Site.tenant_id == tenant.id, Site.url == 'https://theboernedirtplace.com')
        )).scalar_one_or_none()
        if not site:
            site = Site(name='The Boerne Dirt Place', url='https://theboernedirtplace.com', tenant_id=tenant.id,
                        monitor_enabled=True, check_interval_seconds=60, config={})
            db.add(site)

        await db.commit()
        print('Seeded tenant/site/admin/subscription OK')
        return


async def seed():
    load_dotenv()
    from app.core.security import hash_password

    await ensure_tables()
    await seed_tenants_and_sites()

    try:
        client = AsyncIOMotorClient(MONGO_URL)
        db = client['the_dirt_place']
        await db.command('ping')
        print('Connected to MongoDB!')
    except Exception as mongo_err:
        print('MongoDB skipped:', type(mongo_err).__name__)
        print('SQLite tenant/site/admin/subscription seed still valid.')
    else:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))
        from data.products import PRODUCTS

        now = datetime.utcnow()
        inserted = 0
        updated = 0
        for p in PRODUCTS:
            doc = dict(p)
            doc['created_at'] = now
            doc['updated_at'] = now
            doc['min_order'] = doc.get('min_order', 1)
            result = await db.material_pricing.update_one({'material_id': doc['material_id']}, {'$set': doc}, upsert=True)
            inserted += 1 if result.upserted_id else 0
            updated += 0 if result.upserted_id else 1

        total = await db.material_pricing.count_documents({})
        print(f'Seeded: {inserted} inserted, {updated} updated')
        print(f'Total materials: {total}')
        client.close()


if __name__ == '__main__':
    asyncio.run(seed())