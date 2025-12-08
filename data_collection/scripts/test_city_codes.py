"""Test city codes import"""
from discovered_city_codes import CITY_CODES

print(f"Total cities discovered: {len(CITY_CODES)}")
print("\nMajor cities:")
majors = ['Mumbai', 'New Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad']
for city in majors:
    code = CITY_CODES.get(city) or CITY_CODES.get('Madras' if city == 'Chennai' else None)
    if not code:
        # Try case-insensitive
        for k, v in CITY_CODES.items():
            if k.lower() == city.lower():
                code = v
                break
    print(f"  {city}: {code or 'NOT FOUND'}")

