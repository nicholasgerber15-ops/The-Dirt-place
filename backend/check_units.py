#!/usr/bin/env python3
"""Check units in database against CSV data"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

MONGO_URL = 'mongodb+srv://nicholasgerber15_db_user:nGskf168MsTtgC65@cluster0.6sbuaza.mongodb.net/the_dirt_place?retryWrites=true&w=majority'

# CSV data parsed (unit_type is the unit)
CSV_DATA = {
    "CAP-050": "each",
    "PIPE-05020": "each",
    "EDGE-18416B": "each",
    "EDGE-18416U": "each",
    "BLK-114C": "each",
    "SLAB-114CR": "each",
    "SLAB-225CR": "each",
    "BLK-225": "each",
    "BLK-225CB": "each",
    "CAP-075": "each",
    "CAP-075PVC": "each",
    "LIME-038": "yard",
    "LIME-038-05": "half-yard",
    "STONE-3X100": "ton",
    "SOIL-4WAY": "yard",
    "SOIL-4WAY-05": "half-yard",
    "EDGE-410BLK": "each",
    "EDGE-410BRN": "each",
    "EDGE-410GRN": "each",
    "STONE-CAVE": "ton",
    "BLK-4X6WH": "each",
    "BLK-4X8X16": "each",
    "STONE-6X4CAP": "each",
    "BLK-6X6": "each",
    "BLK-6X8X16": "each",
    "NET-8X112": "each",
    "NET-8X250": "each",
    "BLK-8X8X16": "each",
    "SAND-A1": "yard",
    "SAND-A1-05": "half-yard",
    "POT-ARGXXL": "each",
    "ASPH-MILL": "ton",
    "MULCH-BAG": "bag",
    "ROCK-LAVA": "basket",
    "GRASS-BERM": "pallet",
    "STAT-GIRB": "each",
    "STAT-IGUB": "each",
    "STAT-TURB": "each",
    "STONE-BLFLAG": "ton",
    "MULCH-BLK1": "yard",
    "MULCH-BLK05": "half-yard",
    "SLAB-BLSEL": "ton",
    "SLAB-BLUE": "each",
    "MULCH-BRN1": "yard",
    "MULCH-BRN05": "half-yard",
    "BUCK-SAND": "each",
    "STAT-BUN": "each",
    "PAV-CON3X3": "each",
    "PAV-CON4X1": "each",
    "PAV-CON3X1": "each",
    "PAV-CON9": "each",
    "PAV-CON4": "each",
    "PAV-CON6": "each",
    "FEE-CARD": "percentage",
    "MULCH-CDR1": "yard",
    "MULCH-CDR05": "half-yard",
    "PAL-QUIK": "pallet",
    "STAT-COW": "each",
    "STAT-CROC": "each",
    "LIME-CR1": "yard",
    "LIME-CR05": "half-yard",
    "LIME-CR2": "ton",
    "CUST-AMT": "each",
    "FEE-DEL": "flat",
    "SAND-PLDW": "yard",
    "SAND-PLDW-05": "half-yard",
    "POT-ELECUP": "each",
    "STAT-ELE": "each",
    "SOIL-TOP1": "yard",
    "FEE-MILE": "mile",
    "FEE-BOUNCE": "flat",
    "STAT-FISH": "set",
    "FONT-MEX": "each",
    "FEE-FREIGHT": "flat",
    "STAT-FROG": "set",
    "STAT-GIR": "each",
    "CHIP-GRA05": "half-yard",
    "CHIP-GRA1": "yard",
    "RENT-GRAP": "day",
    "BASE-GR2": "yard",
    "BASE-GR2-05": "half-yard",
    "BASE-GR34": "yard",
    "BASE-GR34-05": "half-yard",
    "CEM-GREY": "bag",
    "STONE-GUAD": "ton",
    "MULCH-HARD1": "yard",
    "MULCH-HARD05": "half-yard",
    "STAT-HORSE": "each",
    "POT-LRG": "each",
    "STAT-TURL": "each",
    "STONE-LLANO": "ton",
    "STONE-MED": "ton",
    "POT-MEXCUP": "each",
    "POT-MEXHALF": "each",
    "POT-MEXRIDGE": "each",
    "POT-MEXSWIDE": "each",
    "POT-MEXSML": "each",
    "URN-MEXSML": "each",
    "POT-MEXWIDE": "each",
    "POT-MEXW": "each",
    "URN-MEX": "each",
    "SAND-MAN": "ton",
    "SOIL-MAN": "yard",
    "STONE-MARM": "ton",
    "POT-MICH": "each",
    "PEB-MEXBAG": "bag",
    "STONE-MEXW": "ton",
    "PEB-MEX660": "ton",
    "STONE-MEXPAT": "ton",
    "STONE-BLDMOSS": "ton",
    "STAT-MUSH": "set",
    "BOUL-NAT": "pound",
    "SLAB-NAT": "ton",
    "STONE-NIC": "ton",
    "STONE-OKBLUE": "ton",
    "STONE-OKCHOP": "ton",
    "STONE-OKPAT": "ton",
    "BASE-OR1": "yard",
    "BASE-OR05": "half-yard",
    "STAT-OWL": "each",
    "FEE-PAL": "flat",
    "EQUIP-PIGGY": "rental",
    "STONE-PINK": "ton",
    "BOARD-POL": "each",
    "CEM-PORT": "bag",
    "MULCH-PREM1": "yard",
    "MULCH-PREM05": "half-yard",
    "STAT-PUMPK": "each",
    "QUIK-80": "bag",
    "RAIL-85": "each",
    "HERB-RANG": "gallon",
    "REBAR-038": "each",
    "MULCH-RED05": "half-yard",
    "MULCH-RED1": "yard",
    "STONE-REGCH": "ton",
    "PEB-RIO38": "ton",
    "ROCK-RIO12": "ton",
    "ROCK-RIO26": "ton",
    "TOOL-SHOV": "each",
    "GRASS-SA": "pallet",
    "MIX-SG05": "half-yard",
    "MIX-SG1": "yard",
    "DIRT-SF1": "yard",
    "DIRT-SF05": "half-yard",
    "STONE-SHAD": "ton",
}

async def check_units():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client['the_dirt_place']
    await db.command('ping')
    
    print("Checking units in database against CSV...")
    
    # Get all materials from DB
    materials = await db.material_pricing.find().to_list(500)
    print(f"Found {len(materials)} materials in DB")
    
    mismatches = []
    missing = []
    
    for m in materials:
        material_id = m.get('material_id', '')
        db_unit = m.get('unit_type', '')
        csv_unit = CSV_DATA.get(material_id)
        
        if not csv_unit:
            missing.append(material_id)
        elif db_unit != csv_unit:
            mismatches.append({
                'id': material_id,
                'name': m.get('name', ''),
                'db_unit': db_unit,
                'csv_unit': csv_unit
            })
    
    if mismatches:
        print(f"\nFound {len(mismatches)} unit mismatches:")
        for m in mismatches[:10]:  # Show first 10
            print(f"  {m['id']}: DB='{m['db_unit']}' vs CSV='{m['csv_unit']}' ({m['name']})")
        if len(mismatches) > 10:
            print(f"  ... and {len(mismatches) - 10} more")
    else:
        print("✅ All units match CSV data!")
    
    if missing:
        print(f"\n{len(missing)} materials in DB not in CSV")
    
    # Update mismatches
    if mismatches:
        print(f"\nUpdating {len(mismatches)} materials...")
        updated = 0
        for m in mismatches:
            result = await db.material_pricing.update_one(
                {'material_id': m['id']},
                {'$set': {'unit_type': m['csv_unit']}}
            )
            if result.modified_count > 0:
                updated += 1
        print(f"✅ Updated {updated} materials")
    
    client.close()

asyncio.run(check_units())
