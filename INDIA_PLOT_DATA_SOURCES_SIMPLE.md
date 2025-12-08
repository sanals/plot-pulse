# India Plot Price Data Sources (Simple List)
**Date:** Dec 6, 2025

This is a concise list of non-government options to source plot/land prices (primarily asking prices, not closed deals).

## Public Listing Portals (asking prices)
- Magicbricks
- 99acres
- Housing.com / PropTiger
- NoBroker
- OLX (property)
- CommonFloor

## Approach: Scrape Actual Listings (Not Reports)

**Status:** Market report PDFs are not easily accessible (404s, paywalls, outdated). 

**Better Approach:** Scrape actual plot/land listings from portals to get real asking prices.

### Implementation Plan
1. **Magicbricks** — Scrape plot listings by city (price, area, location)
2. **99acres** — Scrape plot listings by city  
3. **Housing.com** — Scrape plot listings by city
4. **NoBroker** — If accessible, scrape plot listings

**Note:** Each portal has different HTML structure. Start with one (Magicbricks), then adapt for others.

## Paid / Enterprise Data (structured, usually licensed)
- Liases Foras
- PropEquity
- CRE Matrix
- Other AVM/data providers (ATTOM/Estated are US-focused; PriceHubble EU; may have India coverage via partners)

## Community / Open Datasets
- Kaggle / academic datasets (check freshness and license)
- Occasionally on community portals under housing/real-estate

## Notes
- Portals = asking prices, freshest; scraping must respect ToS.
- Reports = good for trends, not row-level data.
- Paid = most structured/credible, but require contracts.

