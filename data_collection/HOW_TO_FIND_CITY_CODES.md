# How to Find Magicbricks City Codes

## Quick Method (Recommended)

1. **Open Magicbricks.com** in your browser
2. **Open Developer Tools** (F12)
3. **Go to Network tab**
4. **Search for a property** in any city (e.g., Delhi, Bangalore)
5. **Look for the request** to `propertySearch.html`
6. **Check the URL parameters** - the `city=` parameter contains the city code

Example:
```
https://www.magicbricks.com/mbsrp/propertySearch.html?city=4299&...
```
Here, `4299` would be the city code.

## Alternative: Test API Directly

You can also test codes by modifying the URL in the browser or using the test script:

```python
# Test if a city code works
import requests

url = "https://www.magicbricks.com/mbsrp/propertySearch.html"
params = {
    'city': '4299',  # Try different codes
    'propertyType': '10001',
    'category': 'S',
    'page': '1',
    # ... other params
}

response = requests.get(url, params=params)
data = response.json()

# Check if it worked
if data.get('resultList'):
    city_name = data['editAdditionalDataBean']['cityName']['value']
    print(f"City code works! City: {city_name}")
```

## Known City Codes

- **Mumbai**: `4320` ✅ (Confirmed - 674 flat listings, 386 plot listings)

## Next Steps

Once you find city codes from the network tab, add them to `magicbricks_api_scraper.py`:

```python
CITY_CODES = {
    'Mumbai': '4320',
    'Delhi': 'XXXX',  # Add from network tab
    'Bangalore': 'XXXX',  # Add from network tab
    # ... etc
}
```

Then run the scraper again to collect from all cities!

