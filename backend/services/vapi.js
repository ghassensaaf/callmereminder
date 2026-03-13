import axios from "axios";

const VAPI_BASE_URL = "https://api.vapi.ai";

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
