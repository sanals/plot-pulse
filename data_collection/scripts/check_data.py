"""Quick script to check collected data"""
import json
from pathlib import Path

file_path = Path("data_collection/raw_data/magicbricks_listings_2025-12-07.jsonl")

if not file_path.exists():
    # Try alternative path
    file_path = Path("data_collection/scripts/data_collection/raw_data/magicbricks_listings_2025-12-07.jsonl")

with open(file_path, 'r', encoding='utf-8') as f:
    data = [json.loads(line) for line in f]

print(f"Total records: {len(data)}")

# Check for plots
plots = [d for d in data if 'plot' in d['raw_data'].get('title', '').lower() or 
         'land' in d['raw_data'].get('title', '').lower()]

print(f"Plot/Land records: {len(plots)}")

# Check records with prices
with_price = [d for d in data if d['raw_data'].get('price')]
print(f"Records with price: {len(with_price)}")

# Sample records
print("\nSample records:")
for i, record in enumerate(data[:3], 1):
    rd = record['raw_data']
    print(f"\n{i}. Title: {rd.get('title', 'N/A')[:60]}")
    print(f"   Price: {rd.get('price_text', 'N/A')}")
    print(f"   Area: {rd.get('area_sqft', 'N/A')} sqft")
    print(f"   Location: {rd.get('location', 'N/A')}")

