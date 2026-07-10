#!/usr/bin/env python3
"""
Standalone DB seed script - sync version using pymongo.
Inserts all 145 products into MongoDB.

Usage:
    python backend/seed_db.py

Requires MONGO_URL and DB_NAME set in backend/.env
"""
import os
import sys
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent / '.env')

MONGO_URL = os.environ.get('MONGO_URL')
DB_NAME = os.environ.get('DB_NAME', 'the_dirt_place')

if not MONGO_URL:
    print("ERROR: MONGO_URL not set in backend/.env")
    sys.exit(1)

try:
    from pymongo import MongoClient
    from backend.data.products import PRODUCTS
except ImportError as e:
    print(f"ERROR: Missing dependency: {e}")
    print("Run: pip install pymongo python-dotenv")
    sys.exit(1)

def seed():
    client = MongoClient(MONGO_URL)
    db = client[DB_NAME]
    coll = db.material_pricing

    existing = coll.count_documents({})
    print(f"Existing materials: {existing}")

    now = datetime.utcnow()
    inserted = 0
    updated = 0

    for p in PRODUCTS:
        doc = dict(p)
        doc['created_at'] = now
        doc['updated_at'] = now
        doc['min_order'] = doc.get('min_order', 1)

        result = coll.update_one(
            {"material_id": doc["material_id"]},
            {"$set": doc},
            upsert=True
        )
        if result.upserted_id:
            inserted += 1
        else:
            updated += 1

    total = coll.count_documents({})
    print(f"Seeded: {inserted} inserted, {updated} updated")
    print(f"Total materials: {total}")
    client.close()

if __name__ == "__main__":
    seed()
