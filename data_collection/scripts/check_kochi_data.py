"""Check Kochi data quality"""
import json

print("="*60)
print("Kochi Data Quality Check")
print("="*60)

# Check plots
with open('data_collection/raw_data/magicbricks_api_plots_2025-12-08.jsonl', 'r', encoding='utf-8') as f:
    plots = [json.loads(line) for line in f]

print(f"\nPlots: {len(plots)}")
if plots:
    sample = plots[0]
    print(f"Sample Plot:")
    print(f"  City: {sample.get('city')}")
    print(f"  Locality: {sample.get('locality')}")
    print(f"  Price: {sample.get('price', {}).get('text')} ({sample.get('price', {}).get('amount')})")
    print(f"  Title: {sample.get('title')[:60]}...")
    print(f"  Coordinates: {sample.get('coordinates')}")
    
    # Count with prices
    with_price = sum(1 for p in plots if p.get('price') and p.get('price', {}).get('amount'))
    print(f"\n  Plots with price: {with_price}/{len(plots)}")
    print(f"  Plots with coordinates: {sum(1 for p in plots if p.get('coordinates'))}/{len(plots)}")

# Check flats
with open('data_collection/raw_data/magicbricks_api_flats_2025-12-08.jsonl', 'r', encoding='utf-8') as f:
    flats = [json.loads(line) for line in f]

print(f"\nFlats: {len(flats)}")
if flats:
    sample = flats[0]
    print(f"Sample Flat:")
    print(f"  City: {sample.get('city')}")
    print(f"  Locality: {sample.get('locality')}")
    print(f"  Price: {sample.get('price', {}).get('text')} ({sample.get('price', {}).get('amount')})")
    print(f"  Title: {sample.get('title')[:60]}...")
    print(f"  Coordinates: {sample.get('coordinates')}")
    
    # Count with prices
    with_price = sum(1 for f in flats if f.get('price') and f.get('price', {}).get('amount'))
    print(f"\n  Flats with price: {with_price}/{len(flats)}")
    print(f"  Flats with coordinates: {sum(1 for f in flats if f.get('coordinates'))}/{len(flats)}")

print(f"\n{'='*60}")
print(f"Total: {len(plots)} plots + {len(flats)} flats = {len(plots) + len(flats)} records")
print("="*60)

