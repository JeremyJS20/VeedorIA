import { useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  LifeBuoy,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Ticket,
} from "lucide-react"
import {
  useAdminTicket,
  useAdminTickets,
  useCreateTicket,
  useMyTickets,
  useServicesHealth,
  useUpdateTicket,
} from "../hooks/useAdminOps"
import type { HealthStatus, SupportTicket } from "../hooks/useAdminOps"
import StatusChip, { type StatusTone } from "../components/ui/StatusChip"
import Modal from "../components/ui/Modal"
import Drawer from "../components/ui/Drawer"

const HEALTH_LABELS: Record<string, string> = {
  OK: "Operativo",
  DEGRADED: "Degradado",
  DOWN: "Caído",
}

const TICKET_LABELS: Record<string, string> = {
  ABIERTO: "Abierto",
  EN_PROGRESO: "En progreso",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
}

function healthTone(status: HealthStatus): StatusTone {
  if (status === "OK") return "success"
  if (status === "DEGRADED") return "warning"
  if (status === "DOWN") return "danger"
  return "neutral"
}

function ticketTone(status: string): StatusTone {
  if (status === "ABIERTO") return "info"
  if (status === "EN_PROGRESO") return "warning"
  if (status === "RESUELTO") return "success"
  return "neutral"
}

const CATEGORIES = [
  { value: "SOPORTE_FUNCIONAL", label: "Soporte funcional" },
  { value: "ERROR_TECNICO", label: "Error técnico" },
  { value: "SOLICITUD_DATOS", label: "Solicitud de datos" },
  { value: "FACTURACION", label: "Facturación" },
]

const MODULES = [
  { value: "SINCRONIZACION", label: "Sincronización" },
  { value: "CALIBRACION", label: "Calibración" },
  { value: "BITACORA", label: "Bitácora" },
  { value: "DETECCION", label: "Detección" },
  { value: "ACCESOS", label: "Accesos y roles" },
  { value: "OTRO", label: "Otro" },
]

const PRIORITIES = [
  { value: "ALTA", label: "Alta" },
  { value: "MEDIA", label: "Media" },
  { value: "BAJA", label: "Baja" },
]

const KNOWLEDGE_BASE = [
  {
    module: "Sincronización",
    items: [
      {
        question: "¿Qué significa que el estado sea server_restart?",
        answer:
          "La corrida estaba en ejecución cuando el servidor se reinició. El sistema la marca como fallida y debes relanzarla manualmente desde la consola de sincronización.",
      },
      {
        question: "¿Por qué el botón de sincronizar está deshabilitado?",
        answer:
          "Puede existir una corrida en curso (solo se permite una a la vez) o Redis/worker no están disponibles. Revisa el panel de salud de servicios.",
      },
    ],
  },
  {
    module: "Calibración",
    items: [
      {
        question: "¿Cómo se calcula el umbral recomendado?",
        answer:
          "Se evalúa una rejilla de umbrales sobre las anomalías ya dictaminadas (CONFIRMED/DISMISSED) y se elige el mayor F1. Aplicarlo requiere confirmación y queda auditado.",
      },
      {
        question: "¿Re-ejecutar la detección borra los dictámenes?",
        answer:
          "No. Las anomalías confirmadas o descartadas conservan su estado y su revisor tras cualquier re-ejecución.",
      },
    ],
  },
  {
    module: "Bitácora",
    items: [
      {
        question: "¿Puedo editar o borrar una entrada?",
        answer:
          "No. La bitácora es append-only y la API no expone escritura. Solo puedes consultar y exportar.",
      },
      {
        question: "¿Qué contiene una exportación?",
        answer:
          "Todas las filas que cumplen el filtro (hasta 10,000), en CSV o JSON, con el checksum SHA-256 en la cabecera X-Checksum-SHA256.",
      },
    ],
  },
  {
    module: "Detección",
    items: [
      {
        question: "¿Cuándo se ejecuta el motor automáticamente?",
        answer:
          "El job programado diario dispara la detección. También puedes ejecutarla manualmente desde la consola de calibración.",
      },
    ],
  },
  {
    module: "Accesos",
    items: [
      {
        question: "¿Quién puede acceder a esta consola?",
        answer:
          "Solo usuarios con rol PLATFORM_ADMIN. Cualquier otro rol recibe 403 en los endpoints /api/admin/*.",
      },
    ],
  },
]

function formatDateTime(value: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function StatusPill({ status }: { status: HealthStatus }) {
  return <StatusChip tone={healthTone(status)} label={HEALTH_LABELS[status] ?? status} />
}

export default function SupportCenterPage() {
  const health = useServicesHealth()
  const myTickets = useMyTickets()
  const createTicket = useCreateTicket()
  const updateTicket = useUpdateTicket()

  const [ticketFilters, setTicketFilters] = useState<{ status?: string; category?: string; q?: string }>({})
  const adminTickets = useAdminTickets(ticketFilters)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const selected = useAdminTicket(selectedId)

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    subject: "",
    category: "SOPORTE_FUNCIONAL",
    module: "OTRO",
    priority: "MEDIA",
    description: "",
  })
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [statusDraft, setStatusDraft] = useState("")
  const [assigneeDraft, setAssigneeDraft] = useState("")
  const [replyDraft, setReplyDraft] = useState("")

  const openTicket = (ticket: SupportTicket) => {
    setSelectedId(ticket.id)
    setStatusDraft(ticket.status)
    setAssigneeDraft(ticket.assigned_to_id ? String(ticket.assigned_to_id) : "")
    setReplyDraft("")
    setFeedback(null)
  }

  const submitCreate = async () => {
    setFeedback(null)
    try {
      const ticket = await createTicket.mutateAsync(form)
      setCreateOpen(false)
      setForm({ subject: "", category: "SOPORTE_FUNCIONAL", module: "OTRO", priority: "MEDIA", description: "" })
      setFeedback({ type: "success", text: `Ticket ${ticket.code} creado correctamente.` })
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "No fue posible crear el ticket.",
      })
    }
  }

  const submitUpdate = async () => {
    if (!selected.data) return
    setFeedback(null)
    const payload: { status?: string; assigned_to_id?: number; reply?: string } = {}
    if (statusDraft && statusDraft !== selected.data.status) payload.status = statusDraft
    if (assigneeDraft && Number(assigneeDraft) !== selected.data.assigned_to_id) {
      payload.assigned_to_id = Number(assigneeDraft)
    }
    if (replyDraft.trim()) payload.reply = replyDraft.trim()
    if (Object.keys(payload).length === 0) {
      setFeedback({ type: "error", text: "No hay cambios para guardar." })
      return
    }
    try {
      const updated = await updateTicket.mutateAsync({ id: selected.data.id, payload })
      setSelectedId(updated.id)
      setStatusDraft(updated.status)
      setAssigneeDraft(updated.assigned_to_id ? String(updated.assigned_to_id) : "")
      setReplyDraft("")
      setFeedback({ type: "success", text: `Ticket ${updated.code} actualizado y auditado.` })
    } catch (err) {
      setFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "No fue posible actualizar el ticket.",
      })
    }
  }

  const componentSummary = useMemo(() => {
    const components = health.data?.components ?? []
    const down = components.filter((component) => component.status === "DOWN").length
    const degraded = components.filter((component) => component.status === "DEGRADED").length
    return { total: components.length, down, degraded }
  }, [health.data])

  return (
    <div className="p-6 sm:p-8 max-w-[85rem] mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-on-surface">Centro de Soporte y Estado de Servicios</h1>
          <p className="text-xs text-on-surface-variant mt-1 max-w-3xl">
            Salud operativa de la plataforma, base de conocimiento por módulo y gestión de tickets internos de
            soporte.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-on-primary text-xs font-bold"
        >
          <Plus className="w-4 h-4" />
          Nuevo ticket
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-2 text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-500/10 border-rose-500/25 text-rose-800 dark:text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Salud */}
      <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-on-surface">Estado de servicios</h2>
            {(componentSummary.down > 0 || componentSummary.degraded > 0) && (
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                {componentSummary.down} caído(s) · {componentSummary.degraded} degradado(s)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-on-surface-variant">
              {health.data ? formatDateTime(health.data.checked_at) : "—"}
            </span>
            <button
              type="button"
              onClick={() => health.refetch()}
              disabled={health.isFetching}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-outline-variant/35 text-[11px] font-semibold text-on-surface-variant hover:text-primary disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${health.isFetching ? "animate-spin" : ""}`} />
              Verificar
            </button>
          </div>
        </div>

        <div className="p-5">
          {health.isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-24 rounded-xl bg-surface-container-high animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {(health.data?.components ?? []).map((component) => (
                <div
                  key={component.key}
                  className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container-high/40 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-on-surface">{component.label}</span>
                    <StatusPill status={component.status} />
                  </div>
                  <p className="text-[11px] text-on-surface-variant line-clamp-3">{component.detail}</p>
                  <span className="text-[10px] font-mono text-outline">
                    {component.latency_ms} ms · {component.key}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Mis tickets */}
      <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center gap-2">
          <Ticket className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-on-surface">Mis tickets</h2>
        </div>
        {(myTickets.data?.length ?? 0) === 0 ? (
          <p className="p-6 text-xs text-on-surface-variant">
            No has registrado tickets todavía. Usa "Nuevo ticket" para abrir uno.
          </p>
        ) : (
          <div className="divide-y divide-outline-variant/15">
            {myTickets.data?.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => openTicket(ticket)}
                className="w-full text-left px-5 py-3 hover:bg-surface-container-high/40 transition-colors flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-primary font-bold">{ticket.code}</span>
                    <span className="text-xs font-semibold text-on-surface truncate">{ticket.subject}</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    {ticket.module} · {formatDateTime(ticket.created_at)}
                  </p>
                </div>
                <StatusChip
                  tone={ticketTone(ticket.status)}
                  label={TICKET_LABELS[ticket.status] ?? ticket.status}
                  className="shrink-0"
                />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Bandeja administrativa */}
      <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold text-on-surface">Bandeja de soporte</h2>
            <span className="text-[11px] font-mono text-on-surface-variant">
              {adminTickets.data?.total ?? 0} tickets
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={ticketFilters.status ?? ""}
              onChange={(event) =>
                setTicketFilters((current) => ({ ...current, status: event.target.value || undefined }))
              }
              className="h-9 px-2.5 rounded-xl border border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container text-[11px] text-on-surface"
            >
              <option value="">Todos los estados</option>
              {["ABIERTO", "EN_PROGRESO", "RESUELTO", "CERRADO"].map((value) => (
                <option key={value} value={value}>
                  {value.replace("_", " ")}
                </option>
              ))}
            </select>
            <select
              value={ticketFilters.category ?? ""}
              onChange={(event) =>
                setTicketFilters((current) => ({ ...current, category: event.target.value || undefined }))
              }
              className="h-9 px-2.5 rounded-xl border border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container text-[11px] text-on-surface"
            >
              <option value="">Todas las categorías</option>
              {CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {adminTickets.isLoading ? (
          <div className="p-5 space-y-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-10 rounded-xl bg-surface-container-high animate-pulse" />
            ))}
          </div>
        ) : (adminTickets.data?.items?.length ?? 0) === 0 ? (
          <p className="p-6 text-xs text-on-surface-variant">No hay tickets en la bandeja con estos filtros.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-on-surface-variant bg-surface-container-high/60">
                  <th className="px-4 py-2.5 font-bold">Código</th>
                  <th className="px-4 py-2.5 font-bold">Asunto</th>
                  <th className="px-4 py-2.5 font-bold">Módulo</th>
                  <th className="px-4 py-2.5 font-bold">Prioridad</th>
                  <th className="px-4 py-2.5 font-bold">Estado</th>
                  <th className="px-4 py-2.5 font-bold">Creado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15">
                {adminTickets.data?.items?.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => openTicket(ticket)}
                    className="hover:bg-surface-container-high/40 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono text-[11px] text-primary font-bold">{ticket.code}</td>
                    <td className="px-4 py-3 text-on-surface max-w-[22rem] truncate">{ticket.subject}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{ticket.module}</td>
                    <td className="px-4 py-3 text-on-surface-variant">{ticket.priority}</td>
                    <td className="px-4 py-3">
                      <StatusChip
                        tone={ticketTone(ticket.status)}
                        label={TICKET_LABELS[ticket.status] ?? ticket.status}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-on-surface-variant">
                      {formatDateTime(ticket.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Base de conocimiento */}
      <section className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-bold text-on-surface">Base de conocimiento</h2>
        </div>
        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-3">
          {KNOWLEDGE_BASE.map((section) => (
            <div key={section.module} className="rounded-xl border border-outline-variant/25 p-4 space-y-2">
              <h3 className="text-xs font-bold text-on-surface">{section.module}</h3>
              {section.items.map((item) => (
                <details key={item.question} className="group">
                  <summary className="flex items-center justify-between gap-2 cursor-pointer text-[11px] font-semibold text-on-surface-variant hover:text-primary">
                    {item.question}
                    <ChevronDown className="w-3.5 h-3.5 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-1.5 text-[11px] text-on-surface-variant leading-relaxed">{item.answer}</p>
                </details>
              ))}
            </div>
          ))}
        </div>
      </section>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nuevo ticket de soporte"
        footer={
          <>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="h-9 px-3 rounded-xl border border-outline-variant/35 text-[11px] font-semibold text-on-surface-variant"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={submitCreate}
              disabled={createTicket.isPending}
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl bg-primary text-on-primary text-[11px] font-bold disabled:opacity-40"
            >
              {createTicket.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Enviar ticket
            </button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          <label className="space-y-1.5 block">
            <span className="font-bold text-on-surface">Asunto</span>
            <input
              value={form.subject}
              onChange={(event) => setForm({ ...form, subject: event.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container text-on-surface"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5 block">
              <span className="font-bold text-on-surface">Categoría</span>
              <select
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                className="w-full h-10 px-2.5 rounded-xl border border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container text-on-surface"
              >
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5 block">
              <span className="font-bold text-on-surface">Módulo</span>
              <select
                value={form.module}
                onChange={(event) => setForm({ ...form, module: event.target.value })}
                className="w-full h-10 px-2.5 rounded-xl border border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container text-on-surface"
              >
                {MODULES.map((module) => (
                  <option key={module.value} value={module.value}>
                    {module.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="space-y-1.5 block">
            <span className="font-bold text-on-surface">Prioridad</span>
            <select
              value={form.priority}
              onChange={(event) => setForm({ ...form, priority: event.target.value })}
              className="w-full h-10 px-2.5 rounded-xl border border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container text-on-surface"
            >
              {PRIORITIES.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 block">
            <span className="font-bold text-on-surface">Descripción</span>
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container text-on-surface resize-none"
            />
          </label>
        </div>
      </Modal>

      <Drawer
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
        title={selected.data?.subject ?? "Cargando ticket…"}
        subtitle={`${selected.data?.code ?? "—"} · ${formatDateTime(selected.data?.created_at ?? null)}`}
      >
        {selected.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 rounded-xl bg-surface-container-high animate-pulse" />
            ))}
          </div>
        ) : selected.data ? (
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-2 gap-3 text-[11px]">
              {[
                { label: "Estado", value: selected.data.status.replace("_", " ") },
                { label: "Prioridad", value: selected.data.priority },
                { label: "Módulo", value: selected.data.module },
                { label: "Categoría", value: selected.data.category },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-outline-variant/25 p-3">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-outline">
                    {item.label}
                  </span>
                  <span className="text-on-surface">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-outline-variant/25 p-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-outline mb-1">
                Descripción
              </span>
              <p className="text-[11px] text-on-surface whitespace-pre-wrap">{selected.data.description}</p>
            </div>

            <div className="space-y-2">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-outline">
                Conversación ({selected.data.messages.length})
              </h4>
              {selected.data.messages.length === 0 ? (
                <p className="text-[11px] text-on-surface-variant">Sin respuestas registradas.</p>
              ) : (
                <div className="space-y-2">
                  {selected.data.messages.map((message) => (
                    <div
                      key={message.id}
                      className="rounded-xl border border-outline-variant/25 bg-surface-container-high/40 p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-on-surface-variant">
                        <span>Usuario #{message.author_id}</span>
                        <span>{formatDateTime(message.created_at)}</span>
                      </div>
                      <p className="text-[11px] text-on-surface whitespace-pre-wrap">{message.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3 border-t border-outline-variant/20 pt-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5 block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Estado</span>
                  <select
                    value={statusDraft}
                    onChange={(event) => setStatusDraft(event.target.value)}
                    className="w-full h-9 px-2.5 rounded-xl border border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container text-[11px] text-on-surface"
                  >
                    {["ABIERTO", "EN_PROGRESO", "RESUELTO", "CERRADO"].map((value) => (
                      <option key={value} value={value}>
                        {value.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5 block">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
                    Asignado a (ID de usuario)
                  </span>
                  <input
                    value={assigneeDraft}
                    onChange={(event) => setAssigneeDraft(event.target.value)}
                    placeholder="6"
                    className="w-full h-9 px-2.5 rounded-xl border border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container font-mono text-[11px] text-on-surface"
                  />
                </label>
              </div>

              <label className="space-y-1.5 block">
                <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Respuesta</span>
                <textarea
                  rows={3}
                  value={replyDraft}
                  onChange={(event) => setReplyDraft(event.target.value)}
                  disabled={selected.data.status === "CERRADO"}
                  placeholder={
                    selected.data.status === "CERRADO"
                      ? "El ticket está cerrado: reábrelo cambiando el estado para responder."
                      : "Escribe una respuesta para el solicitante…"
                  }
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant/35 bg-surface-container-lowest dark:bg-surface-container text-[11px] text-on-surface resize-none disabled:opacity-50"
                />
              </label>

              <button
                type="button"
                onClick={submitUpdate}
                disabled={updateTicket.isPending}
                className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl bg-primary text-on-primary text-[11px] font-bold disabled:opacity-40"
              >
                {updateTicket.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Guardar cambios
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-rose-600 dark:text-rose-400">No fue posible cargar el ticket.</p>
        )}
      </Drawer>
    </div>
  )
}
