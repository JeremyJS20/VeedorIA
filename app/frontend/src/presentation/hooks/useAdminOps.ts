import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import apiClient from "../../infrastructure/apiClient"

// ==========================================
// Tipos: operaciones de sincronización (#32)
// ==========================================
export type SyncStatus = "running" | "completed" | "failed" | string

export interface SyncLogRow {
  id: number
  process_type: string
  status: SyncStatus
  records_synced: number
  started_at: string | null
  completed_at: string | null
  duration_s: number | null
  error_message: string | null
  triggered_by: string
  sync_type: string
}

export interface SyncOverview {
  kpis: {
    last_sync: SyncLogRow | null
    records_total: number
    avg_duration_s: number
    failures_24h: number
    running: SyncLogRow | null
  }
  syncs: SyncLogRow[]
  detections: SyncLogRow[]
}

export interface QueueStatus {
  redis: "OK" | "OFFLINE" | string
  worker: "OK" | "DOWN" | string
  queue_depth: number
  failed_jobs_24h: number
  checked_at: string
}

export interface SyncTriggerPayload {
  full: boolean
  skip_institutions: boolean
  skip_processes: boolean
  skip_contracts: boolean
  skip_items: boolean
  skip_suppliers: boolean
  days_back: number | null
  rate_limit: number
}

export interface SyncTriggerResult {
  task: string
  sync_type: string
}

// ==========================================
// Tipos: calibración y motor (#33)
// ==========================================
export type ParameterCategory = "PESOS" | "UMBRALES" | "UMBRALES_DGCP" | string

export interface DetectionParameter {
  key: string
  label: string
  category: ParameterCategory
  value: number
  default_value: number
  min: number
  max: number
  step: number
  description: string
  updated_at: string | null
}

export interface DetectionConfigResponse {
  parameters: DetectionParameter[]
  adjusted?: Record<string, { requested: number; applied: number }>
  reset?: string[]
}

export interface CalibrationTypeAnalysis {
  anomaly_type: string
  reviews: number
  tp: number
  fp: number
  fn: number
  precision: number
  recall: number
  f1: number
  current_threshold: number | null
  recommended_threshold: number | null
  grid: number[]
  confirmation_rate_by_level?: Record<string, number>
}

export interface CalibrationAnalysis {
  generated_at: string
  types: CalibrationTypeAnalysis[]
  insufficient_data: string[]
}

export interface CalibrationApplyResult {
  applied: Record<string, number>
  adjusted: Record<string, { requested: number; applied: number }>
}

// ==========================================
// Tipos: bitácora (#35)
// ==========================================
export interface AuditLogRow {
  id: number
  action_type: string
  user_id: string | null
  user_email: string | null
  entity_type: string | null
  entity_id: string | null
  old_value: unknown
  new_value: unknown
  ip_address: string | null
  timestamp: string | null
}

export interface AuditLogFilters {
  action_type?: string
  user_id?: string
  entity_type?: string
  entity_id?: string
  date_from?: string
  date_to?: string
  page?: number
  limit?: number
}

export interface AuditLogResponse {
  total: number
  page: number
  limit: number
  items: AuditLogRow[]
}

// ==========================================
// Tipos: soporte y salud (#36)
// ==========================================
export type HealthStatus = "OK" | "DEGRADED" | "DOWN" | string

export interface HealthComponent {
  key: string
  label: string
  status: HealthStatus
  detail: string
  latency_ms: number
}

export interface ServicesHealth {
  checked_at: string
  components: HealthComponent[]
}

export type TicketStatus = "ABIERTO" | "EN_PROGRESO" | "RESUELTO" | "CERRADO" | string

export interface SupportTicketMessage {
  id: number
  ticket_id: number
  author_id: number
  body: string
  created_at: string | null
}

export interface SupportTicket {
  id: number
  code: string
  subject: string
  category: string
  module: string
  priority: string
  description: string
  status: TicketStatus
  reporter_id: number
  reporter_tenant_id: number
  assigned_to_id: number | null
  created_at: string | null
  updated_at: string | null
  closed_at: string | null
  messages: SupportTicketMessage[]
}

export interface SupportTicketList {
  total: number
  page: number
  limit: number
  items: SupportTicket[]
}

export interface CreateTicketPayload {
  subject: string
  category: string
  module: string
  priority: string
  description: string
}

export interface UpdateTicketPayload {
  status?: string
  assigned_to_id?: number
  reply?: string
}

// ==========================================
// Helper: desenvuelve ApiResponse<T>
// ==========================================
function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}

function toQueryString(params: Record<string, string | number | undefined | null>): string {
  const qp = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      qp.set(key, String(value))
    }
  })
  const qs = qp.toString()
  return qs ? `?${qs}` : ""
}

// ==========================================
// Hook: sincronización y cola
// ==========================================
export function useSyncOverview(limit = 10) {
  return useQuery({
    queryKey: ["admin", "sync", "overview", limit],
    queryFn: async () => {
      const res = await apiClient.get(`/admin/sync/overview${toQueryString({ limit })}`)
      return unwrap<SyncOverview>(res.data)
    },
    refetchInterval: (query) => {
      const data = query.state.data as SyncOverview | undefined
      return data?.kpis?.running ? 5000 : false
    },
  })
}

export function useQueueStatus() {
  return useQuery({
    queryKey: ["admin", "queue", "status"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/queue/status")
      return unwrap<QueueStatus>(res.data)
    },
    refetchInterval: 15000,
  })
}

export function useTriggerSync() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: SyncTriggerPayload) => {
      const res = await apiClient.post("/admin/sync/trigger", payload)
      return unwrap<SyncTriggerResult>(res.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "sync"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "queue"] })
    },
  })
}

// ==========================================
// Hook: calibración del motor
// ==========================================
export function useDetectionConfig() {
  return useQuery({
    queryKey: ["admin", "detection-config"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/detection-config")
      return unwrap<DetectionConfigResponse>(res.data)
    },
  })
}

export function useUpdateDetectionConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (parameters: Record<string, number>) => {
      const res = await apiClient.put("/admin/detection-config", { parameters })
      return unwrap<DetectionConfigResponse>(res.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "detection-config"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "calibration"] })
    },
  })
}

export function useResetDetectionConfig() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (keys?: string[]) => {
      const res = await apiClient.post("/admin/detection-config/reset", { keys: keys ?? null })
      return unwrap<DetectionConfigResponse>(res.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "detection-config"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "calibration"] })
    },
  })
}

export function useCalibrationAnalysis(anomalyType?: string) {
  return useQuery({
    queryKey: ["admin", "calibration", "analysis", anomalyType ?? "ALL"],
    queryFn: async () => {
      const res = await apiClient.get(
        `/admin/calibration/analysis${toQueryString({ anomaly_type: anomalyType })}`
      )
      return unwrap<CalibrationAnalysis>(res.data)
    },
  })
}

export function useApplyCalibration() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (changes: Record<string, number>) => {
      const res = await apiClient.post("/admin/calibration/apply", { changes })
      return unwrap<CalibrationApplyResult>(res.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "detection-config"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "calibration"] })
    },
  })
}

export function useRunDetection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/admin/detection/run")
      return unwrap<{ task: string }>(res.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "sync"] })
    },
  })
}

// ==========================================
// Hook: bitácora
// ==========================================
export function useAuditLogs(filters: AuditLogFilters) {
  return useQuery({
    queryKey: ["admin", "audit-logs", filters],
    queryFn: async () => {
      const res = await apiClient.get(
        `/admin/audit-logs${toQueryString({
          action_type: filters.action_type,
          user_id: filters.user_id,
          entity_type: filters.entity_type,
          entity_id: filters.entity_id,
          date_from: filters.date_from,
          date_to: filters.date_to,
          page: filters.page,
          limit: filters.limit,
        })}`
      )
      return unwrap<AuditLogResponse>(res.data)
    },
  })
}

export function useExportAuditLogs() {
  return useMutation({
    mutationFn: async ({
      format,
      filters,
    }: {
      format: "csv" | "json"
      filters: AuditLogFilters
    }) => {
      const query = toQueryString({
        action_type: filters.action_type,
        user_id: filters.user_id,
        entity_type: filters.entity_type,
        entity_id: filters.entity_id,
        date_from: filters.date_from,
        date_to: filters.date_to,
        format,
      })
      const res = await apiClient.get(`/admin/audit-logs/export${query}`, {
        responseType: "blob",
      })
      const blob = res.data as Blob
      const checksum = (res.headers?.["x-checksum-sha256"] as string | undefined) ?? null
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = `bitacora-veedoria.${format}`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      return { checksum, rows: blob.size }
    },
  })
}

// ==========================================
// Hook: salud de servicios
// ==========================================
export function useServicesHealth() {
  return useQuery({
    queryKey: ["admin", "health", "services"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/health/services")
      return unwrap<ServicesHealth>(res.data)
    },
    refetchInterval: 30000,
  })
}

// ==========================================
// Hook: tickets de soporte
// ==========================================
export function useMyTickets() {
  return useQuery({
    queryKey: ["support", "tickets", "mine"],
    queryFn: async () => {
      const res = await apiClient.get("/support/tickets")
      return unwrap<SupportTicket[]>(res.data)
    },
  })
}

export function useCreateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateTicketPayload) => {
      const res = await apiClient.post("/support/tickets", payload)
      return unwrap<SupportTicket>(res.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support", "tickets"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "support"] })
    },
  })
}

export function useAdminTickets(filters: {
  status?: string
  category?: string
  q?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: ["admin", "support", "tickets", filters],
    queryFn: async () => {
      const res = await apiClient.get(
        `/admin/support/tickets${toQueryString({
          status: filters.status,
          category: filters.category,
          q: filters.q,
          page: filters.page,
          limit: filters.limit,
        })}`
      )
      return unwrap<SupportTicketList>(res.data)
    },
  })
}

export function useUpdateTicket() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: UpdateTicketPayload }) => {
      const res = await apiClient.patch(`/admin/support/tickets/${id}`, payload)
      return unwrap<SupportTicket>(res.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "support"] })
      queryClient.invalidateQueries({ queryKey: ["support", "tickets"] })
    },
  })
}
