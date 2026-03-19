import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

function verifyWebhook(req) {
  const secret = process.env.VAPI_WEBHOOK_SECRET?.trim();
  if (!secret) return true;
  return req.get("x-dialcues-webhook") === secret;
}

/**
 * @param {unknown} body
 * @returns {{ callId: string, details: object } | null}
 */
function parseEndOfCallReport(body) {
  const msg = body?.message;
  if (!msg || msg.type !== "end-of-call-report") return null;
  const call = msg.call || {};
  const callId = call.id;
  if (!callId) return null;
  const artifact = msg.artifact || call.artifact || {};
  const recording = artifact.recording;
  let recordingUrl = artifact.recordingUrl ?? null;
  if (!recordingUrl && recording != null) {
    recordingUrl = typeof recording === "string" ? recording : recording.url ?? null;
  }

  return {
    callId: String(callId),
    details: {
      endedReason: msg.endedReason ?? call.endedReason ?? null,
      transcript: artifact.transcript ?? call.transcript ?? null,
      messages: Array.isArray(artifact.messages) ? JSON.parse(JSON.stringify(artifact.messages)) : null,
      summary: msg.summary ?? call.summary ?? null,
      recordingUrl,
      stereoRecordingUrl: artifact.stereoRecordingUrl ?? null,
      durationSeconds: call.durationSeconds ?? call.duration ?? null,
      cost: call.cost ?? null,
      enrichedAt: new Date().toISOString(),
    },
  };
}

router.post("/server", async (req, res) => {
  if (!verifyWebhook(req)) {
    return res.status(401).json({ ok: false });
  }

  try {
    const parsed = parseEndOfCallReport(req.body);
    if (!parsed) {
      return res.status(200).json({ ok: true });
    }

    const { callId, details } = parsed;
    const result = await prisma.reminderExecution.updateMany({
      where: { call_id: callId },
      data: { call_details: details },
    });

    if (result.count === 0) {
      console.warn(`[vapi] end-of-call-report: no reminder_executions row for call_id=${callId}`);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Vapi server webhook error:", err);
    return res.status(500).json({ ok: false });
  }
});

export default router;
