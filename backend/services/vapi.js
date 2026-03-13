import axios from "axios";

const VAPI_BASE_URL = "https://api.vapi.ai";

/**
 * Validate Vapi API key and phone number ID by fetching the phone number.
 * Returns { valid: true } or { valid: false, error: string }.
 */
export async function validateVapiConfig(apiKey, phoneNumberId) {
  if (!apiKey?.trim() || !phoneNumberId?.trim()) {
    return { valid: false, error: "API key and phone number ID are required" };
  }
  try {
    const response = await axios.get(
      `${VAPI_BASE_URL}/phone-number/${phoneNumberId.trim()}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        timeout: 10000,
      }
    );
    if (response.status === 200 && response.data) {
      return { valid: true };
    }
    return { valid: false, error: "Invalid response from Vapi" };
  } catch (err) {
    const status = err.response?.status;
    const msg = err.response?.data?.message || err.message;
    if (status === 401) return { valid: false, error: "Invalid API key" };
    if (status === 404) return { valid: false, error: "Phone number ID not found" };
    return { valid: false, error: msg || "Validation failed" };
  }
}

export async function makeCall(toPhoneNumber, message, reminderTitle, apiKey, phoneNumberId) {
  if (!apiKey || !phoneNumberId) {
    console.error("Vapi API key or phone number ID not configured for user");
    return { success: false, callId: null, errorMessage: "Vapi not configured. Add your keys in Settings." };
  }

  const payload = {
    phoneNumberId,
    customer: { number: toPhoneNumber },
    assistant: {
      name: "Reminder Assistant",
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a reminder delivery assistant. Your ONLY task is to deliver a reminder message and immediately end the call.

IMPORTANT INSTRUCTIONS:
1. Deliver the reminder message exactly as provided below
2. Do NOT ask questions or wait for responses
3. Do NOT engage in any conversation
4. End the call IMMEDIATELY after delivering the message by calling the endCall function

Deliver this message:
"Hello! This is CallMe Reminder. Your reminder: ${reminderTitle}. ${message}. Goodbye!"

After saying this, immediately end the call using the endCall function.`,
          },
        ],
      },
      voice: {
        provider: "11labs",
        voiceId: "21m00Tcm4TlvDq8ikWAM",
      },
      firstMessage: `Hello! This is CallMe Reminder. Your reminder: ${message}. Goodbye!`,
      endCallFunctionEnabled: true,
      maxDurationSeconds: 60,
      silenceTimeoutSeconds: 10,
      backgroundSound: "off",
    },
  };

  try {
    const response = await axios.post(`${VAPI_BASE_URL}/call/phone`, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    if (response.status === 200 || response.status === 201) {
      const callId = response.data?.id;
      console.log("Call initiated successfully. Call ID:", callId);
      return { success: true, callId, errorMessage: null };
    } else {
      const errorMsg = `Vapi API error: ${response.status} - ${JSON.stringify(response.data)}`;
      console.error(errorMsg);
      return { success: false, callId: null, errorMessage: errorMsg };
    }
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || "Vapi API exception";
    console.error("Vapi error:", errorMsg);
    return { success: false, callId: null, errorMessage: errorMsg };
  }
}
