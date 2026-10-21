import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "../../infrastructure/apiClient"

// ==========================================
// Types: REQ-001 Oportunidades (#23)
// ==========================================
export interface OpportunityItem {
  process_id: number
  process_code: string
  title: string
  institution_id: number
  institution_name: string
  modality: string
  unspsc_family: string
  unspsc_label: string
  reference_amount_dop: number
  published_date: string
  affinity_score: number
  competition_level: "ALTA" | "MEDIA" | "BAJA" | string
  historical_competitors_count: number
  in_watchlist: boolean
  watchlist_stage?: string | null
}

export interface OpportunitiesResponse {
  kpis: {
    total_opportunities: number
    sector_total_amount_dop: number
    avg_affinity_score: number
    monitored_families_count: number
    max_families_allowed: number
  }
  monitored_families: Array<{ code: string; label: string }>
  items: OpportunityItem[]
  total: number
  page: number
  limit: number
}

// ==========================================
// Types: REQ-002 Mis Licitaciones (#24)
// ==========================================
export type BidStage = "GUARDADA" | "EN_PREPARACION" | "OFERTA_ENVIADA" | "ADJUDICADA" | "NO_ADJUDICADA"

export interface BidItem {
  bid_id: string
  process_id: number
  process_code: string
  title: string
  institution_name: string
  unspsc_family: string
  stage: BidStage | string
  priority: "ALTA" | "MEDIA" | "BAJA" | string
  reference_amount_dop: number
  bid_amount_dop: number
  notes: string
  updated_at: string
}

export interface BidsResponse {
  plan_tier: string
  active_limit: number
  kpis: {
    total_tracked: number
    pipeline_amount_dop: number
    submitted_count: number
    awarded_count: number
    win_rate_pct: number
  }
  stages: BidStage[]
  items: BidItem[]
}

export interface BidUpsertPayload {
  process_id: number
  process_code?: string
  title?: string
  institution_name?: string
  unspsc_family?: string
  stage?: BidStage | string
  priority?: string
  reference_amount_dop?: number
  bid_amount_dop?: number
  notes?: string
}

// ==========================================
// Types: REQ-003 Competidor (#25)
// ==========================================
export interface CompetitorListItem {
  rpe: string
  name: string
  contracts_count: number
  total_amount_dop: number
}

export interface SharedUnspscPricing {
  unspsc_family: string
  unspsc_label: string
  competitor_median_unit_price_dop: number
  market_median_unit_price_dop: number
  price_delta_pct: number
  contracts_in_family: number
}

export interface CompetitorRiskFlag {
  anomaly_id: string
  process_id: number
  process_code: string
  anomaly_type: string
  severity: number
  status: string
  description: string
}

export interface CompetitorProfileResponse {
  supplier: {
    rnc: string
    rpe: string
    name: string
    status: string
    is_mipyme: boolean
    province: string
  }
  kpis: {
    contracts_won: number
    total_adjudicated_dop: number
    avg_contract_dop: number
    institutions_count: number
    anomalies_count: number
  }
  top_institutions: Array<{
    institution_id: number
    institution_name: string
    contracts_count: number
    total_amount_dop: number
  }>
  recent_contracts: Array<{
    process_id: number
    process_code: string
    contract_id: string
    title: string
    institution_name: string
    amount_dop: number
    signed_date: string
  }>
  forensic_intelligence: {
    locked: boolean
    required_plan_label?: string | null
    shared_unspsc_pricing: SharedUnspscPricing[]
    risk_flags: CompetitorRiskFlag[]
  }
}

// ==========================================
// Types: REQ-004 Simulador de Precios (#26)
// ==========================================
export interface SimulatorCatalogItem {
  unspsc_family: string
  label: string
  samples_count: number
  unit_label: string
}

export interface PriceSimulationPayload {
  unspsc_family: string
  proposed_unit_price_dop: number
  quantity: number
  institution_id?: number | null
}

export interface PriceSimulationResponse {
  unspsc_family: string
  unspsc_label: string
  unit_label: string
  sample_size: number
  proposed_unit_price_dop: number
  quantity: number
  projected_total_dop: number
  distribution: {
    min_dop: number
    p25_dop: number
    median_p50_dop: number
    p75_dop: number
    max_dop: number
    avg_dop: number
  }
  competitiveness_index: number
  win_probability_pct: number
  deviation_vs_median_pct: number
  risk_band: "BAJA_TEMERARIA" | "OPTIMA_COMPETITIVA" | "ZONA_MEDIA_MERCADO" | "RIESGO_SOBREPRECIO" | string
  risk_band_label: string
  legal_advisory: string
  institution_breakdown_locked: boolean
  reference_contracts: Array<{
    process_id: number
    process_code: string
    institution_name: string
    supplier_name: string
    unit_price_dop: number
    total_amount_dop: number
    signed_date: string
  }>
}

// ==========================================
// Types: REQ-005 Sectores UNSPSC (#27)
// ==========================================
export interface SectorItem {
  unspsc_family: string
  label: string
  is_monitored: boolean
  total_contracts: number
  total_amount_dop: number
  suppliers_count: number
  median_unit_price_dop: number
  top_institution_name: string
  competition_density: "ALTA" | "MEDIA" | "BAJA" | string
}

export interface SectorsResponse {
  plan_tier: string
  max_families_allowed: number
  monitored_families: string[]
  sectors: SectorItem[]
}

// ==========================================
// Types: REQ-006 Suscripción y Facturación (#29)
// ==========================================
export interface SubscriptionPlanItem {
  plan_tier: string
  name: string
  price_monthly_dop: number
  max_families: number
  max_active_bids: number
  forensic_competitor_access: boolean
}

export interface SubscriptionHistoryItem {
  event_id: number
  action: string
  actor: string
  timestamp: string
}

export interface SubscriptionResponse {
  tenant: {
    id: number
    codigo: string
    nombre: string
    tipo: string
    plan_tier: string
    plan_label: string
    supplier_rpe: string
    status: string
    billing_cycle: string
    next_renewal_date: string
  }
  usage: {
    monitored_families_used: number
    monitored_families_limit: number
    active_bids_used: number
    active_bids_limit: number
    team_members_used: number
    team_members_limit: number
  }
  available_plans: SubscriptionPlanItem[]
  history: SubscriptionHistoryItem[]
}

// ==========================================
// Helper to unwrap ApiResponse<{ success: boolean, data: T }>
// ==========================================
function unwrap<T>(res: { data: { success?: boolean; data?: T } | T }): T {
  const body = res.data as { success?: boolean; data?: T }
  if (body && typeof body === "object" && "data" in body && body.data !== undefined) {
    return body.data
  }
  return unwrap(res) as T
}

// ==========================================
// React Query Hooks
// ==========================================
export function useB2BOpportunities(params: {
  unspsc_family?: string
  institution_id?: number
  modality?: string
  q?: string
  only_high_affinity?: boolean
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ["b2b", "opportunities", params],
    queryFn: async () => {
      const qp = new URLSearchParams()
      if (params.unspsc_family) qp.set("unspsc_family", params.unspsc_family)
      if (params.institution_id) qp.set("institution_id", String(params.institution_id))
      if (params.modality) qp.set("modality", params.modality)
      if (params.q) qp.set("q", params.q)
      if (params.only_high_affinity) qp.set("only_high_affinity", "true")
      if (params.page) qp.set("page", String(params.page))
      if (params.limit) qp.set("limit", String(params.limit))

      const res = await apiClient.get<OpportunitiesResponse>(`/b2b/opportunities?${qp.toString()}`)
      return unwrap(res)
    },
  })
}

export function useB2BBids() {
  return useQuery({
    queryKey: ["b2b", "bids"],
    queryFn: async () => {
      const res = await apiClient.get<BidsResponse>("/b2b/bids")
      return unwrap(res)
    },
  })
}

export function useUpsertBid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: BidUpsertPayload) => {
      const res = await apiClient.post<BidItem>("/b2b/bids", payload)
      return unwrap(res)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["b2b", "bids"] })
      queryClient.invalidateQueries({ queryKey: ["b2b", "opportunities"] })
      queryClient.invalidateQueries({ queryKey: ["b2b", "subscription"] })
    },
  })
}

export function useDeleteBid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bidId: string) => {
      const res = await apiClient.delete<{ bid_id: string; deleted: boolean }>(`/b2b/bids/${bidId}`)
      return unwrap(res)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["b2b", "bids"] })
      queryClient.invalidateQueries({ queryKey: ["b2b", "opportunities"] })
      queryClient.invalidateQueries({ queryKey: ["b2b", "subscription"] })
    },
  })
}

export function useCompetitorsList(q?: string) {
  return useQuery({
    queryKey: ["b2b", "competitors", q],
    queryFn: async () => {
      const qp = q ? `?q=${encodeURIComponent(q)}` : ""
      const res = await apiClient.get<CompetitorListItem[]>(`/b2b/competitors${qp}`)
      return unwrap(res)
    },
  })
}

export function useCompetitorProfile(rnc: string) {
  return useQuery({
    queryKey: ["b2b", "competitor", rnc],
    queryFn: async () => {
      const res = await apiClient.get<CompetitorProfileResponse>(`/b2b/competitors/${encodeURIComponent(rnc)}`)
      return unwrap(res)
    },
    enabled: Boolean(rnc),
  })
}

export function useSimulatorCatalog() {
  return useQuery({
    queryKey: ["b2b", "simulator", "catalog"],
    queryFn: async () => {
      const res = await apiClient.get<SimulatorCatalogItem[]>("/b2b/price-simulator/catalog")
      return unwrap(res)
    },
  })
}

export function useSimulatePrice() {
  return useMutation({
    mutationFn: async (payload: PriceSimulationPayload) => {
      const res = await apiClient.post<PriceSimulationResponse>("/b2b/price-simulator", payload)
      return unwrap(res)
    },
  })
}

export function useSectors() {
  return useQuery({
    queryKey: ["b2b", "sectors"],
    queryFn: async () => {
      const res = await apiClient.get<SectorsResponse>("/b2b/sectors")
      return unwrap(res)
    },
  })
}

export function useUpdateMonitoredSectors() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (monitored_families: string[]) => {
      const res = await apiClient.put<SectorsResponse>("/b2b/sectors", { monitored_families })
      return unwrap(res)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["b2b", "sectors"] })
      queryClient.invalidateQueries({ queryKey: ["b2b", "opportunities"] })
      queryClient.invalidateQueries({ queryKey: ["b2b", "subscription"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard", "overview"] })
    },
  })
}

export function useSubscriptionSummary() {
  return useQuery({
    queryKey: ["b2b", "subscription"],
    queryFn: async () => {
      const res = await apiClient.get<SubscriptionResponse>("/b2b/subscription")
      return unwrap(res)
    },
  })
}

export function useUpdateSubscriptionPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { target_plan_tier: string; billing_cycle?: string }) => {
      const res = await apiClient.put<SubscriptionResponse>("/b2b/subscription", payload)
      return unwrap(res)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["b2b"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard"] })
      queryClient.invalidateQueries({ queryKey: ["auth"] })
    },
  })
}
