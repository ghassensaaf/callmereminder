import httpx
from typing import Optional, Tuple
from config import get_settings
import logging

logger = logging.getLogger(__name__)

VAPI_BASE_URL = "https://api.vapi.ai"


class VapiService:
    def __init__(self):
        settings = get_settings()
        self.api_key = settings.vapi_api_key
        self.phone_number_id = settings.vapi_phone_number_id
        
    async def make_call(
        self,
        to_phone_number: str,
        message: str,
        reminder_title: str
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Make an outbound call using Vapi to speak the reminder message.
        
        Returns:
            Tuple of (success, call_id, error_message)
        """
        if not self.api_key or not self.phone_number_id:
            logger.error("Vapi API key or phone number ID not configured")
            return False, None, "Vapi not configured"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        # Create an outbound call with a simple assistant that speaks the message
        # and ends immediately after delivering it
        payload = {
            "phoneNumberId": self.phone_number_id,
            "customer": {
                "number": to_phone_number
            },
            "assistant": {
                "name": "Reminder Assistant",
                "model": {
                    "provider": "openai",
                    "model": "gpt-4o-mini",
                    "messages": [
                        {
                            "role": "system",
                            "content": f"""You are a reminder delivery assistant. Your ONLY task is to deliver a reminder message and immediately end the call.

IMPORTANT INSTRUCTIONS:
1. Deliver the reminder message exactly as provided below
2. Do NOT ask questions or wait for responses
3. Do NOT engage in any conversation
4. End the call IMMEDIATELY after delivering the message by calling the endCall function

Deliver this message:
"Hello! This is CallMe Reminder. Your reminder: {reminder_title}. {message}. Goodbye!"

After saying this, immediately end the call using the endCall function."""
                        }
                    ]
                },
                "voice": {
                    "provider": "11labs",
                    "voiceId": "21m00Tcm4TlvDq8ikWAM"  # Rachel voice
                },
                "firstMessage": f"Hello! This is CallMe Reminder. Your reminder: {message}. Goodbye!",
                "endCallFunctionEnabled": True,
                "maxDurationSeconds": 30,
                "silenceTimeoutSeconds": 3,
                "responseDelaySeconds": 0,
                "numWordsToInterruptAssistant": 0,
                "backgroundSound": "off"
            }
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{VAPI_BASE_URL}/call/phone",
                    headers=headers,
                    json=payload,
                    timeout=30.0
                )
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    call_id = data.get("id")
                    logger.info(f"Call initiated successfully. Call ID: {call_id}")
                    return True, call_id, None
                else:
                    error_msg = f"Vapi API error: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    return False, None, error_msg
                    
        except httpx.TimeoutException:
            error_msg = "Vapi API timeout"
            logger.error(error_msg)
            return False, None, error_msg
        except Exception as e:
            error_msg = f"Vapi API exception: {str(e)}"
            logger.error(error_msg)
            return False, None, error_msg


# Singleton instance
vapi_service = VapiService()
