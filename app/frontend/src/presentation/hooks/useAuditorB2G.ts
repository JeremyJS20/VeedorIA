import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import apiClient from "../../infrastructure/apiClient"

export interface InstitutionalProcessItem {
  id: number
  process_code: string
  title: string
  institution_name: string
  primary_supplier: string
  status: string
  signed_date: string
  contracts_count: number
  total_amount: number
  anomalies_count: number
  max_severity: number
}

export interface InstitutionalProcessesResponse {
  scope_label: string
  kpis: {
    total_processes: number
    total_contracts: number
    total_amount: number
    processes_with_findings: number
  }
  items: InstitutionalProcessItem[]
  total: number
  page: number
  limit: number
}

export interface CollusionPairItem {
  supplier_a: string
  supplier_b: string
  institution_name: string
  shared_processes_count: number
  sample_process_code: string
  combined_amount: number
  pattern_label: string
  risk_score: number
}

export interface RecurrentSupplierItem {
  supplier_name: string
  rpe: string
  institution_name: string
  processes_count: number
  contracts_count: number
  total_amount: number
}

export interface CollusionNetworkResponse {
  locked: boolean
  required_plan: string
  scope_label: string
  kpis: {
    clusters_detected: number
    suppliers_flagged: number
    collusion_anomalies_count: number
    exposed_amount: number
  }
  pairs: CollusionPairItem[]
  recurrent_suppliers: RecurrentSupplierItem[]
}

export interface DetectionParameterItem {
  key: string
  label: string
  category: "PESOS" | "UMBRALES" | string
  value: number
  default_value: number
  min: number
  max: number
  step: number
  description: string
  updated_at: string
}

export interface DetectionConfigResponse {
  scope_label: string
  can_edit: boolean
  parameters: DetectionParameterItem[]
}

export interface AuditResolutionItem {
  id: string
  process_code: string
  institution_name: string
  supplier_name: string
  anomaly_type: string
  anomaly_type_label: string
  status: "CONFIRMED" | "DISMISSED" | string
  status_label: string
  severity: number
  amount: number
  resolution_summary: string
  resolved_at: string
}

export interface AuditResolutionsResponse {
  scope_label: string
  kpis: {
    total_resolved: number
    confirmed_count: number
    dismissed_count: number
    audited_amount: number
  }
  items: AuditResolutionItem[]
  total: number
  page: number
  limit: number
}

export interface ReportBreakdownTypeItem {
  anomaly_type: string
  label: string
  count: number
  confirmed: number
  pending: number
  amount: number
}

export interface ReportTopFindingItem {
  id: string
  process_code: string
  institution_name: string
  supplier_name: string
  anomaly_type_label: string
  severity: number
  status_label: string
  amount: number
}

export interface ComplianceReportSummaryResponse {
  generated_at: string
  scope_label: string
  organization_name: string
  prepared_by: string
  kpis: {
    total_processes: number
    total_contracts: number
    total_amount: number
    total_anomalies: number
    critical_count: number
    pending_count: number
    confirmed_count: number
    dismissed_count: number
    exposed_amount: number
    resolution_rate_pct: number
  }
  breakdown_by_type: ReportBreakdownTypeItem[]
  top_findings: ReportTopFindingItem[]
}

export interface IntegrationEndpointCatalogItem {
  name: string
  method: string
  path: string
  description: string
}

export interface IntegrationKeyItem {
  id: string
  name: string
  system_target: string
  prefix: string
  created_by: string
  created_at: string
  status: "ACTIVE" | "REVOKED" | string
}

export interface B2GIntegrationsResponse {
  scope_label: string
  plan_code: string
  can_manage: boolean
  endpoints_catalog: IntegrationEndpointCatalogItem[]
  keys: IntegrationKeyItem[]
}

export interface CreatedIntegrationKeyResponse {
  id: string
  name: string
  system_target: string
  prefix: string
  raw_token: string
  created_at: string
}

export function useInstitutionalProcesses(params: {
  q?: string
  status?: string
  only_with_anomalies?: boolean
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: [
      "auditor-processes",
      params.q || "",
      params.status || "",
      Boolean(params.only_with_anomalies),
      params.page || 1,
      params.limit || 20,
    ],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        success: boolean
        data: InstitutionalProcessesResponse
      }>("/auditor/processes", {
        params: {
          q: params.q || "",
          status: params.status || "",
          only_with_anomalies: Boolean(params.only_with_anomalies),
          page: params.page || 1,
          limit: params.limit || 20,
        },
      })
      return data.data
    },
  })
}

export function useCollusionNetwork() {
  return useQuery({
    queryKey: ["auditor-collusion-network"],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        success: boolean
        data: CollusionNetworkResponse
      }>("/auditor/collusion-network")
      return data.data
    },
  })
}

export function useDetectionConfig() {
  return useQuery({
    queryKey: ["auditor-detection-config"],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        success: boolean
        data: DetectionConfigResponse
      }>("/auditor/detection-config")
      return data.data
    },
  })
}

export function useUpdateDetectionConfig() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (parameters: Record<string, number>) => {
      const { data } = await apiClient.put<{
        success: boolean
        data: DetectionConfigResponse
      }>("/auditor/detection-config", { parameters })
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["auditor-detection-config"] })
    },
  })
}

export function useAuditResolutions(params: {
  decision?: string
  q?: string
  page?: number
  limit?: number
}) {
  return useQuery({
    queryKey: [
      "auditor-resolutions",
      params.decision || "",
      params.q || "",
      params.page || 1,
      params.limit || 20,
    ],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        success: boolean
        data: AuditResolutionsResponse
      }>("/auditor/resolutions", {
        params: {
          decision: params.decision || "",
          q: params.q || "",
          page: params.page || 1,
          limit: params.limit || 20,
        },
      })
      return data.data
    },
  })
}

export function useComplianceReportSummary() {
  return useQuery({
    queryKey: ["auditor-reports-summary"],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        success: boolean
        data: ComplianceReportSummaryResponse
      }>("/auditor/reports/summary")
      return data.data
    },
  })
}

export function useAuditorIntegrations() {
  return useQuery({
    queryKey: ["auditor-integrations"],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        success: boolean
        data: B2GIntegrationsResponse
      }>("/auditor/integrations")
      return data.data
    },
  })
}

export function useCreateIntegrationKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { name: string; system_target: string }) => {
      const { data } = await apiClient.post<{
        success: boolean
        data: CreatedIntegrationKeyResponse
      }>("/auditor/integrations/keys", payload)
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["auditor-integrations"] })
    },
  })
}

export function useRevokeIntegrationKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (keyId: string) => {
      const { data } = await apiClient.delete<{
        success: boolean
        data: { id: string; status: string }
      }>(`/auditor/integrations/keys/${keyId}`)
      return data.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["auditor-integrations"] })
    },
  })
}
