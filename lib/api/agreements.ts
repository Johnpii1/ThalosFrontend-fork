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
  params?: { status?: string; type?: string },
  token?: string
): Promise<ApiResponse<Agreement[]>> {
  const queryParams = new URLSearchParams()
  if (params?.status) queryParams.set("status", params.status)
  if (params?.type) queryParams.set("type", params.type)
  
  const query = queryParams.toString()
  const endpoint = query ? `/agreements?${query}` : "/agreements"

  return apiRequest<Agreement[]>(endpoint, { method: "GET" }, token)
}

/**
 * Get agreements by wallet address
 */
export async function getAgreementsByWallet(
  walletAddress: string,
  token?: string
): Promise<ApiResponse<Agreement[]>> {
  return apiRequest<Agreement[]>(
    `/agreements/by-wallet?wallet=${encodeURIComponent(walletAddress)}`,
    { method: "GET" },
    token
  )
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
  actorWallet: string,
  token: string
): Promise<ApiResponse<Agreement>> {
  return apiRequest<Agreement>(
    `/agreements/${agreementId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status, actor_wallet: actorWallet }),
    },
    token
  )
}

/**
 * Update agreement milestone status
 * @param agreementId Agreement ID
 * @param milestoneIndex Index of milestone to update
 * @param status New status
 * @param actorWallet Wallet of the actor making the change
 * @param evidence Optional evidence for the milestone
 * @param token JWT token
 */
export async function updateMilestoneStatus(
  agreementId: string,
  milestoneIndex: number,
  status: AgreementMilestone["status"],
  actorWallet: string,
  evidence?: string,
  token?: string
): Promise<ApiResponse<Agreement>> {
  const body: Record<string, unknown> = {
    milestone_index: milestoneIndex,
    status,
    actor_wallet: actorWallet,
  }
  
  if (evidence) {
    body.evidence = evidence
  }

  return apiRequest<Agreement>(
    `/agreements/${agreementId}/milestones`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
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
  actorWallet: string,
  token: string
): Promise<ApiResponse<Agreement>> {
  return apiRequest<Agreement>(
    `/agreements/${agreementId}/link-contract`,
    {
      method: "PATCH",
      body: JSON.stringify({ contract_id: contractId, actor_wallet: actorWallet }),
    },
    token
  )
}
