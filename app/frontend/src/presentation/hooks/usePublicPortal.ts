import { useQuery } from "@tanstack/react-query"
import apiClient from "../../infrastructure/apiClient"
import type { ApiResponse } from "../../domain/anomaly"
import type {
  BudgetOverviewResponse,
  PriceComparisonItem,
  PublicInstitutionOption,
  PublicInstitutionProfile,
  PublicRankingResponse,
  PublicSupplierProfile,
  PublicTenderDetail,
  PublicTendersResponse,
} from "../../domain/publicPortal"

export interface PublicTenderFilters {
  search?: string
  institution_id?: number
  province?: string
  min_amount?: number
  max_amount?: number
  only_with_anomalies?: boolean
  page?: number
  limit?: number
}

export function usePublicInstitutions() {
  return useQuery<PublicInstitutionOption[]>({
    queryKey: ["public-institutions"],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PublicInstitutionOption[]>>("/public/institutions?limit=300")
      if (!data.success || !data.data) throw new Error("Error al cargar instituciones")
      return data.data
    },
    staleTime: 120_000,
  })
}

export function usePublicTenders(filters: PublicTenderFilters = {}) {
  const params = new URLSearchParams()
  if (filters.search) params.set("search", filters.search)
  if (filters.institution_id !== undefined) params.set("institution_id", String(filters.institution_id))
  if (filters.province) params.set("province", filters.province)
  if (filters.min_amount !== undefined) params.set("min_amount", String(filters.min_amount))
  if (filters.max_amount !== undefined) params.set("max_amount", String(filters.max_amount))
  if (filters.only_with_anomalies) params.set("only_with_anomalies", "true")
  if (filters.page) params.set("page", String(filters.page))
  if (filters.limit) params.set("limit", String(filters.limit))

  return useQuery<PublicTendersResponse>({
    queryKey: ["public-tenders", filters],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PublicTendersResponse>>(`/public/tenders?${params.toString()}`)
      if (!data.success || !data.data) throw new Error("Error al cargar contrataciones")
      return data.data
    },
    staleTime: 30_000,
  })
}

export function usePublicBudgetOverview() {
  return useQuery<BudgetOverviewResponse>({
    queryKey: ["public-budget-overview"],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<BudgetOverviewResponse>>("/public/budget-overview")
      if (!data.success || !data.data) throw new Error("Error al cargar flujo presupuestario")
      return data.data
    },
    staleTime: 120_000,
  })
}

export function usePublicPriceComparisons() {
  return useQuery<PriceComparisonItem[]>({
    queryKey: ["public-price-comparison"],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PriceComparisonItem[]>>("/public/price-comparison?limit=8")
      if (!data.success || !data.data) throw new Error("Error al cargar comparador de precios")
      return data.data
    },
    staleTime: 120_000,
  })
}

export function usePublicTenderDetail(contractId: number | undefined) {
  return useQuery<PublicTenderDetail>({
    queryKey: ["public-tender-detail", contractId],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PublicTenderDetail>>(`/public/tenders/${contractId}`)
      if (!data.success || !data.data) throw new Error("Contratación no encontrada")
      return data.data
    },
    enabled: contractId !== undefined && !Number.isNaN(contractId),
  })
}

export function usePublicSupplierProfile(rnc: string | undefined) {
  return useQuery<PublicSupplierProfile>({
    queryKey: ["public-supplier-profile", rnc],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PublicSupplierProfile>>(
        `/public/suppliers/${encodeURIComponent(rnc || "")}`,
      )
      if (!data.success || !data.data) throw new Error("Proveedor no encontrado")
      return data.data
    },
    enabled: Boolean(rnc),
  })
}

export function usePublicInstitutionProfile(institutionId: number | undefined) {
  return useQuery<PublicInstitutionProfile>({
    queryKey: ["public-institution-profile", institutionId],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PublicInstitutionProfile>>(
        `/public/institutions/${institutionId}`,
      )
      if (!data.success || !data.data) throw new Error("Institución no encontrada")
      return data.data
    },
    enabled: institutionId !== undefined && !Number.isNaN(institutionId),
  })
}

export function usePublicRanking(search = "", sortBy: "amount" | "anomalies" | "transparency" = "amount") {
  const params = new URLSearchParams()
  if (search) params.set("search", search)
  params.set("sort_by", sortBy)
  params.set("limit", "100")

  return useQuery<PublicRankingResponse>({
    queryKey: ["public-ranking", search, sortBy],
    queryFn: async () => {
      const { data } = await apiClient.get<ApiResponse<PublicRankingResponse>>(`/public/ranking?${params.toString()}`)
      if (!data.success || !data.data) throw new Error("Error al cargar ranking institucional")
      return data.data
    },
    staleTime: 60_000,
  })
}