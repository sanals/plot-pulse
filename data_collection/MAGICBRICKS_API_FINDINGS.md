# Magicbricks API Investigation - Findings

## Summary

Discovered that Magicbricks uses a JSON API endpoint (`/mbsrp/propertySearch.html`) that returns structured data directly, making it **much more efficient** than HTML scraping.

## API Endpoint

**URL**: `https://www.magicbricks.com/mbsrp/propertySearch.html`

**Key Parameters**:
- `category`: 'S' (Sale) or 'R' (Rent)
- `propertyType`: Property type code
  - `10001` = Flat/Apartment
  - `10002` = House/Villa
  - `10003` = Plot/Land
  - `10021`, `10022` = Other types
- `city`: City code (e.g., `4320` for Mumbai)
- `page`: Page number (1-based)
- `groupstart`: Offset (typically `(page - 1) * 30`)
- `offset`: Usually `0`
- `maxOffset`: Maximum offset (use large number like `1000`)
- `sortBy`: `premiumRecent` (recommended)
- `postedSince`: `-1` (all time)
- `pType`: Same as `propertyType`
- `isNRI`: 'N' or 'Y'
- `multiLang`: 'en'

## Response Structure

The API returns JSON with:
- `resultList`: Array of property listings (typically 30 per page)
- `editAdditionalDataBean`: Metadata including:
  - `resultCount`: Total number of results
  - `resultPerPageCount`: Items per page (usually 30)
  - `pageCount`: Total pages
  - `cityName`: `{"key": "4320", "value": "Mumbai"}`

## Listing Object Fields

Key fields in each listing:
- `id`: Listing ID
- `encId`: Encrypted ID
- `price`: Numeric price
- `priceD`: Formatted price (e.g., "9 Cr")
- `pmtLat`, `pmtLong`: Coordinates
- `ctName`: City name
- `locSeoName` or `loc`: Locality
- `propertyTitle`: Property title
- `propTypeD`: Property type description
- `ca`: Carpet area (sqft)
- `la`: Land area (sqft)
- `sqFtPrice`: Price per sqft
- `seoURL`: SEO-friendly URL
- `defaultAdddressGoogle`: Full address

## City Codes

**Known Codes**:
- Mumbai: `4320` ✅ (386 plot listings available!)

**To Find Other Codes**:
1. Test API with different city codes (4290-4350 range)
2. Check `editAdditionalDataBean.cityName.key` in response
3. Verify by checking `resultList[0].ctName` matches expected city

## Performance Comparison

### HTML Scraping (Previous Method)
- **Speed**: ~2-3 seconds per page
- **Reliability**: Fragile (HTML structure changes break it)
- **Data Quality**: Requires complex parsing
- **Results**: 42 plots, 588 flats from 8 cities

### API Scraping (New Method)
- **Speed**: ~1.5 seconds per page (faster!)
- **Reliability**: Very stable (API structure)
- **Data Quality**: Structured JSON, easier to parse
- **Results**: 145 plots, 327 flats from Mumbai alone in ~50 seconds

## Implementation

Created `magicbricks_api_scraper.py` that:
- ✅ Uses API endpoint directly
- ✅ Handles pagination automatically
- ✅ Separates plots and flats into different files
- ✅ Saves hierarchical data structure
- ✅ Handles geocoding for missing coordinates
- ✅ Saves all listings (even without prices)
- ✅ Deduplicates by listing ID

## Next Steps

1. **Find City Codes**: Test and document codes for:
   - Delhi
   - Bangalore
   - Hyderabad
   - Chennai
   - Pune
   - Kolkata
   - Ahmedabad

2. **Expand Coverage**: Once city codes are found, run scraper for all cities

3. **Data Quality**: Review collected data and enhance parsing for edge cases

4. **Other Portals**: Apply similar API discovery approach to:
   - 99acres
   - Housing.com
   - PropTiger

## Files Created

- `magicbricks_api_scraper.py`: Main API scraper
- `test_magicbricks_api.py`: Initial API testing
- `inspect_api_response.py`: Response structure inspection
- `extract_city_codes_from_api.py`: City code extraction attempt
- `test_api_scraper.py`: Quick scraper test

## Notes

- API is much faster and more reliable than HTML scraping
- Can get 30 listings per page consistently
- Mumbai alone has 386 plot listings (13 pages)
- Need to find city codes for other cities to expand coverage
- API respects rate limiting - using 1 second delay between requests

