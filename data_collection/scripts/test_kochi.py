"""Quick test with Kochi only"""
from magicbricks_api_scraper import MagicbricksAPIScraper

# Test with just Kochi
scraper = MagicbricksAPIScraper(max_cities=1)

# Override cities list to only Kochi
scraper.cities = ['Kochi']

print("Testing with Kochi only...")
print("="*60)

summary = scraper.run()

print(f"\n{'='*60}")
print(f"Collection Summary")
print(f"{'='*60}")
print(f"Status: {summary['status']}")
if summary['status'] == 'success':
    print(f"Total Records: {summary['records_collected']}")
    print(f"Plots File: {scraper.plots_file}")
    print(f"Flats File: {scraper.flats_file}")
    print(f"Duration: {summary['duration_seconds']:.2f}s")

