"""
Geocoding utilities to convert addresses to coordinates.
Uses Nominatim (free) as primary, with caching to avoid duplicate API calls.
"""

import requests
import time
import logging
import json
from pathlib import Path
from typing import Optional, Dict, Tuple
from urllib.parse import quote

logger = logging.getLogger(__name__)

# Cache file for geocoding results
CACHE_FILE = Path("data_collection/cache/geocoding_cache.json")


class Geocoder:
    """Geocoding service using Nominatim (free, no API key needed)"""
    
    def __init__(self, cache_file: Path = CACHE_FILE):
        self.cache_file = cache_file
        self.cache_file.parent.mkdir(parents=True, exist_ok=True)
        self.cache = self._load_cache()
        self.base_url = "https://nominatim.openstreetmap.org/search"
        self.delay_seconds = 1.0  # Nominatim requires 1 second between requests
    
    def _load_cache(self) -> Dict[str, Dict]:
        """Load geocoding cache from file"""
        if self.cache_file.exists():
            try:
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Error loading geocoding cache: {e}")
        return {}
    
    def _save_cache(self):
        """Save geocoding cache to file"""
        try:
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(self.cache, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Error saving geocoding cache: {e}")
    
    def geocode(self, address: str, city: str = None, state: str = None) -> Optional[Dict[str, float]]:
        """
        Geocode an address to get latitude and longitude
        
        Args:
            address: Address string
            city: City name (optional, helps with accuracy)
            state: State name (optional, helps with accuracy)
            
        Returns:
            Dictionary with 'latitude' and 'longitude' or None
        """
        if not address:
            return None
        
        # Build full address
        full_address = address
        if city:
            full_address += f", {city}"
        if state:
            full_address += f", {state}"
        full_address += ", India"
        
        # Check cache first
        cache_key = full_address.lower().strip()
        if cache_key in self.cache:
            logger.debug(f"Using cached geocoding for: {full_address}")
            return self.cache[cache_key]
        
        # Geocode using Nominatim
        try:
            params = {
                'q': full_address,
                'format': 'json',
                'limit': 1,
                'countrycodes': 'in',  # Limit to India
            }
            
            headers = {
                'User-Agent': 'PlotPulse Data Collector (contact@plotpulse.app)'
            }
            
            response = requests.get(self.base_url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            if data and len(data) > 0:
                result = data[0]
                coords = {
                    'latitude': float(result['lat']),
                    'longitude': float(result['lon'])
                }
                
                # Cache the result
                self.cache[cache_key] = coords
                self._save_cache()
                
                logger.debug(f"Geocoded: {full_address} -> {coords['latitude']}, {coords['longitude']}")
                return coords
            
            logger.debug(f"No geocoding result for: {full_address}")
            
        except Exception as e:
            logger.warning(f"Geocoding error for '{full_address}': {e}")
        
        # Rate limiting
        time.sleep(self.delay_seconds)
        
        return None
    
    def geocode_batch(self, addresses: list, city: str = None, state: str = None) -> Dict[str, Dict]:
        """
        Geocode multiple addresses (with rate limiting)
        
        Args:
            addresses: List of address strings
            city: City name (optional)
            state: State name (optional)
            
        Returns:
            Dictionary mapping addresses to coordinate dictionaries
        """
        results = {}
        for address in addresses:
            if address:
                coords = self.geocode(address, city, state)
                if coords:
                    results[address] = coords
        return results


# Global geocoder instance
_geocoder = None

def get_geocoder() -> Geocoder:
    """Get or create global geocoder instance"""
    global _geocoder
    if _geocoder is None:
        _geocoder = Geocoder()
    return _geocoder

