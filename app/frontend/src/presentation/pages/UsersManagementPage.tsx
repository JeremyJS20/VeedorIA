import { useState, useMemo, type FormEvent } from "react"
import {
  Users,
  Building2,
  UserPlus,
  Unlock,
  KeyRound,
  Power,
  Search,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
} from "lucide-react"
import {
  useUsersList,
  useTenantsList,
  useRolesMatrix,
  useCreateUser,
  useUpdateUser,
  useUnlockUser,
  useGenerateResetLink,
  useCreateTenant,
  useUpdateTenant,
} from "../hooks/useAuthManagement"

export default function UsersManagementPage() {
  const [buscar, setBuscar] = useState("")
  const [rolFilter, setRolFilter] = useState("")
  const [tenantFilter, setTenantFilter] = useState("")
  const [estadoFilter, setEstadoFilter] = useState("")
  const [activeTab, setActiveTab] = useState<"usuarios" | "tenants">("usuarios")

  const { data: allUsers = [], isLoading: loadingUsers } = useUsersList()
  const { data: tenants = [], isLoading: loadingTenants } = useTenantsList()
  const { data: rolesData } = useRolesMatrix()

  const users = useMemo(() => {
    return allUsers.filter((u) => {
      if (buscar) {
        const q = buscar.toLowerCase()
        const match =
          u.nombre.toLowerCase().includes(q) ||
          u.correo.toLowerCase().includes(q) ||
          (u.cargo || "").toLowerCase().includes(q)
        if (!match) return false
      }
      if (rolFilter && String(u.rol.id) !== rolFilter) return false
      if (tenantFilter && String(u.tenant.id) !== tenantFilter) return false
      if (estadoFilter === "BLOQUEADO" && !u.bloqueado) return false
      if (estadoFilter === "ACTIVO" && (u.estado !== "ACTIVO" || u.bloqueado)) return false
      if (estadoFilter === "INACTIVO" && u.estado !== "INACTIVO") return false
      return true
    })
  }, [allUsers, buscar, rolFilter, tenantFilter, estadoFilter])

  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUser()
  const unlockUserMutation = useUnlockUser()
  const resetLinkMutation = useGenerateResetLink()
  const createTenantMutation = useCreateTenant()
  const updateTenantMutation = useUpdateTenant()

  const [showNewUserModal, setShowNewUserModal] = useState(false)
  const [showNewTenantModal, setShowNewTenantModal] = useState(false)
  const [bannerMsg, setBannerMsg] = useState<{ type: "ok" | "err"; text: string; url?: string } | null>(null)

  const [newUser, setNewUser] = useState({
    nombre: "",
    correo: "",
    password: "VeedorIA2026!",
    role_id: "",
    tenant_id: "",
    cargo: "",
  })

  const [newTenant, setNewTenant] = useState({
    codigo: "",
    nombre: "",
    tipo: "GOV_INSTITUTION",
    plan_tier: "B2G_PREMIUM",
    institution_id: "",
    supplier_rpe: "",
  })

  const handleCreateUser = async (e: FormEvent) => {
    e.preventDefault()
    setBannerMsg(null)
    try {
      await createUserMutation.mutateAsync({
        nombre: newUser.nombre,
        correo: newUser.correo,
        password: newUser.password,
        role_id: Number(newUser.role_id || rolesData?.roles[0]?.id || 1),
        tenant_id: Number(newUser.tenant_id || tenants[0]?.id || 1),
        cargo: newUser.cargo || undefined,
      })
      setShowNewUserModal(false)
      setNewUser({
        nombre: "",
        correo: "",
        password: "VeedorIA2026!",
        role_id: "",
        tenant_id: "",
        cargo: "",
      })
      setBannerMsg({ type: "ok", text: "Usuario institucional creado correctamente." })
    } catch (err) {
      setBannerMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Error al crear el usuario.",
      })
    }
  }

  const handleCreateTenant = async (e: FormEvent) => {
    e.preventDefault()
    setBannerMsg(null)
    try {
      await createTenantMutation.mutateAsync({
        codigo: newTenant.codigo,
        nombre: newTenant.nombre,
        tipo: newTenant.tipo,
        plan_tier: newTenant.plan_tier,
        institution_id: newTenant.institution_id ? Number(newTenant.institution_id) : null,
        supplier_rpe: newTenant.supplier_rpe || null,
      })
      setShowNewTenantModal(false)
      setNewTenant({
        codigo: "",
        nombre: "",
        tipo: "GOV_INSTITUTION",
        plan_tier: "B2G_PREMIUM",
        institution_id: "",
        supplier_rpe: "",
      })
      setBannerMsg({ type: "ok", text: "Organización (Tenant SaaS) registrada correctamente." })
    } catch (err) {
      setBannerMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Error al crear la organización.",
      })
    }
  }

  const handleToggleUserStatus = async (userId: number, currentEstado: "ACTIVO" | "INACTIVO") => {
    setBannerMsg(null)
    const nextEstado = currentEstado === "ACTIVO" ? "INACTIVO" : "ACTIVO"
    try {
      await updateUserMutation.mutateAsync({ userId, payload: { estado: nextEstado } })
      setBannerMsg({
        type: "ok",
        text: nextEstado === "ACTIVO" ? "Cuenta de usuario reactivada." : "Cuenta de usuario desactivada.",
      })
    } catch (err) {
      setBannerMsg({ type: "err", text: err instanceof Error ? err.message : "Error al actualizar." })
    }
  }

  const handleUnlock = async (userId: number) => {
    setBannerMsg(null)
    try {
      await unlockUserMutation.mutateAsync(userId)
      setBannerMsg({ type: "ok", text: "Cuenta desbloqueada y contador de intentos reiniciado a 0." })
    } catch (err) {
      setBannerMsg({ type: "err", text: err instanceof Error ? err.message : "Error al desbloquear." })
    }
  }

  const handleResetLink = async (userId: number, email: string) => {
    setBannerMsg(null)
    try {
      const res = await resetLinkMutation.mutateAsync(userId)
      setBannerMsg({
        type: "ok",
        text: `Enlace temporal de recuperación generado para ${email} (válido por ${res.expira_en_minutos} min):`,
        url: res.reset_url,
      })
    } catch (err) {
      setBannerMsg({
        type: "err",
        text: err instanceof Error ? err.message : "Error al generar enlace.",
      })
    }
  }
  return (
    <div className="p-6 sm:p-8 max-w-[80rem] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-primary">
            Administración Multi-Tenant SaaS
          </span>
          <h1 className="text-2xl font-bold text-on-surface mt-1">
            Gestión de Usuarios y Organizaciones Suscriptoras
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Administra usuarios institucionales, asigna roles RBAC, desbloquea cuentas y gestiona los Tenants B2G / B2B.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowNewTenantModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-outline-variant/40 text-xs font-semibold text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-primary" />
            Nueva Organización (Tenant)
          </button>
          <button
            type="button"
            onClick={() => setShowNewUserModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:opacity-95 transition-opacity shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Nuevo Usuario
          </button>
        </div>
      </div>

      {bannerMsg && (
        <div
          className={`flex items-start justify-between gap-3 p-4 rounded-xl border text-xs ${
            bannerMsg.type === "ok"
              ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300"
              : "bg-error/10 border-error/30 text-error"
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold">
              {bannerMsg.type === "ok" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{bannerMsg.text}</span>
            </div>
            {bannerMsg.url && (
              <a
                href={bannerMsg.url}
                className="inline-block font-mono underline text-primary break-all"
              >
                {bannerMsg.url}
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={() => setBannerMsg(null)}
            className="text-xs underline opacity-75 hover:opacity-100 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("usuarios")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "usuarios"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          <Users className="w-4 h-4" />
          Usuarios Registrados ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("tenants")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === "tenants"
              ? "bg-primary text-on-primary"
              : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          <Building2 className="w-4 h-4" />
          Organizaciones / Tenants SaaS ({tenants.length})
        </button>
      </div>

      {activeTab === "usuarios" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-surface border border-outline-variant/30 rounded-2xl p-4">
            <div className="relative">
              <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={buscar}
                onChange={(e) => setBuscar(e.target.value)}
                placeholder="Buscar nombre, correo o cargo..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface"
              />
            </div>

            <select
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface"
              aria-label="Filtrar por Organización Tenant"
            >
              <option value="">Todas las Organizaciones (Tenants)</option>
              {tenants.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.codigo} — {t.nombre}
                </option>
              ))}
            </select>

            <select
              value={rolFilter}
              onChange={(e) => setRolFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface"
              aria-label="Filtrar por Rol"
            >
              <option value="">Todos los Roles RBAC</option>
              {rolesData?.roles.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.nombre}
                </option>
              ))}
            </select>

            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface"
              aria-label="Filtrar por Estado"
            >
              <option value="">Todos los Estados</option>
              <option value="ACTIVO">Activos</option>
              <option value="INACTIVO">Inactivos</option>
              <option value="BLOQUEADO">Bloqueados por intentos</option>
            </select>
          </div>

          <div className="bg-surface border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden">
            {loadingUsers ? (
              <div className="p-8 text-xs font-mono text-on-surface-variant">Cargando usuarios...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant uppercase font-mono text-[11px]">
                      <th className="py-3 px-4">Usuario / Correo</th>
                      <th className="py-3 px-4">Organización (Tenant SaaS)</th>
                      <th className="py-3 px-4">Rol RBAC</th>
                      <th className="py-3 px-4">Cargo</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Acciones Administrativas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/15">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-surface-container-low/40 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-bold text-on-surface">{u.nombre}</p>
                          <p className="font-mono text-[11px] text-on-surface-variant">{u.correo}</p>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <span className="font-semibold text-on-surface block">{u.tenant.nombre}</span>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary inline-block mt-0.5">
                              {u.tenant.codigo} · {u.tenant.plan_tier}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={u.rol.id}
                            onChange={(e) =>
                              updateUserMutation.mutate({
                                userId: u.id,
                                payload: { role_id: Number(e.target.value) },
                              })
                            }
                            aria-label={`Cambiar rol de ${u.nombre}`}
                            className="px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/30 text-xs font-semibold text-on-surface"
                          >
                            {rolesData?.roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.nombre}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-on-surface">{u.cargo}</p>
                        </td>
                        <td className="py-3 px-4">
                          {u.bloqueado ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-error/15 text-error">
                              BLOQUEADO ({u.intentos_fallidos} int.)
                            </span>
                          ) : u.estado === "ACTIVO" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/15 text-green-600 dark:text-green-400">
                              ACTIVO
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container-high text-on-surface-variant">
                              INACTIVO
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {(u.bloqueado || u.intentos_fallidos > 0) && (
                              <button
                                type="button"
                                onClick={() => handleUnlock(u.id)}
                                title="Desbloquear cuenta"
                                className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 cursor-pointer"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleResetLink(u.id, u.correo)}
                              title="Generar enlace de restablecimiento de contraseña"
                              className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(u.id, u.estado)}
                              title={u.estado === "ACTIVO" ? "Desactivar cuenta" : "Activar cuenta"}
                              className={`p-1.5 rounded-lg cursor-pointer ${
                                u.estado === "ACTIVO"
                                  ? "bg-error/10 text-error hover:bg-error/20"
                                  : "bg-green-500/15 text-green-600 hover:bg-green-500/25"
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-surface border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden">
          {loadingTenants ? (
            <div className="p-8 text-xs font-mono text-on-surface-variant">Cargando organizaciones...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant/20 text-on-surface-variant uppercase font-mono text-[11px]">
                    <th className="py-3 px-4">Código / Organización</th>
                    <th className="py-3 px-4">Segmento</th>
                    <th className="py-3 px-4">Plan SaaS</th>
                    <th className="py-3 px-4">Vínculo de Aislamiento</th>
                    <th className="py-3 px-4">Usuarios Activos</th>
                    <th className="py-3 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/15">
                  {tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-surface-container-low/40">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-primary block">{t.codigo}</span>
                        <span className="font-semibold text-on-surface">{t.nombre}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">{t.tipo}</td>
                      <td className="py-3 px-4">
                        <select
                          value={t.plan_tier}
                          onChange={(e) =>
                            updateTenantMutation.mutate({
                              tenantId: t.id,
                              payload: { plan_tier: e.target.value },
                            })
                          }
                          aria-label={`Cambiar plan SaaS de ${t.nombre}`}
                          className="px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/30 text-xs font-mono font-bold text-primary"
                        >
                          <option value="PLATFORM_GLOBAL">PLATFORM_GLOBAL</option>
                          <option value="B2G_BASIC">B2G_BASIC</option>
                          <option value="B2G_PREMIUM">B2G_PREMIUM</option>
                          <option value="B2G_ENTERPRISE">B2G_ENTERPRISE</option>
                          <option value="B2B_PYME">B2B_PYME</option>
                          <option value="B2B_CORPORATE">B2B_CORPORATE</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {t.institution_id
                          ? `Institution ID #${t.institution_id}`
                          : t.supplier_rpe
                            ? `Proveedor RPE #${t.supplier_rpe}`
                            : "Alcance Nacional (Global)"}
                      </td>
                      <td className="py-3 px-4 font-mono">{t.usuarios_count ?? 0} usuarios</td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() =>
                            updateTenantMutation.mutate({
                              tenantId: t.id,
                              payload: {
                                estado: t.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO",
                              },
                            })
                          }
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                            t.estado === "ACTIVO"
                              ? "bg-green-500/15 text-green-600 dark:text-green-400"
                              : "bg-error/15 text-error"
                          }`}
                        >
                          {t.estado}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {showNewUserModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant/40 rounded-2xl max-w-[32rem] w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-on-surface">Registrar Nuevo Usuario Institucional</h2>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={newUser.nombre}
                  onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Correo Institucional</label>
                <input
                  type="email"
                  required
                  value={newUser.correo}
                  onChange={(e) => setNewUser({ ...newUser, correo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Organización (Tenant SaaS)</label>
                  <select
                    value={newUser.tenant_id || String(tenants[0]?.id ?? "")}
                    onChange={(e) => setNewUser({ ...newUser, tenant_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40"
                  >
                    {tenants.map((t) => (
                      <option key={t.id} value={String(t.id)}>
                        {t.codigo} — {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Rol RBAC</label>
                  <select
                    value={newUser.role_id || String(rolesData?.roles[0]?.id ?? "")}
                    onChange={(e) => setNewUser({ ...newUser, role_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40"
                  >
                    {rolesData?.roles.map((r) => (
                      <option key={r.id} value={String(r.id)}>
                        {r.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Cargo Institucional</label>
                <input
                  type="text"
                  value={newUser.cargo}
                  onChange={(e) => setNewUser({ ...newUser, cargo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Contraseña Temporal</label>
                <input
                  type="text"
                  required
                  minLength={8}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewUserModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary font-semibold cursor-pointer"
                >
                  {createUserMutation.isPending ? "Creando..." : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewTenantModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant/40 rounded-2xl max-w-[32rem] w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-on-surface">
              Registrar Nueva Organización Suscriptora (Tenant)
            </h2>
            <form onSubmit={handleCreateTenant} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Código Único (ej. MISPAS-B2G)</label>
                  <input
                    type="text"
                    required
                    value={newTenant.codigo}
                    onChange={(e) => setNewTenant({ ...newTenant, codigo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Segmento</label>
                  <select
                    value={newTenant.tipo}
                    onChange={(e) => setNewTenant({ ...newTenant, tipo: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40"
                  >
                    <option value="GOV_INSTITUTION">GOV_INSTITUTION (Ministerio B2G)</option>
                    <option value="GOV_OVERSIGHT">GOV_OVERSIGHT (Ente Rector)</option>
                    <option value="B2B_SUPPLIER">B2B_SUPPLIER (Proveedor B2B)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Nombre de la Institución o Empresa</label>
                <input
                  type="text"
                  required
                  value={newTenant.nombre}
                  onChange={(e) => setNewTenant({ ...newTenant, nombre: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Plan de Suscripción SaaS</label>
                <select
                  value={newTenant.plan_tier}
                  onChange={(e) => setNewTenant({ ...newTenant, plan_tier: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 font-mono"
                >
                  <option value="B2G_BASIC">B2G_BASIC</option>
                  <option value="B2G_PREMIUM">B2G_PREMIUM</option>
                  <option value="B2G_ENTERPRISE">B2G_ENTERPRISE</option>
                  <option value="B2B_PYME">B2B_PYME</option>
                  <option value="B2B_CORPORATE">B2B_CORPORATE</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">
                    Institution ID (Opcional, ej. 5=MOPC, 88=MINERD)
                  </label>
                  <input
                    type="number"
                    value={newTenant.institution_id}
                    onChange={(e) => setNewTenant({ ...newTenant, institution_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">RPE Proveedor (Opcional B2B)</label>
                  <input
                    type="text"
                    value={newTenant.supplier_rpe}
                    onChange={(e) => setNewTenant({ ...newTenant, supplier_rpe: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewTenantModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface-container text-on-surface font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createTenantMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary font-semibold cursor-pointer"
                >
                  {createTenantMutation.isPending ? "Guardando..." : "Crear Organización"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}