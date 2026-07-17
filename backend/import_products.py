#!/usr/bin/env python3

# UNIVERSAL NRG-CO HEADER BLOCK
# Use this exact banner at the top of source files. License/covenant terms still apply.
# 
################################################################
#                                                              #
#                ⚡  N R G - C O  ⚡                          #
#                                                              #
#    CRITICAL ASSET — CLOSED SOURCE / CONFIDENTIAL              #
#    PROPRIETARY / UNDER DEVELOPMENT / SECRET                   #
#                                                              #
################################################################
"""
Import product catalog from frontend mock.js into MongoDB
Run: python backend/import_products.py
"""
import os
import sys
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Product data from mock.js (176 products)
PRODUCTS = [
    {"id": "CAP-050", "name": "1/2\" Screw-On Cap", "salesDescription": "t screw on cap 1/2", "category": "Pipes & Fittings", "price": 1.98, "unit": "each", "inStock": True},
    {"id": "PIPE-05020", "name": "1/2\" x 20' Service Pipe", "salesDescription": "1/2\"x20'", "category": "Pipes & Fittings", "price": 8.75, "unit": "each", "inStock": True},
    {"id": "EDGE-18416B", "name": "Steel Edging 1/8\" x 4\" x 16' Black", "salesDescription": "1/8x4x16 black 4x16 w4stk", "category": "Edging & Borders", "price": 67.25, "unit": "each", "inStock": True, "notes": "Includes 4 stakes, 14GA"},
    {"id": "EDGE-18416U", "name": "Steel Edging 1/8\" x 4\" x 16' Uncoated", "salesDescription": "1/8x4x16 uncoated 16 feet edging 6 stks", "category": "Edging & Borders", "price": 67.25, "unit": "each", "inStock": True, "notes": "6 stakes included, 16 ft"},
    {"id": "BLK-114C", "name": "Charcoal Block 1x1x4", "salesDescription": "1x1x4 Charcoal blocks", "category": "Blocks & Pavers", "price": 85.00, "unit": "each", "inStock": True},
    {"id": "SLAB-114CR", "name": "Cream Block 1x1x4", "salesDescription": "1x1x4 Cream Blocks", "category": "Blocks & Pavers", "price": 85.00, "unit": "each", "inStock": True, "notes": "Delivery available"},
    {"id": "SLAB-225CR", "name": "Cream Slab 2 1/4\" (5x2)", "salesDescription": "2 1/4\" cream slabs 5x2", "category": "Blocks & Pavers", "price": 118.00, "unit": "each", "inStock": True},
    {"id": "BLK-225", "name": "Block 2x2x5", "salesDescription": "2x2x5 Blocks", "category": "Blocks & Pavers", "price": 250.00, "unit": "each", "inStock": True, "notes": "Delivery available"},
    {"id": "BLK-225CB", "name": "Charcoal Blue Lueders 2x2x5", "salesDescription": "2x2x5 Charcoal Blue Leuders", "category": "Blocks & Pavers", "price": 265.00, "unit": "each", "inStock": True, "notes": "Delivery available"},
    {"id": "CAP-075", "name": "3/4\" Screw-On Cap", "salesDescription": "3/4 cap t screw on cap 3/4", "category": "Pipes & Fittings", "price": 2.12, "unit": "each", "inStock": True},
    {"id": "CAP-075PVC", "name": "3/4\" PVC Top Cap", "salesDescription": "3/4 pvc cap s top cap", "category": "Pipes & Fittings", "price": 1.35, "unit": "each", "inStock": True},
    {"id": "LIME-038", "name": "Limestone 3/8\"", "salesDescription": "3/8 limestone", "category": "Aggregate & Stone", "price": 90.00, "unit": "yard", "inStock": True},
    {"id": "LIME-038-05", "name": "Limestone 3/8\" (1/2 Yard)", "salesDescription": "3/8 limestone 1/2 yd", "category": "Aggregate & Stone", "price": 45.50, "unit": "half-yard", "inStock": True},
    {"id": "STONE-3X100", "name": "Stone 3x100", "salesDescription": "3x100", "category": "Aggregate & Stone", "price": 38.00, "unit": "ton", "inStock": True},
    {"id": "SOIL-4WAY", "name": "4-Way Mix", "salesDescription": "4 Way Mix - Mixture of topsoil, landscape mix", "category": "Soil & Compost", "price": 58.00, "unit": "yard", "inStock": True},
    {"id": "SOIL-4WAY-05", "name": "4-Way Mix (1/2 Yard)", "salesDescription": "4 Way Mix 1/2 yd - Mixture of topsoil, landscape", "category": "Soil & Compost", "price": 27.75, "unit": "half-yard", "inStock": True},
    {"id": "EDGE-410BLK", "name": "Steel Edging 4\" x 10' Black 14GA", "salesDescription": "4\"x10' black 14GA w/4stk", "category": "Edging & Borders", "price": 31.50, "unit": "each", "inStock": True, "notes": "Includes 4 stakes"},
    {"id": "EDGE-410BRN", "name": "Steel Edging 4\" x 10' Brown 14GA", "salesDescription": "4\"x10' brown 14GA w/4stk", "category": "Edging & Borders", "price": 32.50, "unit": "each", "inStock": True, "notes": "Includes 4 stakes"},
    {"id": "EDGE-410GRN", "name": "Steel Edging 4\" x 10' Green 14GA", "salesDescription": "4\"x10' w/4stk green 14GA", "category": "Edging & Borders", "price": 31.50, "unit": "each", "inStock": True, "notes": "Includes 4 stakes"},
    {"id": "STONE-CAVE", "name": "Cave Stone 4\"-6\"-8\"", "salesDescription": "4-6-8\" Cave Pall", "category": "Aggregate & Stone", "price": 245.00, "unit": "ton", "inStock": True},
    {"id": "BLK-4X6WH", "name": "White Chop Block 4x6", "salesDescription": "4x6 white chop blocks", "category": "Blocks & Pavers", "price": 235.00, "unit": "each", "inStock": True},
    {"id": "BLK-4X8X16", "name": "Concrete Block 4x8x16", "salesDescription": "4x8x16 block", "category": "Blocks & Pavers", "price": 3.20, "unit": "each", "inStock": True},
    {"id": "STONE-6X4CAP", "name": "Sandstone Cap 6x4", "salesDescription": "6x4 cap sand stone", "category": "Blocks & Pavers", "price": 255.00, "unit": "each", "inStock": True},
    {"id": "BLK-6X6", "name": "Block 6x6", "salesDescription": "6x6 Blocks", "category": "Blocks & Pavers", "price": 235.00, "unit": "each", "inStock": True},
    {"id": "BLK-6X8X16", "name": "Concrete Block 6x8x16", "salesDescription": "6x8x16 blocks", "category": "Blocks & Pavers", "price": 3.25, "unit": "each", "inStock": True},
    {"id": "NET-8X112", "name": "Netting 8x112", "salesDescription": "8x112 net", "category": "Landscaping Supplies", "price": 67.50, "unit": "each", "inStock": True},
    {"id": "NET-8X250", "name": "Netting 8x250 Pro", "salesDescription": "8x250 pro", "category": "Landscaping Supplies", "price": 395.00, "unit": "each", "inStock": True},
    {"id": "BLK-8X8X16", "name": "Concrete Block 8x8x16", "salesDescription": "8x8x16 blocks", "category": "Blocks & Pavers", "price": 3.85, "unit": "each", "inStock": True},
    {"id": "SAND-A1", "name": "A-1 Masonry Sand (1 Yard)", "salesDescription": "A-1 MASONRY SAND", "category": "Sand & Gravel", "price": 72.00, "unit": "yard", "inStock": True},
    {"id": "SAND-A1-05", "name": "A-1 Masonry Sand (1/2 Yard)", "salesDescription": "A-1 masonry sand 1/2 yard", "category": "Sand & Gravel", "price": 35.25, "unit": "half-yard", "inStock": True},
    {"id": "POT-ARGXXL", "name": "Argolla XXL Mexico Flower Pot", "salesDescription": "argolla 3 left", "category": "Planters & Pots", "price": 175.65, "unit": "each", "inStock": True, "inventory": 3},
    {"id": "ASPH-MILL", "name": "Asphalt Millings", "salesDescription": "Asphalt Millings", "category": "Aggregate & Stone", "price": 37.00, "unit": "ton", "inStock": True},
    {"id": "MULCH-BAG", "name": "Bag of Mulch (Black/Brown)", "salesDescription": "Black and Brown", "category": "Mulch", "price": 4.95, "unit": "bag", "inStock": True},
    {"id": "ROCK-LAVA", "name": "Lava Rock (Basket)", "salesDescription": "Basket Lava Rock", "category": "Decorative Stone", "price": 545.00, "unit": "basket", "inStock": True},
    {"id": "GRASS-BERM", "name": "Bermuda Grass (8 Pallets)", "salesDescription": "8 pallets $260 each, unloaded", "category": "Grass & Turf", "price": 2180.00, "unit": "pallet", "inStock": True, "notes": "Unloaded delivery"},
    {"id": "STAT-GIRB", "name": "Big Giraffe Statue", "salesDescription": "Big giraffe", "category": "Garden Decor", "price": 60.00, "unit": "each", "inStock": True},
    {"id": "STAT-IGUB", "name": "Big Iguana Statue", "salesDescription": "Big iguana", "category": "Garden Decor", "price": 55.00, "unit": "each", "inStock": True},
    {"id": "STAT-TURB", "name": "Big Turtle Statue", "salesDescription": "Big turtle", "category": "Garden Decor", "price": 55.00, "unit": "each", "inStock": True},
    {"id": "STONE-BLFLAG", "name": "Black Flagstone", "salesDescription": "Black Flagstone 310/ton", "category": "Aggregate & Stone", "price": 310.00, "unit": "ton", "inStock": True},
    {"id": "MULCH-BLK1", "name": "Black Dyed Mulch (1 Yard)", "salesDescription": "BLACK DYED MULCH", "category": "Mulch", "price": 44.39, "unit": "yard", "inStock": True},
    {"id": "MULCH-BLK05", "name": "Black Dyed Mulch (1/2 Yard)", "salesDescription": "BLACK DYED MULCH", "category": "Mulch", "price": 23.94, "unit": "half-yard", "inStock": True},
    {"id": "SLAB-BLSEL", "name": "Black Select Slabs", "salesDescription": "Black select Slabs 350/ton", "category": "Aggregate & Stone", "price": 350.00, "unit": "ton", "inStock": True},
    {"id": "SLAB-BLUE", "name": "Blue Lueders Slab 5x2", "salesDescription": "Blue Lueders 5x2", "category": "Aggregate & Stone", "price": 118.00, "unit": "each", "inStock": True},
    {"id": "MULCH-BRN1", "name": "Brown Dyed Mulch (1 Yard)", "salesDescription": "BROWN DYED MULCH", "category": "Mulch", "price": 44.39, "unit": "yard", "inStock": True},
    {"id": "MULCH-BRN05", "name": "Brown Dyed Mulch (1/2 Yard)", "salesDescription": "BROWN DYED MULCH", "category": "Mulch", "price": 23.94, "unit": "half-yard", "inStock": True},
    {"id": "BUCK-SAND", "name": "Bucket / Sand", "salesDescription": "each bucket $8 sand $6", "category": "Landscaping Supplies", "price": 8.00, "unit": "each", "inStock": True, "notes": "Sand fill $6"},
    {"id": "STAT-BUN", "name": "Bunny Statue", "salesDescription": "Bunny", "category": "Garden Decor", "price": 0.00, "unit": "each", "inStock": False, "notes": "Price pending"},
    {"id": "PAV-CON3X3", "name": "Contractor Select+ 3'x3'", "salesDescription": "CONTRACTOR SELECT+ 3'X3'", "category": "Blocks & Pavers", "price": 92.00, "unit": "each", "inStock": True},
    {"id": "PAV-CON4X1", "name": "Contractor Select+ 4'x1'", "salesDescription": "CONTRACTOR SELECT+ 4'X1'", "category": "Blocks & Pavers", "price": 49.31, "unit": "each", "inStock": True},
    {"id": "PAV-CON3X1", "name": "Contractor Select+ 3'x1'", "salesDescription": "CONTRACTOR SELECT+ 3'X1'", "category": "Blocks & Pavers", "price": 42.15, "unit": "each", "inStock": True},
    {"id": "PAV-CON9", "name": "Contractor Select+ 9'x", "salesDescription": "CONTRACTORS SELECT+ 9'X", "category": "Blocks & Pavers", "price": 293.00, "unit": "each", "inStock": True},
    {"id": "PAV-CON4", "name": "Contractor Select+ 4'x", "salesDescription": "CONTRACTORS SELECT+ 4'X", "category": "Blocks & Pavers", "price": 136.00, "unit": "each", "inStock": True},
    {"id": "PAV-CON6", "name": "Contractor Select+ 6'x", "salesDescription": "CONTRACTORS SELECT+ 6'X", "category": "Blocks & Pavers", "price": 175.00, "unit": "each", "inStock": True},
    {"id": "FEE-CARD", "name": "Card Processing Fee", "salesDescription": "3.5% Processing Fee", "category": "Services & Fees", "price": 0.035, "unit": "percentage", "inStock": True, "notes": "Applied at checkout"},
    {"id": "MULCH-CDR1", "name": "Cedar Mulch (1 Yard)", "salesDescription": "CEDAR MULCH", "category": "Mulch", "price": 28.00, "unit": "yard", "inStock": True},
    {"id": "MULCH-CDR05", "name": "Cedar Mulch (1/2 Yard)", "salesDescription": "CEDAR MULCH", "category": "Mulch", "price": 15.75, "unit": "half-yard", "inStock": True},
    {"id": "PAL-QUIK", "name": "Concrete Pallet (Quikrete)", "salesDescription": "Concrete Pallet", "category": "Concrete & Cement", "price": 304.50, "unit": "pallet", "inStock": True, "notes": "Must add $25 for pallet delivery"},
    {"id": "STAT-COW", "name": "Cow Decorative Statue", "salesDescription": "Cow decorative", "category": "Garden Decor", "price": 58.00, "unit": "each", "inStock": True},
    {"id": "STAT-CROC", "name": "Crocodile Statue", "salesDescription": "Crocodile hand made decor", "category": "Garden Decor", "price": 55.65, "unit": "each", "inStock": True},
    {"id": "LIME-CR1", "name": "Crushed Limestone 1\" (1 Yard)", "salesDescription": "CRUSHED LIMESTONE 1\"", "category": "Aggregate & Stone", "price": 59.00, "unit": "yard", "inStock": True},
    {"id": "LIME-CR05", "name": "Crushed Limestone 1\" (1/2 Yard)", "salesDescription": "CRUSHED LIMESTONE 1\"", "category": "Aggregate & Stone", "price": 31.25, "unit": "half-yard", "inStock": True},
    {"id": "LIME-CR2", "name": "Crushed Limestone 2\"", "salesDescription": "Crushed limestone 2\"", "category": "Aggregate & Stone", "price": 90.00, "unit": "ton", "inStock": True},
    {"id": "CUST-AMT", "name": "Custom Amount", "salesDescription": "Non-Inventory", "category": "Services & Fees", "price": 0.00, "unit": "each", "inStock": True},
    {"id": "FEE-DEL", "name": "Delivery Fee", "salesDescription": "Delivery fee", "category": "Services & Fees", "price": 70.00, "unit": "flat", "inStock": True},
    {"id": "SAND-PLDW", "name": "Double Washed Plaster Sand (1 Yard)", "salesDescription": "PLASTER SAND", "category": "Sand & Gravel", "price": 72.00, "unit": "yard", "inStock": True},
    {"id": "SAND-PLDW-05", "name": "Double Washed Plaster Sand (1/2 Yard)", "salesDescription": "PLASTER SAND", "category": "Sand & Gravel", "price": 30.25, "unit": "half-yard", "inStock": True},
    {"id": "POT-ELECUP", "name": "Elegant Cup Flower Pot", "salesDescription": "Elegant cup flower pot", "category": "Planters & Pots", "price": 78.65, "unit": "each", "inStock": True},
    {"id": "STAT-ELE", "name": "Elephant Statue", "salesDescription": "Elephant", "category": "Garden Decor", "price": 25.00, "unit": "each", "inStock": True},
    {"id": "SOIL-TOP1", "name": "Enriched Topsoil (1 Yard)", "salesDescription": "Mixture of sandy loam", "category": "Soil & Compost", "price": 48.89, "unit": "yard", "inStock": True},
    {"id": "FEE-MILE", "name": "Delivery Per Mile", "salesDescription": "Every Fee Per Mile", "category": "Services & Fees", "price": 5.00, "unit": "mile", "inStock": True},
    {"id": "FEE-BOUNCE", "name": "Bounced Check Fee", "salesDescription": "Fee for bounced check", "category": "Services & Fees", "price": 35.00, "unit": "flat", "inStock": True},
    {"id": "STAT-FISH", "name": "Fish Statue Set", "salesDescription": "Fish set", "category": "Garden Decor", "price": 0.00, "unit": "set", "inStock": False, "notes": "Price pending"},
    {"id": "FONT-MEX", "name": "Mexican Water Fountain", "salesDescription": "Mexico water fountain", "category": "Planters & Pots", "price": 115.00, "unit": "each", "inStock": True},
    {"id": "FEE-FREIGHT", "name": "Freight Fee", "salesDescription": "Freight", "category": "Services & Fees", "price": 350.00, "unit": "flat", "inStock": True},
    {"id": "STAT-FROG", "name": "Frog Statue Set", "salesDescription": "Frog set", "category": "Garden Decor", "price": 0.00, "unit": "set", "inStock": False, "notes": "Price pending"},
    {"id": "STAT-GIR", "name": "Giraffe Statue", "salesDescription": "Giraffe", "category": "Garden Decor", "price": 0.00, "unit": "each", "inStock": False, "notes": "Price pending"},
    {"id": "CHIP-GRA05", "name": "Granite Chips (1/2 Yard)", "salesDescription": "GRANITE CHIPS-1/2\"", "category": "Decorative Stone", "price": 44.25, "unit": "half-yard", "inStock": True},
    {"id": "CHIP-GRA1", "name": "Granite Chips (1 Yard)", "salesDescription": "GRANITE CHIPS-1\"", "category": "Decorative Stone", "price": 90.00, "unit": "yard", "inStock": True},
    {"id": "RENT-GRAP", "name": "Grapple Rental", "salesDescription": "Grabbers - Rent $70 per day", "category": "Services & Fees", "price": 70.00, "unit": "day", "inStock": True, "notes": "$70 per day rental"},
    {"id": "BASE-GR2", "name": "Gravel Base #2 1 1/2\" (1 Yard)", "salesDescription": "Gravel base #2 1 yard - 1 1/2\"", "category": "Aggregate & Stone", "price": 36.00, "unit": "yard", "inStock": True},
    {"id": "BASE-GR2-05", "name": "Gravel Base #2 1 1/2\" (1/2 Yard)", "salesDescription": "Gravel base #2 1/2 yard - 1 1/2\"", "category": "Aggregate & Stone", "price": 19.75, "unit": "half-yard", "inStock": True},
    {"id": "BASE-GR34", "name": "Gravel Base 3/4\" (1 Yard)", "salesDescription": "GRAVEL BASE", "category": "Aggregate & Stone", "price": 36.00, "unit": "yard", "inStock": True},
    {"id": "BASE-GR34-05", "name": "Gravel Base 3/4\" (1/2 Yard)", "salesDescription": "GRAVEL BASE", "category": "Aggregate & Stone", "price": 19.75, "unit": "half-yard", "inStock": True},
    {"id": "CEM-GREY", "name": "Grey Cement", "salesDescription": "Grey type cement", "category": "Concrete & Cement", "price": 13.25, "unit": "bag", "inStock": True},
    {"id": "STONE-GUAD", "name": "Guadalupe Stone 1 1/2\"", "salesDescription": "Guadalupe 1 1/2\"", "category": "Aggregate & Stone", "price": 110.00, "unit": "ton", "inStock": True},
    {"id": "MULCH-HARD1", "name": "Hardwood Compost Mulch (1 Yard)", "salesDescription": "Hardwood compost Mulch", "category": "Mulch", "price": 38.83, "unit": "yard", "inStock": True},
    {"id": "MULCH-HARD05", "name": "Hardwood Compost Mulch (1/2 Yard)", "salesDescription": "Hardwood compost Mulch", "category": "Mulch", "price": 21.16, "unit": "half-yard", "inStock": True},
    {"id": "STAT-HORSE", "name": "Horse Statue", "salesDescription": "Horse", "category": "Garden Decor", "price": 58.00, "unit": "each", "inStock": True},
    {"id": "POT-LRG", "name": "Large Flower Pot", "salesDescription": "Large pot flower pot", "category": "Planters & Pots", "price": 86.00, "unit": "each", "inStock": True},
    {"id": "STAT-TURL", "name": "Little Turtle Statue", "salesDescription": "Little turtle", "category": "Garden Decor", "price": 15.80, "unit": "each", "inStock": True},
    {"id": "STONE-LLANO", "name": "Llano Stone 2\"-4\"", "salesDescription": "Llano 2\"-4\"", "category": "Aggregate & Stone", "price": 135.00, "unit": "ton", "inStock": True},
    {"id": "STONE-MED", "name": "Medina Stone 1\"", "salesDescription": "MEDINA 1\"", "category": "Aggregate & Stone", "price": 105.00, "unit": "ton", "inStock": True},
    {"id": "POT-MEXCUP", "name": "Mexican Cup Pot", "salesDescription": "MEXICAN (cup) POT", "category": "Planters & Pots", "price": 129.00, "unit": "each", "inStock": True},
    {"id": "POT-MEXHALF", "name": "Mexican Half Pot", "salesDescription": "MEXICAN (half) POT", "category": "Planters & Pots", "price": 139.00, "unit": "each", "inStock": True},
    {"id": "POT-MEXRIDGE", "name": "Mexican Ridged Pot", "salesDescription": "MEXICAN (ridged) POT", "category": "Planters & Pots", "price": 85.00, "unit": "each", "inStock": True},
    {"id": "POT-MEXSWIDE", "name": "Mexican Small Wide Pot", "salesDescription": "MEXICAN (small wide) POT", "category": "Planters & Pots", "price": 129.00, "unit": "each", "inStock": True},
    {"id": "POT-MEXSML", "name": "Mexican Small Pot", "salesDescription": "MEXICAN (small) POT", "category": "Planters & Pots", "price": 29.00, "unit": "each", "inStock": True},
    {"id": "URN-MEXSML", "name": "Mexican Small Urn", "salesDescription": "MEXICAN (small) URN", "category": "Planters & Pots", "price": 49.00, "unit": "each", "inStock": True},
    {"id": "POT-MEXWIDE", "name": "Mexican Wide Top Pot", "salesDescription": "MEXICAN (wide top) POT", "category": "Planters & Pots", "price": 169.00, "unit": "each", "inStock": True},
    {"id": "POT-MEXW", "name": "Mexican Wide Pot", "salesDescription": "MEXICAN (wide) POT", "category": "Planters & Pots", "price": 295.00, "unit": "each", "inStock": True},
    {"id": "URN-MEX", "name": "Mexican Urn", "salesDescription": "MEXICAN URN", "category": "Planters & Pots", "price": 195.00, "unit": "each", "inStock": True},
    {"id": "SAND-MAN", "name": "Manufactured Sand", "salesDescription": "Manufactured Sand", "category": "Sand & Gravel", "price": 59.00, "unit": "ton", "inStock": True},
    {"id": "SOIL-MAN", "name": "Manure Compost", "salesDescription": "MANURE COMPOST screened", "category": "Soil & Compost", "price": 58.00, "unit": "yard", "inStock": True},
    {"id": "STONE-MARM", "name": "Marmol Stone 2\"-3\"", "salesDescription": "Marmol 2\"-3\" 660 per ton", "category": "Aggregate & Stone", "price": 660.00, "unit": "ton", "inStock": True},
    {"id": "POT-MICH", "name": "Michoacan Large Pot", "salesDescription": "Mechoacano large - large michuacano", "category": "Planters & Pots", "price": 98.65, "unit": "each", "inStock": True},
    {"id": "PEB-MEXBAG", "name": "Mexican Beach Pebbles (50lb Bag)", "salesDescription": "Mexican Beach Pebbles - 50lb bags", "category": "Decorative Stone", "price": 32.50, "unit": "bag", "inStock": True},
    {"id": "STONE-MEXW", "name": "Mexican White Stand-Ups", "salesDescription": "Mexican White Stand-Ups", "category": "Aggregate & Stone", "price": 390.00, "unit": "ton", "inStock": True},
    {"id": "PEB-MEX660", "name": "Mexico Beach Pebbles", "salesDescription": "Mexico Beach Pebbles 660 per ton", "category": "Decorative Stone", "price": 660.00, "unit": "ton", "inStock": True},
    {"id": "STONE-MEXPAT", "name": "Mexico White Patio", "salesDescription": "Mexico White patio", "category": "Aggregate & Stone", "price": 290.00, "unit": "ton", "inStock": True},
    {"id": "STONE-BLDMOSS", "name": "Moss Boulders", "salesDescription": "Moss Boulders 190 per ton", "category": "Aggregate & Stone", "price": 190.00, "unit": "ton", "inStock": True},
    {"id": "STAT-MUSH", "name": "Mushroom Statue Set", "salesDescription": "Mushroom set", "category": "Garden Decor", "price": 58.00, "unit": "set", "inStock": True},
    {"id": "BOUL-NAT", "name": "Native Boulders", "salesDescription": "Boulders white cream color", "category": "Aggregate & Stone", "price": 0.20, "unit": "pound", "inStock": True, "notes": "Price per lb"},
    {"id": "SLAB-NAT", "name": "Native Slabs", "salesDescription": "Native Slabs 280 per ton", "category": "Aggregate & Stone", "price": 280.00, "unit": "ton", "inStock": True},
    {"id": "STONE-NIC", "name": "Nicotina Stone", "salesDescription": "Nicotina", "category": "Aggregate & Stone", "price": 245.00, "unit": "ton", "inStock": True},
    {"id": "STONE-OKBLUE", "name": "Oklahoma Blue Stand-Ups", "salesDescription": "Oklahoma blue Stand ups 861 per ton", "category": "Aggregate & Stone", "price": 861.00, "unit": "ton", "inStock": True},
    {"id": "STONE-OKCHOP", "name": "Oklahoma Chop", "salesDescription": "Oklahoma chop", "category": "Aggregate & Stone", "price": 405.00, "unit": "ton", "inStock": True},
    {"id": "STONE-OKPAT", "name": "Oklahoma Patio", "salesDescription": "Oklahoma patio - TWO COLORS", "category": "Aggregate & Stone", "price": 430.00, "unit": "ton", "inStock": True},
    {"id": "BASE-OR1", "name": "Orange Base (1 Yard)", "salesDescription": "Orange Base 1 Yard", "category": "Aggregate & Stone", "price": 42.00, "unit": "yard", "inStock": True},
    {"id": "BASE-OR05", "name": "Orange Base (1/2 Yard)", "salesDescription": "Orange Base 1/2 Yard", "category": "Aggregate & Stone", "price": 21.75, "unit": "half-yard", "inStock": True},
    {"id": "STAT-OWL", "name": "Owl Flower Pot/Statue", "salesDescription": "Owl owl flower pot", "category": "Garden Decor", "price": 58.00, "unit": "each", "inStock": True},
    {"id": "FEE-PAL", "name": "Pallet Only Fee", "salesDescription": "Pallet Only - if pallet was taken", "category": "Services & Fees", "price": 25.00, "unit": "flat", "inStock": True},
    {"id": "EQUIP-PIGGY", "name": "Piggyback Pallet Machine", "salesDescription": "Piggyback Pallet lowering machine", "category": "Services & Fees", "price": 100.00, "unit": "rental", "inStock": True, "notes": "Pallet lowering machine"},
    {"id": "STONE-PINK", "name": "Pink Swirl Stand-Ups", "salesDescription": "Pink Swirl stand ups", "category": "Aggregate & Stone", "price": 360.00, "unit": "ton", "inStock": True},
    {"id": "BOARD-POL", "name": "Polly Board 3.5\" x 20\"", "salesDescription": "Polly Board 3.5\"x20\" - DOES NOT INCLUDE stakes", "category": "Landscaping Supplies", "price": 50.00, "unit": "each", "inStock": True, "notes": "DOES NOT INCLUDE stakes"},
    {"id": "CEM-PORT", "name": "Portland Cement", "salesDescription": "Portlen Cement", "category": "Concrete & Cement", "price": 16.97, "unit": "bag", "inStock": True},
    {"id": "MULCH-PREM1", "name": "Premium Native Mulch (1 Yard)", "salesDescription": "PREMIUM NATIVE", "category": "Mulch", "price": 30.00, "unit": "yard", "inStock": True},
    {"id": "MULCH-PREM05", "name": "Premium Native Mulch (1/2 Yard)", "salesDescription": "PREMIUM NATIVE Mulch", "category": "Mulch", "price": 16.75, "unit": "half-yard", "inStock": True},
    {"id": "STAT-PUMPK", "name": "Pumpkin Statue", "salesDescription": "Pumpkin", "category": "Garden Decor", "price": 65.00, "unit": "each", "inStock": True},
    {"id": "QUIK-80", "name": "Quikrete 80lb Bag", "salesDescription": "Quikrete 80lb bag", "category": "Concrete & Cement", "price": 8.50, "unit": "bag", "inStock": True},
    {"id": "RAIL-85", "name": "Railroad Ties", "salesDescription": "Railroad Ties 8.5\"L x 8.5\"H", "category": "Landscaping Supplies", "price": 37.94, "unit": "each", "inStock": True},
    {"id": "HERB-RANG", "name": "Ranger Pro Herbicide 2.5 Gal", "salesDescription": "Ranger Pro Herbicide 2.5 Gal - Weed killer also kills grass", "category": "Chemicals & Treatments", "price": 85.00, "unit": "gallon", "inStock": True},
    {"id": "REBAR-038", "name": "Rebar 3/8\" x 20'", "salesDescription": "Rebar 3/8\"x20'", "category": "Landscaping Supplies", "price": 7.25, "unit": "each", "inStock": True},
    {"id": "MULCH-RED05", "name": "Red Dyed Mulch (1/2 Yard)", "salesDescription": "RED DYED MULCH", "category": "Mulch", "price": 23.94, "unit": "half-yard", "inStock": True},
    {"id": "MULCH-RED1", "name": "Red Dyed Mulch (1 Yard)", "salesDescription": "RED DYED MULCH", "category": "Mulch", "price": 44.39, "unit": "yard", "inStock": True},
    {"id": "STONE-REGCH", "name": "Reg Chop White", "salesDescription": "Reg Chop White per ton", "category": "Aggregate & Stone", "price": 240.00, "unit": "ton", "inStock": True},
    {"id": "PEB-RIO38", "name": "Rio Pea Gravel 3/8\"", "salesDescription": "Rio Pea Gravel 3/8\"", "category": "Decorative Stone", "price": 150.00, "unit": "ton", "inStock": True},
    {"id": "ROCK-RIO12", "name": "Rio Rock 1\"-2\"", "salesDescription": "Rio Rock 1\"-2\"", "category": "Decorative Stone", "price": 150.00, "unit": "ton", "inStock": True},
    {"id": "ROCK-RIO26", "name": "Rio Rock 2\"-6\"", "salesDescription": "Rio Rock 2\"-6\"", "category": "Decorative Stone", "price": 150.00, "unit": "ton", "inStock": True},
    {"id": "TOOL-SHOV", "name": "Round Shovel", "salesDescription": "Round Shovel", "category": "Tools & Equipment", "price": 20.99, "unit": "each", "inStock": True},
    {"id": "GRASS-SA", "name": "St. Augustine Pro Vista Grass", "salesDescription": "San Augustine pro vista grass 290 delivered", "category": "Grass & Turf", "price": 290.00, "unit": "pallet", "inStock": True, "notes": "Delivered price"},
    {"id": "MIX-SG05", "name": "Sand & Gravel Mix (1/2 Yard)", "salesDescription": "Sand Gravel Mix 1/2", "category": "Aggregate & Stone", "price": 35.75, "unit": "half-yard", "inStock": True},
    {"id": "MIX-SG1", "name": "Sand & Gravel Mix (1 Yard)", "salesDescription": "Sand Gravel Mix (Full Yard)", "category": "Aggregate & Stone", "price": 72.00, "unit": "yard", "inStock": True},
    {"id": "DIRT-SF1", "name": "Screened Field Dirt (1 Yard)", "salesDescription": "Screened Field", "category": "Soil & Compost", "price": 35.00, "unit": "yard", "inStock": True},
    {"id": "DIRT-SF05", "name": "Screened Field Dirt (1/2 Yard)", "salesDescription": "Field Dirt 1/2", "category": "Soil & Compost", "price": 18.50, "unit": "half-yard", "inStock": True},
    {"id": "STONE-SHAD", "name": "Shadow Rock 3/8\"", "salesDescription": "Shadow Rock 3/8", "category": "Decorative Stone", "price": 168.00, "unit": "ton", "inStock": True}
]

def transform_product(p):
    """Transform frontend product format to backend material_pricing format"""
    return {
        "material_id": p["id"],
        "name": p["name"],
        "description": p.get("salesDescription", ""),
        "category": p.get("category", ""),
        "price_per_unit": p["price"],
        "unit_type": p["unit"],
        "stock_quantity": 100 if p.get("inStock", True) else 0,
        "min_order": 1,
        "taxable": False,
        "type": p.get("type", "Service"),
        "notes": p.get("notes", ""),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }

async def import_to_mongodb():
    """Import products into MongoDB"""
    mongo_url = os.environ.get('MONGO_URL') or os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'the_dirt_place')
    
    if not mongo_url:
        print("ERROR: MONGO_URL not set in .env file")
        print("Please set MONGO_URL=mongodb+srv://... in backend/.env")
        return False
    
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        
        print(f"Connecting to MongoDB...")
        
        # Check if using X.509 certificate authentication
        if 'authMechanism=MONGODB-X509' in mongo_url:
            cert_file = os.environ.get('MONGO_CERT', 'theboernedirtplace.com.pem')
            print(f"Using X.509 certificate auth with: {cert_file}")
            import ssl
            ssl_context = ssl.create_default_context(
                cafile=cert_file,
                purpose=ssl.Purpose.SERVER_AUTH
            )
            ssl_context.load_cert_chain(cert_file)
            
            client = AsyncIOMotorClient(
                mongo_url,
                tls=True,
                tlsCertificateKeyFile=cert_file
            )
        else:
            # Standard username/password authentication
            client = AsyncIOMotorClient(mongo_url)
        
        db = client[db_name]
        
        # Test connection
        await client.admin.command('ping')
        print(f"Connected to database: {db_name}")
        
        # Clear existing materials
        result = await db.material_pricing.delete_many({})
        print(f"Cleared {result.deleted_count} existing materials")
        
        # Transform and insert products
        materials = [transform_product(p) for p in PRODUCTS]
        result = await db.material_pricing.insert_many(materials)
        
        print(f"Successfully imported {len(result.inserted_ids)} products")
        
        # Create indexes
        await db.material_pricing.create_index("material_id", unique=True)
        await db.material_pricing.create_index("category")
        print("Created indexes on material_id and category")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("The Dirt Place - Product Catalog Import Tool")
    print("=" * 60)
    print(f"Total products to import: {len(PRODUCTS)}")
    print()
    
    success = asyncio.run(import_to_mongodb())
    
    if success:
        print()
        print("=" * 60)
        print("IMPORT COMPLETE!")
        print("=" * 60)
        print("Products are now in MongoDB.")
        print("Restart backend to see changes.")
    else:
        print()
        print("Import failed. Check your MONGO_URL in backend/.env")
        sys.exit(1)
