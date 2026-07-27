import { API_URL } from "@/lib/config"
import { buildCreateKybSessionDto, nextKybStatusAfterSessionStart, type CreateKybSessionDto, type KybProfileFields } from "@/lib/kyb"

export type KybSessionResponse = {
  id?: string
  session_id?: string
  status?: string
  url?: string
  redirect_url?: string
}

export async function startKybSession(
  walletAddress: string,
  fields: Partial<KybProfileFields>,
  token?: string | null
): Promise<KybSessionResponse> {
  const dto: CreateKybSessionDto = buildCreateKybSessionDto(walletAddress, fields)
  const response = await fetch(`${API_URL}/kyb/sessions`, {
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
