#!/usr/bin/env python3
"""
Seed script to import all materials from mock.js into MongoDB
Run: python seed_materials.py
"""
import asyncio
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# All products from mock.js converted to Python
from backend.data.products import PRODUCTS

async def seed_database():
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'the_dirt_place')
    
    if not mongo_url:
        print("ERROR: MONGO_URL not set")
        return
    
    try:
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        await db.command('ping')
        print(f"Connected to MongoDB: {db_name}")
        
        # Check existing count
        existing_count = await db.material_pricing.count_documents({})
        print(f"Existing materials: {existing_count}")
        
        # Add created_at and updated_at to all products
        from datetime import datetime
        now = datetime.utcnow()
        for p in PRODUCTS:
            p['created_at'] = now
            p['updated_at'] = now
            p['min_order'] = 1
        
        # Insert or update each product
        inserted = 0
        updated = 0
        for p in PRODUCTS:
            result = await db.material_pricing.update_one(
                {"material_id": p["material_id"]},
                {"$set": p},
                upsert=True
            )
            if result.upserted_id:
                inserted += 1
            else:
                updated += 1
        
        print(f"Seeded database: {inserted} inserted, {updated} updated")
        print(f"Total materials: {await db.material_pricing.count_documents({})}")
        
        client.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(seed_database())
