import { useState } from "react"
import {
  Plus,
  Copy,
  Check,
  Trash2,
  ShieldAlert,
  Terminal,
} from "lucide-react"
import {
  useAuditorIntegrations,
  useCreateIntegrationKey,
  useRevokeIntegrationKey,
  type CreatedIntegrationKeyResponse,
} from "../hooks/useAuditorB2G"
import DataTable from "../components/ui/DataTable"
import StatusChip from "../components/ui/StatusChip"

export default function B2GIntegrationsPage() {
  const { data, isLoading } = useAuditorIntegrations()
  const createMutation = useCreateIntegrationKey()
  const revokeMutation = useRevokeIntegrationKey()

  const [connectorName, setConnectorName] = useState("")
  const [systemTarget, setSystemTarget] = useState("Power BI / Tablero Institucional")
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<CreatedIntegrationKeyResponse | null>(
    null
  )
  const [copied, setCopied] = useState(false)

  const canManage = Boolean(data?.can_manage)
  const keys = data?.keys || []
  const endpoints = data?.endpoints_catalog || []
  const activeKeysCount = keys.filter((k) => k.status === "ACTIVE").length

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManage || !connectorName.trim()) return
    const result = await createMutation.mutateAsync({
      name: connectorName.trim(),
      system_target: systemTarget,
    })
    setNewlyCreatedKey(result)
    setConnectorName("")
    setCopied(false)
  }

  const handleCopyToken = async () => {
    if (!newlyCreatedKey?.raw_token) return
    await navigator.clipboard.writeText(newlyCreatedKey.raw_token)
    setCopied(true)
  }

  return (
    <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">
            Integraciones y Conectores Institucionales
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Credenciales de lectura y conectores de interoperabilidad para tableros analíticos (Power BI, Tableau) y sistemas de control interno.
          </p>
        </div>
      </div>

      {/* 3 Summary KPI Cards matching MarketIntelligencePage */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-primary rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Llaves Activas
          </p>
          <p className="font-mono text-2xl font-bold text-on-surface mt-2">
            {activeKeysCount} {activeKeysCount === 1 ? "Credencial" : "Credenciales"}
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            De {keys.length} emitidas en el historial
          </p>
        </div>

        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-outline-variant rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Flujos de Lectura Habilitados
          </p>
          <p className="font-mono text-2xl font-bold text-on-surface mt-2">
            {endpoints.length} Conectores REST
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Formato JSON compatible con Power BI y Tableau
          </p>
        </div>

        <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-primary rounded-2xl p-5 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
            Modo de Acceso
          </p>
          <p className="font-mono text-2xl font-bold text-primary mt-2">
            Solo Lectura (GET)
          </p>
          <p className="text-xs text-on-surface-variant mt-1">
            Aislamiento estricto por unidad institucional
          </p>
        </div>
      </div>

      {!canManage && !isLoading && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-on-surface">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong>Acceso de consulta:</strong> La emisión y revocación de llaves de interoperabilidad requiere un rol de Administración Institucional o Contraloría bajo el plan{" "}
            <strong>Institucional Avanzado (B2G_PREMIUM)</strong> o superior.
          </div>
        </div>
      )}

      {/* Aviso de llave recién generada */}
      {newlyCreatedKey && (
        <div className="bg-emerald-500/10 border border-emerald-500/35 rounded-2xl p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Credencial generada exitosamente: {newlyCreatedKey.name}
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Copie y almacene esta llave en su gestor seguro ahora. Por razones de seguridad solo se muestra completa una única vez.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleCopyToken()}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copiada al Portapapeles" : "Copiar Llave"}</span>
            </button>
          </div>
          <div className="p-3.5 rounded-xl bg-surface border border-outline-variant/35 font-mono text-xs text-primary break-all">
            {newlyCreatedKey.raw_token}
          </div>
        </div>
      )}

      {/* Two-Column Layout matching MarketIntelligencePage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Emisión y Tabla de Llaves */}
        <div className="lg:col-span-7 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-6 space-y-5 shadow-xs">
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-outline-variant/25">
            <div>
              <h2 className="font-display text-base font-bold text-on-surface">
                Llaves de Conexión Institucional
              </h2>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Emita credenciales de solo lectura acotadas a los datos de su organismo
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-surface-container-high text-xs font-mono font-semibold text-on-surface shrink-0">
              SHA-256
            </span>
          </div>

          {canManage && (
            <form
              onSubmit={(e) => void handleCreateKey(e)}
              className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/30 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Nombre Descriptivo del Conector
                  </label>
                  <input
                    type="text"
                    required
                    value={connectorName}
                    onChange={(e) => setConnectorName(e.target.value)}
                    placeholder="Ej. Tablero Power BI Contraloría"
                    className="w-full h-10 px-3.5 rounded-xl bg-surface border border-outline-variant/35 text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Sistema o Herramienta Destino
                  </label>
                  <select
                    value={systemTarget}
                    onChange={(e) => setSystemTarget(e.target.value)}
                    aria-label="Sistema o herramienta destino"
                    className="w-full h-10 px-3.5 rounded-xl bg-surface border border-outline-variant/35 text-xs font-medium text-on-surface focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="Power BI / Tablero Institucional">
                      Power BI / Tablero Institucional
                    </option>
                    <option value="Tableau / Analítica Interna">
                      Tableau / Analítica Interna
                    </option>
                    <option value="Sistema de Gestión Financiera / ERP">
                      Sistema de Gestión Financiera / ERP
                    </option>
                    <option value="Repositorio de Control Interno">
                      Repositorio de Control Interno
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={createMutation.isPending || !connectorName.trim()}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 transition-opacity inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{createMutation.isPending ? "Generando..." : "Generar Nueva Llave"}</span>
                </button>
              </div>
            </form>
          )}

          <DataTable
            rows={keys}
            rowKey={(k) => k.id}
            emptyMessage="No hay llaves de integración registradas para esta organización."
            columns={[
              {
                key: "conector",
                header: "Conector / Destino",
                cell: (k) => (
                  <>
                    <div className="font-semibold text-on-surface">{k.name}</div>
                    <div className="text-[11px] text-on-surface-variant mt-0.5">{k.system_target}</div>
                  </>
                ),
              },
              {
                key: "prefijo",
                header: "Prefijo",
                cellClassName: "font-mono text-primary font-semibold",
                cell: (k) => k.prefix,
              },
              {
                key: "emision",
                header: "Emisión",
                cellClassName: "text-on-surface-variant",
                cell: (k) => (
                  <>
                    <div className="font-mono text-[11px]">{k.created_at}</div>
                    <div className="text-[11px]">{k.created_by}</div>
                  </>
                ),
              },
              {
                key: "estado",
                header: "Estado",
                cell: (k) =>
                  k.status === "ACTIVE" ? (
                    <StatusChip tone="success" label="Activa" />
                  ) : (
                    <StatusChip tone="neutral" label="Revocada" />
                  ),
              },
              ...(canManage
                ? [
                    {
                      key: "accion",
                      header: "Acción",
                      align: "right" as const,
                      cell: (k: (typeof keys)[number]) =>
                        k.status === "ACTIVE" ? (
                          <button
                            type="button"
                            disabled={revokeMutation.isPending}
                            onClick={() => void revokeMutation.mutateAsync(k.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/25 hover:bg-red-500/20 font-semibold cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Revocar</span>
                          </button>
                        ) : (
                          <span className="text-on-surface-variant">—</span>
                        ),
                    },
                  ]
                : []),
            ]}
          />
        </div>

        {/* Right: Catálogo de Flujos Disponibles */}
        <div className="lg:col-span-5 bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl p-6 space-y-5 shadow-xs">
          <div className="pb-3 border-b border-outline-variant/25">
            <h2 className="font-display text-base font-bold text-on-surface">
              Catálogo de Flujos de Datos
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Puntos de consulta habilitados para consumo automatizado desde sus sistemas internos
            </p>
          </div>

          <div className="space-y-3">
            {endpoints.map((ep) => (
              <div
                key={ep.path}
                className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/30 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-on-surface">{ep.name}</span>
                  <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-mono text-[11px] font-bold">
                    {ep.method}
                  </span>
                </div>
                <div className="font-mono text-xs text-primary bg-surface px-3 py-1.5 rounded-lg border border-outline-variant/25">
                  {ep.path}
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {ep.description}
                </p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/30 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
              <Terminal className="w-4 h-4 text-primary" />
              <span>Guía Rápida de Autenticación</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Incluya la cabecera de autorización institucional en sus consultas programadas desde Power BI (Conector Web) o scripts de extracción:
            </p>
            <pre className="p-3 rounded-lg bg-surface border border-outline-variant/25 font-mono text-[11px] text-on-surface overflow-x-auto">
              {`Authorization: Bearer <LLAVE_DE_INTEGRACION>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
