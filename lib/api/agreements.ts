import { API_URL } from "@/lib/config"

// Re-export types from actions for backwards compatibility
export type AgreementStatus = "pending" | "funded" | "active" | "completed" | "disputed" | "resolved" | "cancelled"
export type AgreementType = "single" | "multi" | "bounty"
export type ParticipantRole = "payer" | "payee" | "approver" | "dispute_resolver" | "validator"

export interface AgreementMilestone {
  description: string
  amount: string
  status: "pending" | "approved" | "released"
}

export interface Agreement {
  id: string
  contract_id: string | null
  title: string
  description: string | null
  amount: string
  asset: string
  status: AgreementStatus
  agreement_type: AgreementType
  milestones: AgreementMilestone[]
  metadata: Record<string, unknown>
  created_by: string
  created_at: string
  updated_at: string
  funded_at: string | null
  completed_at: string | null
}

export interface AgreementParticipant {
  id: string
  agreement_id: string
  wallet_address: string
  role: ParticipantRole
  joined_at: string
}

export interface AgreementActivity {
  id: string
  agreement_id: string
  actor_wallet: string
  action: string
  details: Record<string, unknown>
  created_at: string
}

export interface CreateAgreementInput {
  contract_id?: string
  title: string
  description?: string
  amount: string
  asset?: string
  agreement_type?: AgreementType
  milestones?: AgreementMilestone[]
  metadata?: Record<string, unknown>
  created_by: string
  participants: { wallet_address: string; role: ParticipantRole }[]
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<ApiResponse<T>> {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.message || data.error || "Request failed" }
    }

    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Network error" 
    }
  }
}

/**
 * Create a new agreement
 */
export async function createAgreement(
  input: CreateAgreementInput,
  token: string
): Promise<ApiResponse<Agreement>> {
  return apiRequest<Agreement>(
    "/agreements",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    token
  )
}

/**
 * Get all agreements (with optional filters)
 */
export async function getAgreements(
  params?: { wallet_address?: string; status?: string; type?: string },
  token?: string
): Promise<ApiResponse<Agreement[]>> {
  const queryParams = new URLSearchParams()
  if (params?.wallet_address) queryParams.set("wallet_address", params.wallet_address)
  if (params?.status) queryParams.set("status", params.status)
  if (params?.type) queryParams.set("type", params.type)
  
  const query = queryParams.toString()
  const endpoint = query ? `/agreements?${query}` : "/agreements"

  return apiRequest<Agreement[]>(endpoint, { method: "GET" }, token)
}

/**
 * Get agreement by ID
 */
export async function getAgreement(
  agreementId: string,
  token?: string
): Promise<ApiResponse<Agreement>> {
  return apiRequest<Agreement>(
    `/agreements/${agreementId}`,
    { method: "GET" },
    token
  )
}

/**
 * Update agreement status
 */
export async function updateAgreementStatusApi(
  agreementId: string,
  status: AgreementStatus,
  walletAddress: string,
  token: string
): Promise<ApiResponse<Agreement>> {
  return apiRequest<Agreement>(
    `/agreements/${agreementId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status, wallet_address: walletAddress }),
    },
    token
  )
}

/**
 * Update agreement milestones
 */
export async function updateAgreementMilestones(
  agreementId: string,
  milestones: AgreementMilestone[],
  walletAddress: string,
  token: string
): Promise<ApiResponse<Agreement>> {
  return apiRequest<Agreement>(
    `/agreements/${agreementId}/milestones`,
    {
      method: "PATCH",
      body: JSON.stringify({ milestones, wallet_address: walletAddress }),
    },
    token
  )
}

/**
 * Get activity log for an agreement
 */
export async function getAgreementActivityApi(
  agreementId: string,
  token?: string
): Promise<ApiResponse<AgreementActivity[]>> {
  return apiRequest<AgreementActivity[]>(
    `/agreements/${agreementId}/activity`,
    { method: "GET" },
    token
  )
}

/**
 * Log activity on an agreement
 */
export async function logAgreementActivityApi(
  agreementId: string,
  actorWallet: string,
  action: string,
  details?: Record<string, unknown>,
  token?: string
): Promise<ApiResponse<AgreementActivity>> {
  return apiRequest<AgreementActivity>(
    `/agreements/${agreementId}/activity`,
    {
      method: "POST",
      body: JSON.stringify({ actor_wallet: actorWallet, action, details: details || {} }),
    },
    token
  )
}

/**
 * Get agreement by contract ID
 */
export async function getAgreementByContractIdApi(
  contractId: string,
  token?: string
): Promise<ApiResponse<Agreement>> {
  return apiRequest<Agreement>(
    `/agreements/by-contract/${contractId}`,
    { method: "GET" },
    token
  )
}

/**
 * Link contract to agreement
 */
export async function linkContractToAgreementApi(
  agreementId: string,
  contractId: string,
  walletAddress: string,
  token: string
): Promise<ApiResponse<Agreement>> {
  return apiRequest<Agreement>(
    `/agreements/${agreementId}/contract`,
    {
      method: "PATCH",
      body: JSON.stringify({ contract_id: contractId, wallet_address: walletAddress }),
    },
    token
  )
}
