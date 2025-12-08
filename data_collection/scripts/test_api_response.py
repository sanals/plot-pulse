"""Test API response for a city that failed"""
import requests

# Test Agra (code 5931) which failed
url = "https://www.magicbricks.com/mbsrp/propertySearch.html"
params = {
    'editSearch': 'Y',
    'category': 'S',
    'propertyType': '10003',  # Plot
    'city': '5931',  # Agra
    'page': '1',
    'groupstart': '0',
    'offset': '0',
    'maxOffset': '1000',
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

print("Testing Agra (code 5931)...")
response = requests.get(url, params=params, headers=headers, timeout=10)

print(f"Status Code: {response.status_code}")
print(f"Content-Type: {response.headers.get('Content-Type')}")
print(f"Response Length: {len(response.text)}")
print(f"\nFirst 500 characters:")
print(response.text[:500])

if response.status_code == 200:
    try:
        data = response.json()
        print(f"\n✓ Valid JSON!")
        print(f"Keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
        if isinstance(data, dict) and 'resultList' in data:
            print(f"Results: {len(data.get('resultList', []))}")
    except:
        print("\n✗ Not valid JSON")

