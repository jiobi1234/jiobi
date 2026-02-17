import google.generativeai as genai
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        print(f"DEBUG: Initializing GeminiService. Key present: {bool(settings.GEMINI_API_KEY)}")
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model = genai.GenerativeModel('gemini-2.5-flash')
        else:
            logger.warning("GEMINI_API_KEY is not set. Gemini features will be disabled.")
            self.model = None

    async def generate_text(self, prompt: str) -> str:
        """
        Generates text using the Gemini Pro model.
        
        Args:
            prompt: The input text prompt.
            
        Returns:
            The generated text response.
            
        Raises:
            Exception: If the API key is missing or an error occurs during generation.
        """
        if not self.model:
            raise Exception("Gemini API is not configured.")

        try:
            response = await self.model.generate_content_async(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini generation error: {str(e)}")
            raise Exception(f"Failed to generate content: {str(e)}")
            raise Exception(f"Failed to generate content: {str(e)}")

    async def select_places(self, region: str, duration: str, themes: list[str], companions: str) -> str:
        """
        Generates a list of recommended places based on user input.
        Returns a JSON string conforming to the PlaceSelectionResponse schema.
        """
        if not self.model:
            raise Exception("Gemini API is not configured.")

        prompt = f"""
        You are a professional travel planner.
        Please recommend 15-20 travel destinations (tourist attractions, restaurants, cafes) suitable for a trip to {region} ({duration}).
        
        Input Conditions:
        - Region: {region}
        - Duration: {duration}
        - Themes: {', '.join(themes)}
        - Companions: {companions}
        
        Requirements:
        1. Mix tourist attractions (관광지) and food/beverage places (음식점, 카페) appropriately.
        2. Provide the reason for recommendation briefly.
        3. Response PROPER JSON format only. No markdown, no additional text.
        
        Expected JSON Structure:
        {{
            "region": "{region}",
            "candidates": [
                {{
                    "name": "Place Name",
                    "type": "관광지" | "음식점" | "카페" | "숙소",
                    "reason": "Reason for recommendation"
                }}
            ]
        }}
        """

        try:
            # response = await self.model.generate_content_async(prompt, generation_config={"response_mime_type": "application/json"})
            # Note: response_mime_type might require specific model version support. 
            # Safe fallback: prompt engineering + text cleaning.
            
            response = await self.model.generate_content_async(prompt)
            text = response.text
            
            # Clean up potential markdown formatting (```json ... ```)
            if "```json" in text:
                text = text.replace("```json", "").replace("```", "")
            elif "```" in text:
                 text = text.replace("```", "")
                 
            return text.strip()
            
        except Exception as e:
            logger.error(f"Gemini place selection error: {str(e)}")
            raise Exception(f"Failed to select places: {str(e)}")

    async def optimize_route(self, region: str, duration: str, candidates: list[dict], edit_request: str = None, existing_plan: dict = None) -> str:
        """
        Module 2: Generates an optimized schedule based on selected candidates.
        Supports editing existing plans when edit_request is provided.
        """
        if not self.model:
            raise Exception("Gemini API is not configured.")

        # Convert candidates list to string for prompt
        candidates_str = "\n".join([f"- [{c['type']}] {c['name']} ({c['reason']})" for c in candidates])

        # Build prompt based on whether it's a new plan or edit request
        if edit_request and existing_plan:
            # Edit mode: include existing plan and edit request
            existing_plan_str = ""
            if existing_plan.get('days'):
                for day in existing_plan['days']:
                    existing_plan_str += f"\nDay {day.get('day', '')}:\n"
                    for item in day.get('schedule', []):
                        existing_plan_str += f"  - {item.get('time', '')} {item.get('place', '')} ({item.get('type', '')})\n"
            
            prompt = f"""
        You are a professional travel planner.
        Modify the existing travel plan for {region} ({duration}) based on the user's edit request.

        Current Plan:
        {existing_plan_str}

        User's Edit Request:
        {edit_request}

        Candidate Places (available for use):
        {candidates_str}

        Requirements:
        1. Keep the structure similar to the existing plan unless the edit request requires major changes.
        2. Apply the user's edit request while maintaining logical flow.
        3. Distribute places logically across the days (Day 1, Day 2...).
        4. Ensure meal times (Lunch ~12:00, Dinner ~18:00) are assigned to '음식점' type places.
        5. Place '숙소' at the end of each day.
        6. Provide a creative title for the trip (can be same or modified).
        7. Response PROPER JSON format only.

        Expected JSON Structure:
        {{
            "title": "Creative Trip Title",
            "days": [
                {{
                    "day": 1,
                    "schedule": [
                        {{
                            "time": "10:00",
                            "place": "Place Name",
                            "type": "Type",
                            "description": "Short description of activity"
                        }}
                    ]
                }}
            ]
        }}
        """
        else:
            # New plan mode
            prompt = f"""
        You are a professional travel planner.
        Create an optimized travel schedule for {region} ({duration}) using the provided candidate places.

        Candidate Places:
        {candidates_str}

        Requirements:
        1. Distribute places logically across the days (Day 1, Day 2...).
        2. Ensure meal times (Lunch ~12:00, Dinner ~18:00) are assigned to '음식점' type places.
        3. Place '숙소' at the end of each day.
        4. Provide a creative title for the trip.
        5. Response PROPER JSON format only.

        Expected JSON Structure:
        {{
            "title": "Creative Trip Title",
            "days": [
                {{
                    "day": 1,
                    "schedule": [
                        {{
                            "time": "10:00",
                            "place": "Place Name",
                            "type": "Type",
                            "description": "Short description of activity"
                        }}
                    ]
                }}
            ]
        }}
        """

        try:
            response = await self.model.generate_content_async(prompt)
            text = response.text
            
            if "```json" in text:
                text = text.replace("```json", "").replace("```", "")
            elif "```" in text:
                 text = text.replace("```", "")
                 
            return text.strip()
            
        except Exception as e:
            logger.error(f"Gemini route optimization error: {str(e)}")
            raise Exception(f"Failed to optimize route: {str(e)}")
