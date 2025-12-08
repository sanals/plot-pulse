"""Quick test of API scraper with Mumbai"""
from magicbricks_api_scraper import MagicbricksAPIScraper

scraper = MagicbricksAPIScraper()

# Test with just Mumbai first
print("Testing API scraper with Mumbai...")
print("="*60)

# Test plots
print("\nTesting PLOTS...")
plot_data = scraper.fetch_listings_api('Mumbai', 'plot', page=1)
if plot_data:
    result_list = plot_data.get('resultList', [])
    print(f"✓ Got {len(result_list)} plot listings")
    if result_list:
        print(f"Sample: {result_list[0].get('propertyTitle', 'N/A')[:60]}")
        print(f"Price: {result_list[0].get('priceD', 'N/A')}")
        print(f"Type: {result_list[0].get('propTypeD', 'N/A')}")

# Test flats
print("\nTesting FLATS...")
flat_data = scraper.fetch_listings_api('Mumbai', 'flat', page=1)
if flat_data:
    result_list = flat_data.get('resultList', [])
    print(f"✓ Got {len(result_list)} flat listings")
    if result_list:
        print(f"Sample: {result_list[0].get('propertyTitle', 'N/A')[:60]}")
        print(f"Price: {result_list[0].get('priceD', 'N/A')}")
        print(f"Type: {result_list[0].get('propTypeD', 'N/A')}")

print("\n" + "="*60)
print("API is working! Ready to scrape.")
print("="*60)

