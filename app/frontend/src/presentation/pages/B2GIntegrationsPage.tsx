import { useState } from "react"
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Trash2,
  Database,
  ShieldAlert,
  Terminal,
} from "lucide-react"
import {
  useAuditorIntegrations,
  useCreateIntegrationKey,
  useRevokeIntegrationKey,
  type CreatedIntegrationKeyResponse,
} from "../hooks/useAuditorB2G"

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
      <div>
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">
          Integraciones Institucionales
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Credenciales de lectura y conectores de interoperabilidad para tableros analíticos (Power BI, Tableau) y sistemas de control interno.
        </p>
      </div>

      {!canManage && !isLoading && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-on-surface leading-relaxed">
            <strong>Acceso de consulta:</strong> La emisión y revocación de llaves de interoperabilidad requiere un rol de Administración Institucional o Contraloría bajo el plan <strong>Institucional Pro (B2G_PRO)</strong> o superior.
          </div>
        </div>
      )}

      {/* Aviso de llave recién generada (visualización única) */}
      {newlyCreatedKey && (
        <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-on-surface">
                Credencial generada: {newlyCreatedKey.name}
              </p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Copie y almacene esta llave en su gestor seguro ahora. Por razones de seguridad solo se muestra completa una única vez.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleCopyToken()}
              className="h-9 px-3.5 rounded-lg bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copiada" : "Copiar Llave"}
            </button>
          </div>
          <div className="p-3 rounded-lg bg-surface border border-outline-variant/40 font-mono text-xs text-primary break-all">
            {newlyCreatedKey.raw_token}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
        {/* Gestión de Llaves */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/20">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">
                Llaves de Conexión Institucional
              </h2>
              <p className="text-xs text-on-surface-variant">
                Emita credenciales de solo lectura con alcance restringido a los datos de su unidad.
              </p>
            </div>
          </div>

          {canManage && (
            <form
              onSubmit={(e) => void handleCreateKey(e)}
              className="bg-surface border border-outline-variant/30 rounded-xl p-4 space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Nombre Descriptivo del Conector
                  </label>
                  <input
                    type="text"
                    required
                    value={connectorName}
                    onChange={(e) => setConnectorName(e.target.value)}
                    placeholder="Ej. Tablero Power BI Contraloría"
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1">
                    Sistema o Herramienta Destino
                  </label>
                  <select
                    value={systemTarget}
                    onChange={(e) => setSystemTarget(e.target.value)}
                    aria-label="Sistema o herramienta destino"
                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:border-primary"
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
                  className="h-9 px-4 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {createMutation.isPending ? "Generando..." : "Generar Nueva Llave"}
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/25 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  <th className="py-2.5 px-3">Conector / Destino</th>
                  <th className="py-2.5 px-3">Prefijo</th>
                  <th className="py-2.5 px-3">Emisión</th>
                  <th className="py-2.5 px-3">Estado</th>
                  {canManage && <th className="py-2.5 px-3 text-right">Acción</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 text-xs">
                {keys.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canManage ? 5 : 4}
                      className="py-8 text-center text-on-surface-variant"
                    >
                      No hay llaves de integración registradas para esta organización.
                    </td>
                  </tr>
                ) : (
                  keys.map((k) => (
                    <tr key={k.id} className="hover:bg-surface-container-high/40">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-on-surface">{k.name}</div>
                        <div className="text-[11px] text-on-surface-variant">
                          {k.system_target}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-on-surface-variant">{k.prefix}</td>
                      <td className="py-3 px-3 text-on-surface-variant">
                        <div>{k.created_at}</div>
                        <div className="text-[11px]">{k.created_by}</div>
                      </td>
                      <td className="py-3 px-3">
                        {k.status === "ACTIVE" ? (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                            Activa
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-container-high text-on-surface-variant">
                            Revocada
                          </span>
                        )}
                      </td>
                      {canManage && (
                        <td className="py-3 px-3 text-right">
                          {k.status === "ACTIVE" ? (
                            <button
                              type="button"
                              disabled={revokeMutation.isPending}
                              onClick={() => void revokeMutation.mutateAsync(k.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 font-semibold cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              Revocar
                            </button>
                          ) : (
                            <span className="text-on-surface-variant">—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Catálogo de Flujos Disponibles */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-outline-variant/20">
            <div className="w-9 h-9 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">
                Catálogo de Flujos de Datos
              </h2>
              <p className="text-xs text-on-surface-variant">
                Puntos de consulta habilitados para consumo automatizado desde sus sistemas internos.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {endpoints.map((ep) => (
              <div
                key={ep.path}
                className="bg-surface border border-outline-variant/30 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-on-surface">{ep.name}</span>
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[11px] font-bold">
                    {ep.method}
                  </span>
                </div>
                <div className="font-mono text-xs text-primary bg-surface-container-low px-2.5 py-1.5 rounded border border-outline-variant/20">
                  {ep.path}
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {ep.description}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-surface border border-outline-variant/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-on-surface">
              <Terminal className="w-4 h-4 text-primary" />
              Guía Rápida de Autenticación
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Incluya la cabecera de autorización institucional en sus consultas programadas desde Power BI (Conector Web) o scripts de extracción:
            </p>
            <pre className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 font-mono text-[11px] text-on-surface overflow-x-auto">
              {`Authorization: Bearer <LLAVE_DE_INTEGRACION>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
