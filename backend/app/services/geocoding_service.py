# backend/app/services/geocoding_service.py
import httpx
from typing import Optional, Tuple

class GeocodingService:
    def __init__(self):
        self.base_url = "https://nominatim.openstreetmap.org/search"
        self.headers = {
            "User-Agent": "RealEstatePro/1.0 (support@realestatepro.com)"
        }
    
    async def geocode_address(self, address: str, city: str = None, region: str = None) -> Tuple[Optional[float], Optional[float]]:
        """
        Convert address to coordinates using OpenStreetMap Nominatim
        Returns (latitude, longitude) or (None, None) if not found
        """
        try:
            # Build full address string
            full_address = address
            if city:
                full_address += f", {city}"
            if region:
                full_address += f", {region}"
            full_address += ", Ethiopia"
            
            print(f"📍 Geocoding address: {full_address}")
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.base_url,
                    params={
                        "q": full_address,
                        "format": "json",
                        "limit": 1
                    },
                    headers=self.headers,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data and len(data) > 0:
                        lat = float(data[0]["lat"])
                        lon = float(data[0]["lon"])
                        print(f"✅ Found coordinates: {lat}, {lon}")
                        return lat, lon
                    else:
                        print(f"⚠️ No coordinates found for: {full_address}")
                        return None, None
                else:
                    print(f"❌ Geocoding failed: {response.status_code}")
                    return None, None
                    
        except Exception as e:
            print(f"❌ Geocoding error: {e}")
            return None, None

# Create a singleton instance
geocoding_service = GeocodingService()