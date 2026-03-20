import axios from "axios";

import { settingsApi } from "./api";

export type CreatedOrganizationResponse = {
  id: string;
  name: string;
  slug: string;
  members?: Array<{ role: string; userId: string }>;
};

const EMPTY_PROMPT = {
  mode: "default" as const,
  customPrompt: "",
  generatedPrompt: "",
  businessName: "",
  industry: "",
  tone: "",
  notes: "",
};

export type SettingsPayload = Awaited<ReturnType<typeof settingsApi.get>>;

/** Build settings cache from Better Auth create-org response so the UI is not stuck on stale `organizationId: null`. */
export function settingsFromCreatedOrganization(
  prev: SettingsPayload | undefined,
  created: CreatedOrganizationResponse
): SettingsPayload {
  const rawRole = created.members?.[0]?.role;
  const organizationRole =
    rawRole === "owner" || rawRole === "admin" || rawRole === "member" ? rawRole : "owner";

  return {
    vapiApiKeyDisplay: null,
    vapiPhoneNumberId: null,
    hasVapiKeys: prev?.hasVapiKeys ?? false,
    organizationId: created.id,
    organizationName: created.name,
    organizationSlug: created.slug,
    organizationRole,
    promptProfile: prev?.promptProfile ?? EMPTY_PROMPT,
  };
}

/** When accept-invitation returns a member but GET /settings lags, patch cache minimally. */
export function settingsFromAcceptMember(
  prev: SettingsPayload | undefined,
  organizationId: string,
  role: string
): SettingsPayload {
  const organizationRole =
    role === "owner" || role === "admin" || role === "member" ? role : "member";
  return {
    vapiApiKeyDisplay: prev?.vapiApiKeyDisplay ?? null,
    vapiPhoneNumberId: prev?.vapiPhoneNumberId ?? null,
    hasVapiKeys: prev?.hasVapiKeys ?? false,
    organizationId,
    organizationName: prev?.organizationName ?? null,
    organizationSlug: prev?.organizationSlug ?? null,
    organizationRole,
    promptProfile: prev?.promptProfile ?? EMPTY_PROMPT,
  };
}

export function parseOrganizationApiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { message?: string | string[]; detail?: string } | undefined;
    if (typeof d?.message === "string" && d.message.trim()) return d.message;
    if (Array.isArray(d?.message) && d.message.length) return d.message.join(" ");
    if (typeof d?.detail === "string" && d.detail.trim()) return d.detail;
  }
  return fallback;
}
