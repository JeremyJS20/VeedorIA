import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import apiClient from "../../infrastructure/apiClient"
import type { Anomaly, AnomalyContext, AnomalyReviewPayload, AnomalyStats, ApiResponse, PaginatedResponse } from "../../domain/anomaly"

interface AnomalyFilters {
  anomaly_type?: string
  status?: string
  min_severity?: number
  search?: string
  page?: number
  limit?: number
}

export function useAnomalies(filters: AnomalyFilters = {}) {
  const params = new URLSearchParams()
  if (filters.anomaly_type) params.set("anomaly_type", filters.anomaly_type)
  if (filters.status) params.set("status", filters.status)
  if (filters.min_severity !== undefined) params.set("min_severity", String(filters.min_severity))
  if (filters.search) params.set("search", filters.search)
  if (filters.page) params.set("offset", String((filters.page - 1) * (filters.limit || 50)))
  if (filters.limit) params.set("limit", String(filters.limit))

  return useQuery<PaginatedResponse<Anomaly>>({
    queryKey: ["anomalies", filters],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Anomaly>>>(
        `/anomalies?${params.toString()}`,
      )
      if (!data.success || !data.data) throw new Error(data.message || "Error al cargar anomalías")
      return data.data
    },
    staleTime: 30_000,
  })
}

export function useAnomalyStats() {
  return useQuery<AnomalyStats>({
    queryKey: ["anomaly-stats"],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<AnomalyStats>>("/anomalies/stats")
      if (!data.success || !data.data) throw new Error(data.message || "Error al cargar estadísticas")
      return data.data
    },
    staleTime: 30_000,
  })
}

export function useAnomaly(id: string) {
  return useQuery<Anomaly>({
    queryKey: ["anomaly", id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<Anomaly>>(`/anomalies/${id}`)
      if (!data.success || !data.data) throw new Error(data.message || "Anomalía no encontrada")
      return data.data
    },
    enabled: !!id,
  })
}

export function useAnomalyContext(id: string) {
  return useQuery<AnomalyContext>({
    queryKey: ["anomaly-context", id],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<AnomalyContext>>(`/anomalies/${id}/context`)
      if (!data.success || !data.data) throw new Error(data.message || "Error al cargar contexto")
      return data.data
    },
    enabled: !!id,
    staleTime: 30_000,
  })
}

export function useRunDetection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<ApiResponse<Record<string, number>>>("/anomalies/detect")
      if (!data.success) throw new Error(data.message || "Error al ejecutar detección")
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anomalies"] })
      queryClient.invalidateQueries({ queryKey: ["anomaly-stats"] })
    },
  })
}

export function useReviewAnomaly() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: AnomalyReviewPayload }) => {
      const { data } = await apiClient.patch<ApiResponse<Anomaly>>(`/anomalies/${id}`, payload)
      if (!data.success || !data.data) throw new Error(data.message || "Error al revisar anomalía")
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anomalies"] })
      queryClient.invalidateQueries({ queryKey: ["anomaly-stats"] })
    },
  })
}