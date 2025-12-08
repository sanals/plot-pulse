# Scraping Safety Guide - Magicbricks API

## Overview
This guide explains the rate limiting and safety measures implemented to avoid IP blocking while scraping Magicbricks.

## Current Implementation

### 1. **Random Delays (Human-like Behavior)**
- **Base Delay**: 3 seconds between requests
- **Random Variation**: ±1 second (actual delay: 2-4 seconds)
- **Purpose**: Avoids predictable bot patterns

### 2. **User-Agent Rotation**
- **Pool**: 6 different realistic browser user agents
- **Rotation**: Every 10-20 requests (randomized)
- **Includes**: Chrome, Firefox, Safari on different OS

### 3. **Rate Limit Handling**
- **429 Detection**: Automatically detects rate limit responses
- **Exponential Backoff**: 
  - 1st hit: Wait 60 seconds
  - 2nd hit: Wait 120 seconds  
  - 3rd hit: Wait 300 seconds
- **Auto-Stop**: Stops scraping if rate limited 3+ times
- **Retry-After**: Respects server's `Retry-After` header if present

### 4. **Request Patterns**
- **Breaks Every 50 Requests**: 10-30 second pause
- **Breaks Between Cities**: 10-30 second pause
- **Randomized City Order**: Avoids predictable patterns
- **Session Cookies**: Maintains cookies to mimic browser session

### 5. **Monitoring**
- **Request Tracking**: Counts total requests
- **Rate Limit Tracking**: Counts 429 responses
- **Time Tracking**: Monitors scraping duration
- **Logging**: Detailed logs of all rate limit events

## Estimated Scraping Time

### Per City
- **Plots**: ~13 pages × 30 listings = ~390 listings
- **Flats**: ~23 pages × 30 listings = ~690 listings
- **Time per city**: ~15-20 minutes (with delays)

### All 226 Cities
- **Total time**: ~56-75 hours (2.3-3.1 days)
- **Recommendation**: Run in batches of 10-20 cities per session

## Best Practices

### ✅ DO:
1. **Run in batches**: Scrape 10-20 cities, then pause for 1-2 hours
2. **Monitor logs**: Watch for rate limit warnings
3. **Respect breaks**: Don't disable the break mechanisms
4. **Run during off-peak**: Consider running during night hours (IST)
5. **Use VPN if needed**: If rate limited, wait 24 hours or use VPN

### ❌ DON'T:
1. **Don't reduce delays**: Keep minimum 2 seconds between requests
2. **Don't disable breaks**: They're essential for avoiding detection
3. **Don't scrape all cities at once**: Break into multiple sessions
4. **Don't ignore 429 errors**: Stop immediately if rate limited
5. **Don't use multiple instances**: One scraper at a time

## Configuration

### Adjustable Parameters (in `magicbricks_api_scraper.py`):

```python
delay_seconds=3.0  # Base delay (2-4s with variation)
```

### Adjustable Parameters (in `base_scraper.py`):

```python
# In _random_delay():
variation=1.0  # Random variation range

# In make_request():
# Every 50 requests: 10-30s break
# Between cities: 10-30s break (in scraper)
```

## Monitoring Rate Limits

### Check Logs:
```bash
tail -f data_collection/logs/scraper.log | grep -i "rate limit"
```

### Signs of Rate Limiting:
- Multiple 429 responses
- "Rate limit hit!" messages
- Increasing wait times
- Empty responses

### If Rate Limited:
1. **Stop scraper immediately**
2. **Wait 24 hours** before resuming
3. **Consider using VPN** for next session
4. **Reduce batch size** (fewer cities per run)

## Recommended Scraping Schedule

### Option 1: Conservative (Safest)
- **Batch size**: 10 cities
- **Time per batch**: ~2-3 hours
- **Break between batches**: 2-4 hours
- **Total time**: ~1-2 weeks

### Option 2: Moderate (Balanced)
- **Batch size**: 20 cities
- **Time per batch**: ~5-7 hours
- **Break between batches**: 4-6 hours
- **Total time**: ~3-5 days

### Option 3: Aggressive (Risky)
- **Batch size**: 50 cities
- **Time per batch**: ~12-15 hours
- **Break between batches**: 8-12 hours
- **Total time**: ~2-3 days
- **⚠️ Higher risk of rate limiting**

## Emergency Procedures

### If IP Gets Blocked:
1. **Stop scraper immediately**
2. **Wait 24-48 hours**
3. **Use VPN or different network**
4. **Reduce batch size significantly**
5. **Increase delays to 5-7 seconds**

### If Scraper Stops Unexpectedly:
1. **Check logs** for rate limit messages
2. **Verify network connection**
3. **Check if Magicbricks is accessible**
4. **Resume from last successful city**

## Testing Before Full Run

### Test with 1-2 Cities First:
```bash
# Modify scraper to only test Mumbai and Delhi
python magicbricks_api_scraper.py
```

### Verify:
- ✅ No 429 errors
- ✅ Data collected successfully
- ✅ Delays working correctly
- ✅ Logs show proper rate limiting

## Summary

The scraper is now configured with:
- ✅ Random delays (2-4 seconds)
- ✅ User-agent rotation
- ✅ 429 response handling
- ✅ Automatic breaks
- ✅ Request tracking
- ✅ Safe defaults

**Start with small batches (10 cities) and monitor closely!**

