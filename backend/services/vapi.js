import axios from "axios";

const VAPI_BASE_URL = "https://api.vapi.ai";

function resolveBusinessPrompt(profile) {
  const mode = profile?.mode;
  if (mode === "custom" && profile?.customPrompt?.trim()) return profile.customPrompt.trim();
  if (mode === "generated" && profile?.generatedPrompt?.trim()) return profile.generatedPrompt.trim();
  return null;
}

/** Server URL for Vapi webhooks (end-of-call-report). Requires API_PUBLIC_URL. */
function assistantServerConfig() {
  const apiBaseUrl = process.env.API_PUBLIC_URL?.replace(/\/$/, "");
  if (!apiBaseUrl) return {};
  const headers = {};
  const secret = process.env.VAPI_WEBHOOK_SECRET?.trim();
  if (secret) headers["X-Dialcues-Webhook"] = secret;
  return {
    server: {
      url: `${apiBaseUrl}/api/vapi/server`,
      ...(Object.keys(headers).length ? { headers } : {}),
    },
  };
}

/**
 * Load call artifact from Vapi (GET /call/:id) for manual sync / fallback.
 * @returns {Promise<object|null>}
 */
export async function fetchCallLog(apiKey, callId) {
  if (!apiKey?.trim() || !callId?.trim()) return null;
  try {
    const response = await axios.get(`${VAPI_BASE_URL}/call/${encodeURIComponent(callId.trim())}`, {
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      timeout: 20000,
    });
    const call = response.data || {};
    const artifact = call.artifact || {};
    const recording = artifact.recording;
    let recordingUrl = artifact.recordingUrl ?? null;
    if (!recordingUrl && recording != null) {
      recordingUrl = typeof recording === "string" ? recording : recording.url ?? null;
    }

    return {
      endedReason: call.endedReason ?? null,
      transcript: artifact.transcript ?? call.transcript ?? null,
      messages: Array.isArray(artifact.messages) ? JSON.parse(JSON.stringify(artifact.messages)) : null,
      summary: call.summary ?? null,
      recordingUrl,
      stereoRecordingUrl: artifact.stereoRecordingUrl ?? null,
      durationSeconds: call.durationSeconds ?? call.duration ?? null,
      cost: call.cost ?? null,
      enrichedAt: new Date().toISOString(),
    };
  } catch (err) {
    const status = err.response?.status;
    const msg = err.response?.data?.message || err.message;
    console.error("fetchCallLog error:", status, msg);
    return null;
  }
}

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

export async function makeCall(toPhoneNumber, message, reminderTitle, apiKey, phoneNumberId, options = {}) {
  if (!apiKey || !phoneNumberId) {
    console.error("Vapi API key or phone number ID not configured for user");
    return { success: false, callId: null, errorMessage: "Vapi not configured. Add your keys in Settings." };
  }

  const { reminderId, voiceActionToken, companyPromptProfile } = options;
  const apiBaseUrl = process.env.API_PUBLIC_URL?.replace(/\/$/, "");
  const useVoiceActions = !!(apiBaseUrl && voiceActionToken);
  const businessPrompt = resolveBusinessPrompt(companyPromptProfile);

  const firstMessage = `Hello! This is Dialcues. Your reminder: ${reminderTitle}. ${message}. if you want to snooze this for 10 minutes, an hour, or tomorrow, say snooze for 10 minutes, an hour, or tomorrow. If you want to dismiss, say dismiss. If you want to repeat, say repeat. If you want to end, say end.`;

  let assistant;
  if (useVoiceActions) {
    assistant = {
      name: "Reminder Assistant",
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `${businessPrompt ? `${businessPrompt}\n\n` : ""}You are a friendly reminder delivery assistant for Dialcues. Deliver the reminder, then ask if the user wants to do anything.

REMINDER TO DELIVER:
"Hello! This is Dialcues. Your reminder: ${reminderTitle}. ${message}. if you want to snooze this for 10 minutes, an hour, or tomorrow, say snooze for 10 minutes, an hour, or tomorrow. If you want to dismiss, say dismiss. If you want to repeat, say repeat. If you want to end, say end."

After delivering the reminder, say: "Would you like me to snooze this for 10 minutes, an hour, or tomorrow? Or say dismiss if you're done."

VOICE ACTIONS:
- When the user says to snooze (e.g. "snooze for 10 minutes", "snooze for an hour", "remind me tomorrow"), call the voiceAction function with action "snooze" and duration: "10min", "1hour", or "tomorrow". Use the token: ${voiceActionToken}
- When the user says dismiss/done (e.g. "dismiss", "I'm done", "I got it"), call voiceAction with action "dismiss". Use the token: ${voiceActionToken}
- When the user says repeat, say the reminder again: "${reminderTitle}. ${message}"
- When the user says nothing or wants to end, call endCall

Always use the exact token above when calling voiceAction.`,
          },
        ],
        tools: [
          { type: "endCall" },
          {
            type: "apiRequest",
            function: { name: "voice_action" },
            name: "voiceAction",
            url: `${apiBaseUrl}/api/reminders/voice-action`,
            method: "POST",
            body: {
              type: "object",
              properties: {
                token: {
                  type: "string",
                  description: `The voice action token. Use: ${voiceActionToken}`,
                },
                action: {
                  type: "string",
                  description: "Action to perform: snooze or dismiss",
                  enum: ["snooze", "dismiss"],
                },
                duration: {
                  type: "string",
                  description: "For snooze: 10min, 1hour, or tomorrow",
                },
              },
              required: ["token", "action"],
            },
          },
        ],
      },
      voice: {
        provider: "11labs",
        voiceId: "21m00Tcm4TlvDq8ikWAM",
      },
      firstMessage,
      endCallFunctionEnabled: true,
      maxDurationSeconds: 120,
      silenceTimeoutSeconds: 15,
      backgroundSound: "off",
      ...assistantServerConfig(),
    };
  } else {
    assistant = {
      name: "Reminder Assistant",
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `${businessPrompt ? `${businessPrompt}\n\n` : ""}You are a reminder delivery assistant. Your ONLY task is to deliver a reminder message and immediately end the call.

IMPORTANT INSTRUCTIONS:
1. Deliver the reminder message exactly as provided below
2. Do NOT ask questions or wait for responses
3. Do NOT engage in any conversation
4. End the call IMMEDIATELY after delivering the message by calling the endCall function

Deliver this message:
"Hello! This is Dialcues. Your reminder: ${reminderTitle}. ${message}. if you want to snooze this for 10 minutes, an hour, or tomorrow, say snooze for 10 minutes, an hour, or tomorrow. If you want to dismiss, say dismiss. If you want to repeat, say repeat. If you want to end, say end."

After saying this, immediately end the call using the endCall function.`,
          },
        ],
      },
      voice: {
        provider: "11labs",
        voiceId: "21m00Tcm4TlvDq8ikWAM",
      },
      firstMessage,
      endCallFunctionEnabled: true,
      maxDurationSeconds: 60,
      silenceTimeoutSeconds: 10,
      backgroundSound: "off",
      ...assistantServerConfig(),
    };
  }

  const payload = {
    phoneNumberId,
    customer: { number: toPhoneNumber },
    assistant,
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
