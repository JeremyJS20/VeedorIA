export interface PublicInstitutionOption {
  id: number
  dgcp_id: string
  name: string
  contracts_count: number
}

export interface PublicTenderSummary {
  id: number
  contract_code: string
  process_id: number | null
  dgcp_code: string
  title: string
  object_description: string | null
  institution_id: number | null
  institution_name: string
  supplier_name: string
  supplier_rpe: string
  amount_adjudicated: number
  currency: string
  status: string
  signed_date: string | null
  anomaly_count: number
  max_severity: number
}

export interface PublicTendersResponse {
  items: PublicTenderSummary[]
  total: number
  page: number
  limit: number
  total_amount_filtered: number
}

export interface SankeyInstitutionNode {
  id: string
  institution_id: number
  name: string
  total_amount: number
}

export interface SankeySupplierNode {
  id: string
  name: string
  total_amount: number
}

export interface SankeyFlowLink {
  source: string
  source_name: string
  target: string
  target_name: string
  supplier_rpe: string
  amount: number
  percentage: number
}

export interface ProvincialSpendItem {
  id: string
  province: string
  total_amount: number
  active_processes: number
  critical_alerts: number
  share_pct: number
}

export interface ProvinceAttributionMeta {
  basis: string
  attributed_amount: number
  national_amount: number
  coverage_pct: number
}

export interface BudgetOverviewResponse {
  sankey: {
    institutions: SankeyInstitutionNode[]
    suppliers: SankeySupplierNode[]
    links: SankeyFlowLink[]
    total_flow_amount: number
  }
  provinces: ProvincialSpendItem[]
  provinces_meta: ProvinceAttributionMeta
}

export interface PriceComparisonItem {
  anomaly_id: string
  contract_id: number
  contract_code: string
  dgcp_code: string
  item_description: string
  unspsc_code: string
  adjudicated_unit_price: number
  market_reference_price: number
  overprice_pct: number
  institution_id: number | null
  institution_name: string
  supplier_name: string
  supplier_rpe: string
}

export interface PublicContractItem {
  id: number
  description: string
  unspsc_code: string
  quantity: number
  unit: string
  unit_price: number
  total_amount: number
}

export interface PublicAnomalyItem {
  id: string
  contract_id?: number | null
  anomaly_type: string
  severity: number
  confidence?: string
  status?: string
  description: string
  created_at?: string | null
}

export interface PublicTenderDetail extends PublicTenderSummary {
  institution_dgcp_id: string | null
  adjudication_status: string
  creation_date: string | null
  items: PublicContractItem[]
  anomalies: PublicAnomalyItem[]
}

export interface PublicSupplierProfile {
  rnc: string
  name: string
  status: string
  province: string
  is_mipyme: boolean
  total_adjudicated: number
  contracts_count: number
  anomalies_count: number
  top_institutions: {
    institution_id: number | null
    name: string
    amount: number
    count: number
  }[]
  contracts: {
    id: number
    contract_code: string
    dgcp_code: string
    title: string
    institution_id: number | null
    institution_name: string
    amount_adjudicated: number
    signed_date: string | null
    status: string
  }[]
  anomalies: PublicAnomalyItem[]
}

export interface PublicInstitutionProfile {
  id: number
  dgcp_id: string
  name: string
  processes_count: number
  contracts_count: number
  total_amount: number
  anomalies_count: number
  transparency_score: number
  contracts: {
    id: number
    contract_code: string
    dgcp_code: string
    title: string
    supplier_name: string
    supplier_rpe: string
    amount_adjudicated: number
    signed_date: string | null
  }[]
  anomalies: PublicAnomalyItem[]
}

export interface PublicRankingItem {
  institution_id: number
  dgcp_id: string
  institution_name: string
  processes_count: number
  contracts_count: number
  total_amount: number
  anomalies_count: number
  transparency_score: number
}

export interface PublicRankingResponse {
  items: PublicRankingItem[]
  total_institutions: number
  avg_transparency: number
  total_audited_amount: number
}