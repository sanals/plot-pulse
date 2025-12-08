# Magicbricks Scraping Plan

## Current Status
✅ **226 cities discovered** with valid codes  
✅ **Rate limiting implemented** with human-like behavior  
✅ **API endpoint working** - much faster than HTML scraping  
✅ **Safety measures in place** - random delays, user-agent rotation, 429 handling

## Scraping Strategy

### Phase 1: Testing (Recommended First)
**Goal**: Verify everything works without getting blocked

```bash
# Test with just 2 cities
python magicbricks_api_scraper.py 2
```

**What to check**:
- ✅ No 429 (rate limit) errors
- ✅ Data collected successfully
- ✅ Delays working (check logs)
- ✅ User-agent rotation happening

**Expected time**: ~30-40 minutes for 2 cities

### Phase 2: Small Batch (Safe)
**Goal**: Collect data from major cities

```bash
# Scrape top 20 cities
python magicbricks_api_scraper.py 20
```

**Cities to prioritize** (first 20):
1. Mumbai
2. New Delhi
3. Bengaluru
4. Hyderabad
5. Chennai
6. Pune
7. Kolkata
8. Ahmedabad
9. Gurgaon
10. Noida
11. Thane
12. Navi Mumbai
13. Lucknow
14. Jaipur
15. Kanpur
16. Nagpur
17. Indore
18. Chandigarh
19. Bhopal
20. Visakhapatnam

**Expected time**: ~5-7 hours  
**Break**: 2-4 hours before next batch

### Phase 3: Medium Batch
**Goal**: Expand to 50-100 cities

**Expected time**: ~12-20 hours  
**Break**: 4-6 hours between batches

### Phase 4: Complete Collection
**Goal**: All 226 cities

**Expected time**: ~56-75 hours (2.3-3.1 days)  
**Recommendation**: Split into 5-10 batches over 1-2 weeks

## Rate Limiting Features

### ✅ Implemented:
1. **Random Delays**: 2-4 seconds between requests (not predictable)
2. **User-Agent Rotation**: Changes every 10-20 requests
3. **429 Handling**: Automatic exponential backoff (60s, 120s, 300s)
4. **Breaks**: 10-30s every 50 requests, 10-30s between cities
5. **Randomized Order**: Cities scraped in random order
6. **Session Management**: Maintains cookies like a browser

### 📊 Request Pattern:
- **Per page**: 3s delay (2-4s with variation)
- **Per city**: ~15-20 minutes
- **Every 50 requests**: 10-30s break
- **Between cities**: 10-30s break

## Safety Checklist

Before starting full scraping:

- [ ] Test with 2 cities first
- [ ] Verify no 429 errors in logs
- [ ] Check data quality (prices, coordinates)
- [ ] Confirm delays are working
- [ ] Monitor first batch closely
- [ ] Have VPN ready (just in case)

## Monitoring During Scraping

### Watch for:
1. **429 responses** - Stop immediately if you see these
2. **Empty responses** - Might indicate blocking
3. **Connection errors** - Could be rate limiting
4. **Slower responses** - Server might be throttling

### Commands:
```bash
# Watch logs in real-time
tail -f data_collection/logs/scraper.log

# Check for rate limits
grep -i "rate limit" data_collection/logs/scraper.log

# Count requests
grep -c "Found.*listings" data_collection/logs/scraper.log
```

## If You Get Rate Limited

### Immediate Actions:
1. **Stop scraper** (Ctrl+C)
2. **Wait 24 hours** before resuming
3. **Check logs** to see what triggered it
4. **Reduce batch size** for next run
5. **Increase delays** to 5-7 seconds

### Prevention:
- Start with smaller batches
- Run during off-peak hours (night IST)
- Take longer breaks between batches
- Monitor closely for first few batches

## Expected Data Volume

### Per City (Average):
- **Plots**: ~100-400 listings
- **Flats**: ~200-700 listings
- **Total**: ~300-1100 listings per city

### All 226 Cities:
- **Estimated**: 67,800 - 248,600 total listings
- **Plots**: ~22,600 - 90,400
- **Flats**: ~45,200 - 158,200

## Next Steps

1. **Test with 2 cities** (Mumbai, Delhi)
2. **Verify data quality** - check prices, coordinates, addresses
3. **Run small batch** (10-20 cities)
4. **Monitor closely** for first batch
5. **Scale up gradually** if no issues

## Files Created

- `magicbricks_api_scraper.py` - Main scraper (enhanced with rate limiting)
- `base_scraper.py` - Enhanced with random delays, user-agent rotation, 429 handling
- `discovered_city_codes.py` - 226 city codes
- `SCRAPING_SAFETY_GUIDE.md` - Detailed safety guide
- `rate_limit_strategy.md` - Rate limiting strategy document

## Ready to Start!

```bash
# Start with testing (2 cities)
cd data_collection/scripts
python magicbricks_api_scraper.py 2
```

Good luck! 🚀

