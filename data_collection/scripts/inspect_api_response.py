"""Inspect the API response structure"""
import requests
import json

url = "https://www.magicbricks.com/mbsrp/propertySearch.html"
params = {
    'editSearch': 'Y',
    'category': 'S',
    'propertyType': '10003',  # Plot/Land
    'city': '4320',  # Mumbai
    'page': '1',
    'groupstart': '0',
    'offset': '0',
    'maxOffset': '100',
    'sortBy': 'premiumRecent',
    'postedSince': '-1',
    'pType': '10003',
    'isNRI': 'N',
    'multiLang': 'en'
}

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://www.magicbricks.com/',
    'Origin': 'https://www.magicbricks.com'
}

response = requests.get(url, params=params, headers=headers, timeout=10)
print(f"Status: {response.status_code}")
print(f"Content-Type: {response.headers.get('Content-Type')}")
print(f"Response length: {len(response.text)}")
print(f"First 500 chars: {response.text[:500]}")

if response.status_code == 200:
    try:
        data = response.json()
    except:
        print("\nNot JSON, saving response...")
        with open('data_collection/logs/api_response.txt', 'w', encoding='utf-8') as f:
            f.write(response.text)
        print("Saved to data_collection/logs/api_response.txt")
        exit()
else:
    print(f"Error: Status {response.status_code}")
    exit()

print("API Response Structure:")
print("="*60)
print(f"Top-level keys: {list(data.keys())}")
print(f"\nresultList length: {len(data.get('resultList', []))}")

if data.get('resultList'):
    first_item = data['resultList'][0]
    print(f"\nFirst item keys: {list(first_item.keys())}")
    print(f"\nFirst item sample:")
    print(json.dumps(first_item, indent=2, ensure_ascii=False)[:2000])

