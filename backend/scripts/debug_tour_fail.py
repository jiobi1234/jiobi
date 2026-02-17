import asyncio
import os
import sys
import json

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.services.tour_service import TourService

async def main():
    service = TourService()
    
    # List of failing keywords
    keywords = ["경포해변", "스카이베이 호텔", "안목해변 카페거리"]
    
    print("--- Debugging Specific Keywords ---")
    for k in keywords:
        print(f"\nSearching for: {k}")
        try:
            # We need to call the internal logic to see the raw result type
            # But search_keyword_for_logistics swallows the error.
            # So let's reproduce the logic here.
            
            result = await asyncio.to_thread(
                service.tour_api.search_places,
                keyword=k,
                page=1,
                limit=1,
                region=None,
                district=None,
                contentTypeId=None
            )
            
            print(f"Result Type: {type(result)}")
            if isinstance(result, dict):
                 print(f"Result keys: {result.keys()}")
                 if "response" in result:
                     body = result["response"]["body"]
                     items = body.get("items", {})
                     print(f"Items type: {type(items)}")
                     print(f"Items content: {items}")
                     raw_places = items.get("item", [])
                     print(f"Raw places type: {type(raw_places)}")
                     print(f"Raw places content: {raw_places}")
                 else:
                     print("MISSING 'response' key!")
                     print(json.dumps(result, indent=2, ensure_ascii=False)[:500])
            else:
                 print(f"Result CONTENT: {result}")

        except Exception as e:
            print(f"ERROR: {e}")

if __name__ == "__main__":
    asyncio.run(main())
