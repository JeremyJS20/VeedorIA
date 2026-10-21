import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  LayoutGrid,
  List,
  Plus,
  Trash2,
  Edit3,
  Calculator,
  ArrowUpRight,
} from "lucide-react"
import { useB2BBids, useUpsertBid, useDeleteBid } from "../hooks/useB2BSuite"
import type { BidItem, BidStage } from "../hooks/useB2BSuite"
import { ProcessInspectorDrawer } from "../components/ConsoleInspectorDrawers"
import Modal from "../components/ui/Modal"

function formatDop(val: number): string {
  return `RD$ ${(val || 0).toLocaleString("es-DO", { maximumFractionDigits: 0 })}`
}

function formatCompactDop(amount: number): string {
  const v = amount || 0
  if (v >= 1_000_000_000) return `RD$ ${(v / 1_000_000_000).toFixed(2)}B`
  if (v >= 1_000_000) return `RD$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `RD$ ${(v / 1_000).toFixed(1)}K`
  return `RD$ ${v.toLocaleString("es-DO", { maximumFractionDigits: 0 })}`
}

const STAGE_LABELS: Record<BidStage, string> = {
  GUARDADA: "Guardadas",
  EN_PREPARACION: "En Preparación",
  OFERTA_ENVIADA: "Oferta Enviada",
  ADJUDICADA: "Adjudicadas",
  NO_ADJUDICADA: "No Adjudicadas",
}

const STAGE_BADGE_STYLES: Record<BidStage, string> = {
  GUARDADA: "bg-surface-container-high text-on-surface-variant",
  EN_PREPARACION: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  OFERTA_ENVIADA: "bg-primary/15 text-primary",
  ADJUDICADA: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  NO_ADJUDICADA: "bg-red-500/15 text-red-700 dark:text-red-300",
}

const STAGES_ORDER: BidStage[] = [
  "GUARDADA",
  "EN_PREPARACION",
  "OFERTA_ENVIADA",
  "ADJUDICADA",
  "NO_ADJUDICADA",
]

export default function MyBidsPipelinePage() {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<"KANBAN" | "TABLE">("KANBAN")
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null)
  const [editingBid, setEditingBid] = useState<BidItem | null>(null)
  const [editStage, setEditStage] = useState<BidStage>("GUARDADA")
  const [editAmount, setEditAmount] = useState<number>(0)
  const [editPriority, setEditPriority] = useState<"ALTA" | "MEDIA" | "BAJA">("MEDIA")
  const [editNotes, setEditNotes] = useState<string>("")

  const { data, isLoading } = useB2BBids()
  const upsertMutation = useUpsertBid()
  const deleteMutation = useDeleteBid()

  const items = data?.items || []
  const kpis = data?.kpis

  const openEditModal = (bid: BidItem) => {
    setEditingBid(bid)
    setEditStage(bid.stage as BidStage)
    setEditAmount(bid.bid_amount_dop)
    setEditPriority(bid.priority as "ALTA" | "MEDIA" | "BAJA")
    setEditNotes(bid.notes || "")
  }

  const handleSaveEdit = async () => {
    if (!editingBid) return
    await upsertMutation.mutateAsync({
      process_id: editingBid.process_id,
      process_code: editingBid.process_code,
      title: editingBid.title,
      institution_name: editingBid.institution_name,
      unspsc_family: editingBid.unspsc_family,
      stage: editStage,
      priority: editPriority,
      reference_amount_dop: editingBid.reference_amount_dop,
      bid_amount_dop: Number(editAmount) || 0,
      notes: editNotes,
    })
    setEditingBid(null)
  }

  const handleQuickStageChange = async (bid: BidItem, nextStage: BidStage) => {
    await upsertMutation.mutateAsync({
      process_id: bid.process_id,
      process_code: bid.process_code,
      title: bid.title,
      institution_name: bid.institution_name,
      unspsc_family: bid.unspsc_family,
      stage: nextStage,
      priority: bid.priority,
      reference_amount_dop: bid.reference_amount_dop,
      bid_amount_dop: bid.bid_amount_dop,
      notes: bid.notes,
    })
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-on-surface">
                Mis Licitaciones y Pipeline Comercial
              </h1>
              <p className="text-xs text-on-surface-variant mt-1">
                Gestión de ofertas en preparación, montos propuestos y resultados de adjudicación de su organización.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="inline-flex bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-xl p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("KANBAN")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    viewMode === "KANBAN"
                      ? "bg-primary text-on-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Tablero</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("TABLE")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    viewMode === "TABLE"
                      ? "bg-primary text-on-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Tabla</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => navigate("/app/oportunidades")}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 transition-opacity shadow-xs shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Explorar Radar</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-28 rounded-2xl bg-surface-container-low animate-pulse border border-outline-variant/25"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-primary rounded-2xl p-5 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Procesos en Cartera
                </span>
                <div className="mt-2.5 space-y-1">
                  <p className="font-mono text-2xl font-bold text-on-surface tracking-tight">
                    {kpis?.total_tracked ?? items.length} /{" "}
                    {(data?.active_limit ?? 10) >= 999
                      ? "Ilimitados"
                      : data?.active_limit ?? 10}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Licitaciones bajo seguimiento activo
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-primary rounded-2xl p-5 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Pipeline Activo
                </span>
                <div className="mt-2.5 space-y-1">
                  <p className="font-mono text-2xl font-bold text-primary tracking-tight">
                    {formatCompactDop(kpis?.pipeline_amount_dop ?? 0)}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Guardadas, en preparación y enviadas
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-emerald-500 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Monto Adjudicado
                </span>
                <div className="mt-2.5 space-y-1">
                  <p className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {`${kpis?.awarded_count ?? 0} adjudicadas`}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Contratos ganados registrados en cartera
                  </p>
                </div>
              </div>

              <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 border-l-4 border-l-amber-500 rounded-2xl p-5 flex flex-col justify-between shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                  Tasa de Éxito Comercial
                </span>
                <div className="mt-2.5 space-y-1">
                  <p className="font-mono text-2xl font-bold text-on-surface tracking-tight">
                    {kpis?.win_rate_pct ?? 0}%
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Sobre resoluciones finalizadas
                  </p>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className="h-80 rounded-2xl bg-surface-container-low animate-pulse border border-outline-variant/25"
                />
              ))}
            </div>
          ) : viewMode === "KANBAN" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {STAGES_ORDER.map((stageKey) => {
                const colItems = items.filter((b) => b.stage === stageKey)
                const colTotal = colItems.reduce((acc, x) => acc + (x.bid_amount_dop || 0), 0)

                return (
                  <div
                    key={stageKey}
                    className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl flex flex-col min-h-[460px] shadow-xs overflow-hidden"
                  >
                    <div className="p-4 border-b border-outline-variant/25 bg-surface-container-low/50">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-on-surface">
                          {STAGE_LABELS[stageKey]}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-surface-container-high font-mono text-[11px] font-bold text-on-surface">
                          {colItems.length}
                        </span>
                      </div>
                      <p className="font-mono text-xs font-bold text-primary mt-1">
                        {formatCompactDop(colTotal)}
                      </p>
                    </div>

                    <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                      {colItems.length === 0 ? (
                        <div className="py-12 text-center text-xs text-on-surface-variant">
                          Sin procesos en esta etapa
                        </div>
                      ) : (
                        colItems.map((bid) => (
                          <div
                            key={bid.bid_id}
                            className="p-3.5 rounded-xl bg-surface-container-low/60 border border-outline-variant/25 hover:border-primary/40 transition-colors space-y-2.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedProcessId(bid.process_id)}
                                className="font-mono text-[11px] font-bold text-primary hover:underline text-left leading-tight cursor-pointer"
                              >
                                {bid.process_code}
                              </button>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                  bid.priority === "ALTA"
                                    ? "bg-red-500/15 text-red-700 dark:text-red-300"
                                    : bid.priority === "MEDIA"
                                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                                      : "bg-surface-container-high text-on-surface-variant"
                                }`}
                              >
                                {bid.priority}
                              </span>
                            </div>

                            <p className="text-xs font-semibold text-on-surface line-clamp-2 leading-snug">
                              {bid.title}
                            </p>

                            <p className="text-[11px] text-on-surface-variant truncate">
                              {bid.institution_name}
                            </p>

                            <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-xs">
                              <span className="text-[11px] text-on-surface-variant">Oferta:</span>
                              <span className="font-mono font-bold text-on-surface">
                                {formatCompactDop(bid.bid_amount_dop)}
                              </span>
                            </div>

                            {bid.notes && (
                              <p className="text-[11px] text-on-surface-variant bg-surface p-2 rounded-lg border border-outline-variant/20 line-clamp-2">
                                {bid.notes}
                              </p>
                            )}

                            <div className="pt-1 flex items-center justify-between gap-1.5">
                              <select
                                value={bid.stage}
                                onChange={(e) =>
                                  handleQuickStageChange(bid, e.target.value as BidStage)
                                }
                                aria-label="Cambiar etapa"
                                className="h-7 px-2 rounded-lg bg-surface border border-outline-variant/35 text-[11px] font-medium text-on-surface focus:outline-none focus:border-primary flex-1 min-w-0 cursor-pointer"
                              >
                                {STAGES_ORDER.map((st) => (
                                  <option key={st} value={st}>
                                    {STAGE_LABELS[st]}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => openEditModal(bid)}
                                className="p-1.5 rounded-lg bg-surface hover:bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                                title="Editar oferta y notas"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/app/simulador-precios?unspsc=${bid.unspsc_family}&amt=${bid.bid_amount_dop}`
                                  )
                                }
                                className="p-1.5 rounded-lg bg-surface hover:bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                                title="Simular precio"
                              >
                                <Calculator className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="bg-surface-container-lowest dark:bg-surface-container border border-outline-variant/35 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant/25 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h2 className="font-display text-base font-bold text-on-surface">
                    Listado Consolidado de Licitaciones en Seguimiento
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Detalle de montos de referencia, ofertas propuestas y notas privadas del equipo
                  </p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-surface-container-high text-xs font-mono font-semibold text-on-surface shrink-0">
                  {items.length} procesos
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-outline-variant/25 bg-surface-container-low/60 text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                      <th className="py-3 px-5">Proceso y Objeto</th>
                      <th className="py-3 px-5">Institución Compradora</th>
                      <th className="py-3 px-5">Etapa</th>
                      <th className="py-3 px-5 text-right">Monto Oferta</th>
                      <th className="py-3 px-5">Notas Privadas</th>
                      <th className="py-3 px-5 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20 text-xs">
                    {items.map((bid) => (
                      <tr
                        key={bid.bid_id}
                        className="hover:bg-surface-container-low/50 transition-colors"
                      >
                        <td className="py-3.5 px-5 max-w-[300px]">
                          <button
                            type="button"
                            onClick={() => setSelectedProcessId(bid.process_id)}
                            className="font-mono font-bold text-primary hover:underline text-left block cursor-pointer"
                          >
                            {bid.process_code}
                          </button>
                          <p className="font-medium text-on-surface line-clamp-1 mt-0.5">
                            {bid.title}
                          </p>
                        </td>
                        <td className="py-3.5 px-5 text-on-surface-variant max-w-[220px] truncate">
                          {bid.institution_name}
                        </td>
                        <td className="py-3.5 px-5 whitespace-nowrap">
                          <span
                            className={`inline-block text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg ${STAGE_BADGE_STYLES[bid.stage as BidStage]}`}
                          >
                            {STAGE_LABELS[bid.stage as BidStage]}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-on-surface whitespace-nowrap">
                          {formatDop(bid.bid_amount_dop)}
                        </td>
                        <td className="py-3.5 px-5 text-on-surface-variant max-w-[240px] truncate">
                          {bid.notes || "—"}
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(bid)}
                              className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedProcessId(bid.process_id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/30 text-xs font-semibold text-on-surface transition-colors cursor-pointer"
                            >
                              <span>Expediente</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteMutation.mutate(bid.bid_id)}
                              className="p-2 rounded-lg bg-surface-container-low hover:bg-red-500/15 border border-outline-variant/30 text-on-surface-variant hover:text-red-600 transition-colors cursor-pointer"
                              title="Eliminar del pipeline"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={editingBid !== null}
        onClose={() => setEditingBid(null)}
        title="Actualizar Licitación en Cartera"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditingBid(null)}
              className="px-4 py-2 rounded-xl bg-surface-container-low border border-outline-variant/35 text-xs font-semibold text-on-surface-variant hover:text-on-surface cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={upsertMutation.isPending}
              className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 cursor-pointer"
            >
              Guardar Cambios
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs font-mono text-primary">{editingBid?.process_code}</p>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Etapa del Proceso
            </label>
            <select
              value={editStage}
              onChange={(e) => setEditStage(e.target.value as BidStage)}
              className="w-full h-10 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/35 text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
            >
              {STAGES_ORDER.map((st) => (
                <option key={st} value={st}>
                  {STAGE_LABELS[st]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Monto Oferta (RD$)
              </label>
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(Number(e.target.value))}
                className="w-full h-10 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/35 text-xs font-mono font-bold text-on-surface focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                Prioridad
              </label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as "ALTA" | "MEDIA" | "BAJA")}
                className="w-full h-10 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/35 text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="ALTA">Alta</option>
                <option value="MEDIA">Media</option>
                <option value="BAJA">Baja</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Notas Estratégicas Privadas
            </label>
            <textarea
              rows={3}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant/35 text-xs text-on-surface focus:outline-none focus:border-primary"
              placeholder="Observaciones de costos, plazos de entrega o garantías..."
            />
          </div>
        </div>
      </Modal>

      {selectedProcessId !== null && (
        <ProcessInspectorDrawer
          processId={selectedProcessId}
          onClose={() => setSelectedProcessId(null)}
          onSelectAnomaly={() => {}}
        />
      )}
    </div>
  )
}
