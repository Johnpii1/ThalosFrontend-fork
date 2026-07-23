import { apiRequest, type ApiResponse } from "./client"

export type KybStatus = "pending" | "in_review" | "verified" | "rejected"

export interface KybBusinessDetails {
  name?: string | null
  registrationNumber?: string | null
  country?: string | null
  entityType?: string | null
}

export interface CreateKybSessionInput {
  organization_id: string
  business_name: string
  registration_number: string
  country: string
  entity_type: string
}

export interface KybVerification {
  id?: string
  organization_id: string
  status: KybStatus
  business_name?: string | null
  registration_number?: string | null
  country?: string | null
  entity_type?: string | null
  rejection_reason?: string | null
  created_at?: string
  updated_at?: string
}

interface KybVerificationEnvelope {
  verification: KybVerification
}

export interface KybSession {
  organizationId: string
  status: KybStatus
  failureReason?: string | null
  business?: KybBusinessDetails
  verification: KybVerification
}

export interface KybStatusResponse extends KybSession {
  sessionExpired?: boolean
}

function mapVerification(verification: KybVerification): KybSession {
  return {
    organizationId: verification.organization_id,
    status: verification.status,
    failureReason: verification.rejection_reason ?? null,
    business: {
      name: verification.business_name ?? null,
      registrationNumber: verification.registration_number ?? null,
      country: verification.country ?? null,
      entityType: verification.entity_type ?? null,
    },
    verification,
  }
}

function unwrapKybResponse<T extends KybSession>(
  result: ApiResponse<KybVerificationEnvelope>,
  mapper: (verification: KybVerification) => T
): ApiResponse<T> {
  if (!result.success) {
    return { success: false, error: result.error }
  }

  if (!result.data?.verification) {
    return { success: false, error: "KYB response did not include verification details" }
  }

  return { success: true, data: mapper(result.data.verification) }
}

export function startKybSession(
  input: CreateKybSessionInput,
  token?: string
): Promise<ApiResponse<KybSession>> {
  return apiRequest<KybVerificationEnvelope>(
    "/kyb/session",
    { method: "POST", body: JSON.stringify(input) },
    token
  ).then((result) => unwrapKybResponse(result, mapVerification))
}

export function getKybStatus(
  organizationId: string,
  token?: string
): Promise<ApiResponse<KybStatusResponse>> {
  return apiRequest<KybVerificationEnvelope>(
    `/kyb/status/${encodeURIComponent(organizationId)}`,
    { method: "GET" },
    token
  ).then((result) => unwrapKybResponse(result, (verification) => ({
    ...mapVerification(verification),
    sessionExpired: false,
  })))
}
