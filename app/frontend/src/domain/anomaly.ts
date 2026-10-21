export interface Anomaly {
  id: string
  anomaly_type: "PRICE_ANOMALY" | "FRAGMENTATION" | "COLLUSION"
  severity: number
  score: number | null
  confidence?: string
  signals_count?: number
  description: string
  status: "PENDING" | "CONFIRMED" | "DISMISSED"
  reviewer_id: string | null
  dismissal_reason: DismissalReason | null
  contract_id: number | null
  process_id: number | null
  detection_metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
  amount: number | null
  process_code: string | null
  supplier_name: string | null
  institution_name: string | null
}

export interface AnomalyStats {
  total_by_type: Record<string, number>
  total_by_status: Record<string, number>
  avg_severity: number
  total: number
}

export type DismissalReason = "FALSE_POSITIVE" | "DUPLICATE" | "DATA_ERROR" | "ALREADY_KNOWN"

export interface AnomalyReviewPayload {
  status: "CONFIRMED" | "DISMISSED"
  notes?: string
  dismissal_reason?: DismissalReason
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
}

export interface MarketPrice {
  contract_id: number
  supplier_name: string | null
  unit_price: number
  is_anomaly: boolean
  description: string | null
}

export interface TimelineEntry {
  date: string
  reference: string
  title: string
  amount: number
  is_alert: boolean
  alert_message: string | null
}

export interface CollusionLink {
  source: string
  source_rnc?: string
  target: string
  target_rnc?: string
  reason: string
  weight: number
  signal_details: Record<string, unknown>
}

export interface AnomalyContext {
  anomaly_type: string
  severity: number
  score: number | null
  confidence: number
  signals_count?: number
  amount: number | null
  process_code: string | null
  supplier_name: string | null
  institution_name: string | null
  market_prices: MarketPrice[]
  fragmentation_threshold?: number
  fragmentation_combined_amount?: number | null
  recent_contracts: TimelineEntry[]
  collusion_links: CollusionLink[]
}
