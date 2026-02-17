import asyncio
import os
import sys
import json

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.api.tour_api import TourAPI

def main():
    api = TourAPI()
    keyword = "초당순두부마을"
    print(f"Searching for: {keyword}")
    
    try:
        # Call search_places directly
        response = api.search_places(
            keyword=keyword,
            page=1,
            limit=1
        )
        
        print("\n--- Raw Response ---")
        print(json.dumps(response, indent=2, ensure_ascii=False))
        
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    main()
