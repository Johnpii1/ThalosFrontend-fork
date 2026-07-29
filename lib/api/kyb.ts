import { API_URL } from "@/lib/config"
import { nextKybStatusAfterSessionStart, type CreateKybSessionDto } from "@/lib/kyb"

export type KybSessionResponse = {
  id?: string
  session_id?: string
  status?: string
  url?: string
  redirect_url?: string
}

export type KybVerificationResponse = {
  id?: string
  organization_id?: string
  organizationId?: string
  status?: string
  session_id?: string
  sessionId?: string
  [key: string]: unknown
}

type KybStatusApiResponse = {
  verification?: KybVerificationResponse
}

export async function startKybSession(
  dto: CreateKybSessionDto,
  token?: string | null
): Promise<KybSessionResponse> {
  const response = await fetch(`${API_URL}/kyb/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(dto),
  })

  if (!response.ok) {
    const message = await response.text().catch(() => "")
    throw new Error(message || `Failed to start KYB session (${response.status})`)
  }

  return response.json().catch(() => ({ status: nextKybStatusAfterSessionStart() }))
}

export async function getKybStatus(
  organizationId: string,
  token?: string | null
): Promise<KybVerificationResponse | null> {
  if (!organizationId.trim()) throw new Error("Organization ID is required")

  const response = await fetch(`${API_URL}/kyb/status/${encodeURIComponent(organizationId)}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    const message = await response.text().catch(() => "")
    throw new Error(message || `Failed to get KYB status (${response.status})`)
  }

  const data = (await response.json().catch(() => ({}))) as KybStatusApiResponse
  return data.verification ?? null
}
