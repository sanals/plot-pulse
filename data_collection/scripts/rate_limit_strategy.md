# Rate Limiting Strategy for Magicbricks Scraper

## Current Issues
- Fixed 1 second delay (too predictable)
- No random variation (looks like a bot)
- No handling of 429 responses
- No user-agent rotation
- No session cookies to mimic browser

## Recommended Strategy

### 1. Random Delays (Human-like)
- Base delay: 2-4 seconds between requests
- Random variation: ±0.5-1.5 seconds
- Longer breaks: 10-30 seconds between cities
- Occasional longer pauses: 60-120 seconds every 50 requests

### 2. User-Agent Rotation
- Rotate between different browser user agents
- Include realistic browser versions
- Match user-agent with Accept headers

### 3. Rate Limit Handling
- Detect 429 (Too Many Requests) responses
- Exponential backoff: 60s, 120s, 300s
- Check Retry-After header if present
- Stop scraping if rate limited 3+ times

### 4. Session Management
- Maintain cookies between requests
- Add Referer headers (chain requests)
- Include Accept-Language headers
- Mimic browser behavior

### 5. Request Patterns
- Don't scrape all cities in one go
- Add breaks: scrape 5-10 cities, pause 5-10 minutes
- Vary request timing (not every second on the dot)
- Randomize city order

### 6. Monitoring
- Track request count per hour
- Monitor for 429 responses
- Log suspicious patterns
- Alert if rate limit hit

## Implementation Plan

1. Enhance `base_scraper.py` with:
   - Random delay function
   - User-agent rotation
   - 429 response handling
   - Session cookie management

2. Update `magicbricks_api_scraper.py`:
   - Increase base delay to 2-4 seconds
   - Add random variation
   - Add breaks between cities
   - Monitor rate limit headers

3. Add configuration:
   - Max requests per hour
   - Delay ranges
   - Break intervals
   - Retry strategies

