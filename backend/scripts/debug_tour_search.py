import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.services.tour_service import TourService
from app.api.tour_api import TourAPI

async def main():
    service = TourService()
    
    keywords = ["초당순두부마을", "강릉 중앙시장", "안목해변"]
    
    print("--- Debugging TourService.search_keyword_for_logistics ---")
    for k in keywords:
        print(f"\nSearching for: {k}")
        try:
            result = await service.search_keyword_for_logistics(k)
            if result:
                print(f"SUCCESS: Found {result['title']} (ID: {result.get('contentid')})")
                print(f"       Coords: {result.get('mapx')}, {result.get('mapy')}")
            else:
                print("FAILURE: returned None")
                
                # Dig deeper: Call API directly to see response
                print("  [Deep Dive] Calling TourAPI directly...")
                api = TourAPI()
                raw_response = api.search_places(k, 1, 1, None, None, None)
                print(f"  Raw response keys: {raw_response.keys()}")
                if 'response' in raw_response:
                     body = raw_response['response'].get('body', {})
                     items = body.get('items', {})
                     print(f"  Body totalCount: {body.get('totalCount')}")
                     print(f"  Items: {items}")

        except Exception as e:
            print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(main())
