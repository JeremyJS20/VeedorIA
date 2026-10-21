import { useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import {
  Building2,
  KeyRound,
  Briefcase,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  Search,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
} from "lucide-react"
import AuthShell from "../components/auth/AuthShell"
import Button from "../components/ui/Button"
import { useAuth } from "../context/AuthContext"
import {
  useInvitationInfo,
  usePublicSuppliersSearch,
  useRegisterAccount,
  type PublicSupplierItem,
} from "../hooks/useAuthManagement"

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setSession } = useAuth()

  const initialCode = (searchParams.get("code") || "").trim().toUpperCase()
  const [step, setStep] = useState<1 | 2 | 3>(() => (initialCode ? 2 : 1))
  const [modo, setModo] = useState<"INVITATION" | "NEW_COMPANY">(() =>
    initialCode ? "INVITATION" : "INVITATION",
  )
  const [codigoInvitacion, setCodigoInvitacion] = useState(initialCode || "MOPC-B2G")

  // User fields
  const [nombre, setNombre] = useState("")
  const [correo, setCorreo] = useState("")
  const [cargo, setCargo] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  // Company fields (Path B)
  const [supplierQuery, setSupplierQuery] = useState("")
  const [manualCompanyMode, setManualCompanyMode] = useState(false)
  const [empresaNombre, setEmpresaNombre] = useState("")
  const [empresaRpe, setEmpresaRpe] = useState("")
  const [empresaRnc, setEmpresaRnc] = useState("")
  const [planTier, setPlanTier] = useState<"B2B_PYME" | "B2B_CORPORATE">("B2B_CORPORATE")

  const [formError, setFormError] = useState<string | null>(null)

  const invitationQuery = useInvitationInfo(modo === "INVITATION" ? codigoInvitacion : null)
  const suppliersSearch = usePublicSuppliersSearch(
    supplierQuery,
    step === 2 && modo === "NEW_COMPANY" && !manualCompanyMode,
  )
  const registerMutation = useRegisterAccount()

  const handleSelectSupplier = (sup: PublicSupplierItem) => {
    setEmpresaNombre(sup.nombre)
    setEmpresaRpe(sup.rpe)
    setEmpresaRnc(sup.rnc || "")
  }

  const handleStep2Continue = (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (nombre.trim().length < 2) {
      setFormError("Ingrese su nombre y apellido completos.")
      return
    }
    if (!correo.includes("@")) {
      setFormError("Ingrese un correo electrónico válido.")
      return
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      setFormError("La contraseña debe tener al menos 8 caracteres, una letra mayúscula y un número.")
      return
    }
    if (modo === "INVITATION" && (!invitationQuery.data || invitationQuery.isError)) {
      setFormError("Verifique que el código de invitación sea válido antes de continuar.")
      return
    }
    if (modo === "NEW_COMPANY" && empresaNombre.trim().length < 3) {
      setFormError("Seleccione su empresa del catálogo de proveedores o ingrese su razón social.")
      return
    }
    setStep(3)
  }

  const handleFinalActivation = async () => {
    setFormError(null)
    try {
      const result = await registerMutation.mutateAsync({
        modo,
        codigo_invitacion: modo === "INVITATION" ? codigoInvitacion.trim().toUpperCase() : null,
        nombre: nombre.trim(),
        correo: correo.trim().toLowerCase(),
        cargo: cargo.trim() || undefined,
        password,
        empresa_nombre: modo === "NEW_COMPANY" ? empresaNombre.trim() : null,
        empresa_rpe: modo === "NEW_COMPANY" ? empresaRpe.trim() || null : null,
        empresa_rnc: modo === "NEW_COMPANY" ? empresaRnc.trim() || null : null,
        plan_tier: modo === "NEW_COMPANY" ? planTier : undefined,
      })
      setSession(result.access_token, result.user)
      navigate("/app/dashboard", { replace: true })
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "No fue posible completar el registro de la cuenta.",
      )
    }
  }

  const shellTitle =
    step === 1
      ? "Crear Cuenta en VeedorIA"
      : step === 2
        ? modo === "INVITATION"
          ? "Registro por Invitación"
          : "Registro de Empresa Proveedora"
        : "Confirmación y Activación"

  const shellSubtitle =
    step === 1
      ? "Selecciona cómo deseas incorporar tu cuenta a la plataforma"
      : step === 2
        ? "Configura tus credenciales personales y verifica los datos de tu organización"
        : "Verifica el resumen de tu cuenta antes de activar el acceso inmediato"

  const shellIcon =
    step === 1 ? (
      <UserPlus className="w-5 h-5" />
    ) : modo === "INVITATION" ? (
      <KeyRound className="w-5 h-5" />
    ) : (
      <Building2 className="w-5 h-5" />
    )

  const stepperHeader = (
    <div className="flex items-center justify-between px-2">
      {[
        { num: 1, label: "Modalidad" },
        { num: 2, label: "Datos y Organización" },
        { num: 3, label: "Activación" },
      ].map((item, idx) => {
        const active = step === item.num
        const done = step > item.num
        return (
          <div key={item.num} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                active
                  ? "bg-primary text-on-primary shadow-sm"
                  : done
                    ? "bg-emerald-600 text-white"
                    : "bg-surface-container-high text-on-surface-variant"
              }`}
            >
              {done ? "✓" : item.num}
            </div>
            <span
              className={`text-xs font-semibold ${
                active ? "text-on-surface" : "text-on-surface-variant"
              }`}
            >
              {item.label}
            </span>
            {idx < 2 && <div className="w-6 sm:w-12 h-px bg-outline-variant/40 ml-1" />}
          </div>
        )
      })}
    </div>
  )

  return (
    <AuthShell
      title={shellTitle}
      subtitle={shellSubtitle}
      icon={shellIcon}
      maxWidthClass={step === 1 ? "max-w-[450px]" : "max-w-[560px]"}
      topSlot={stepperHeader}
    >
      <div className="space-y-5">
        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3.5 rounded-xl bg-error-container text-on-error-container text-xs font-medium"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {/* STEP 1: PATH SELECTION */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Path A Card */}
            <div className="p-4 rounded-2xl border border-outline-variant/40 bg-surface-container-low/60 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-sm font-bold text-on-surface">
                    Tengo un Código de Invitación
                  </h2>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Únete a una institución pública u organización que ya cuenta con suscripción activa.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={codigoInvitacion}
                  onChange={(e) => setCodigoInvitacion(e.target.value.toUpperCase())}
                  placeholder="Ej. MOPC-B2G"
                  className="flex-1 h-11 px-3.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    setModo("INVITATION")
                    setFormError(null)
                    setStep(2)
                  }}
                  className="px-4 h-11 rounded-xl bg-primary text-on-primary text-xs font-semibold cursor-pointer"
                >
                  Continuar
                </button>
              </div>
            </div>

            {/* Path B Card */}
            <div className="p-4 rounded-2xl border border-outline-variant/40 bg-surface-container-low/60 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-sm font-bold text-on-surface">
                    Registrar mi Empresa Proveedora
                  </h2>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Crea la cuenta de tu empresa vinculando tu registro de proveedor del Estado o ingresando tus datos comerciales.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModo("NEW_COMPANY")
                  setFormError(null)
                  setStep(2)
                }}
                className="w-full h-11 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary hover:text-on-primary text-primary text-xs font-semibold transition-colors cursor-pointer"
              >
                Configurar Cuenta de Empresa Proveedora
              </button>
            </div>

            <div className="pt-3 border-t border-outline-variant/25 space-y-2.5 text-center">
              <p className="text-[13px] text-on-surface-variant">
                ¿Ya tienes una cuenta activa?{" "}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Iniciar sesión
                </Link>
              </p>
              <Link
                to="/public"
                className="inline-flex items-center justify-center gap-1.5 label-md text-on-surface-variant hover:text-primary transition-colors"
              >
                <span>O CONTINUAR COMO CIUDADANO (Acceso libre sin registro)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* STEP 2: ACCOUNT & ORGANIZATION DETAILS */}
        {step === 2 && (
          <form onSubmit={handleStep2Continue} className="space-y-5">
            <div className="flex items-center justify-between pb-1 border-b border-outline-variant/25">
              <span className="text-xs font-semibold text-on-surface-variant">
                Paso 2 de 3 · Datos de acceso y organización
              </span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cambiar modalidad</span>
              </button>
            </div>

            {modo === "INVITATION" ? (
              <div className="p-4 rounded-xl bg-surface-container-low dark:bg-surface-container border border-outline-variant/35 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Organización Invitante
                  </span>
                  <span className="font-mono text-xs font-bold text-primary">
                    {codigoInvitacion}
                  </span>
                </div>
                {invitationQuery.isLoading ? (
                  <p className="text-xs text-on-surface-variant">Validando código...</p>
                ) : invitationQuery.data ? (
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-on-surface">
                      {invitationQuery.data.nombre}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {invitationQuery.data.tipo_etiqueta} · {invitationQuery.data.plan_etiqueta} · Rol:{" "}
                      <span className="font-semibold text-on-surface">
                        {invitationQuery.data.rol_asignado}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-error font-medium">
                      El código {codigoInvitacion} no es válido. Ingrese un código activo (ej. MOPC-B2G):
                    </p>
                    <input
                      type="text"
                      value={codigoInvitacion}
                      onChange={(e) => setCodigoInvitacion(e.target.value.toUpperCase())}
                      className="w-full h-10 px-3 rounded-lg border border-outline-variant text-xs font-mono"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface-container-low dark:bg-surface-container border border-outline-variant/35 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span>Datos de la Empresa Proveedora</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setManualCompanyMode(!manualCompanyMode)}
                    className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                  >
                    {manualCompanyMode
                      ? "Buscar en el catálogo oficial de proveedores"
                      : "Mi empresa es nueva — Ingresar manualmente"}
                  </button>
                </div>

                {!manualCompanyMode ? (
                  <div className="space-y-2.5">
                    <div className="relative">
                      <Search className="w-4 h-4 text-outline absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={supplierQuery}
                        onChange={(e) => setSupplierQuery(e.target.value)}
                        placeholder="Buscar en 4,462 proveedores por razón social, RPE o RNC..."
                        className="w-full h-11 pl-9 pr-3 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary"
                      />
                    </div>

                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {(suppliersSearch.data || []).slice(0, 5).map((sup) => {
                        const selected = empresaRpe === sup.rpe && empresaNombre === sup.nombre
                        return (
                          <button
                            key={`${sup.rpe}-${sup.nombre}`}
                            type="button"
                            onClick={() => handleSelectSupplier(sup)}
                            className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-colors flex items-center justify-between cursor-pointer ${
                              selected
                                ? "border-primary bg-primary/10 text-on-surface"
                                : "border-outline-variant/30 bg-surface-container-lowest dark:bg-surface-container hover:border-primary/50"
                            }`}
                          >
                            <div className="truncate pr-2">
                              <p className="font-semibold text-on-surface truncate">{sup.nombre}</p>
                              <p className="text-[11px] font-mono text-on-surface-variant">
                                RPE #{sup.rpe} · {sup.total_contratos} contratos adjudicados
                              </p>
                            </div>
                            {selected && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                          </button>
                        )
                      })}
                    </div>

                    {empresaNombre && (
                      <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center justify-between">
                        <span className="font-semibold text-on-surface truncate">
                          Seleccionada: {empresaNombre} (RPE #{empresaRpe})
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                        Razón Social de la Empresa
                      </label>
                      <input
                        type="text"
                        value={empresaNombre}
                        onChange={(e) => setEmpresaNombre(e.target.value)}
                        placeholder="Ej. Suministros Médicos del Este SRL"
                        className="w-full h-11 px-3 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                        Número de RPE (Opcional)
                      </label>
                      <input
                        type="text"
                        value={empresaRpe}
                        onChange={(e) => setEmpresaRpe(e.target.value)}
                        placeholder="Ej. 99412"
                        className="w-full h-11 px-3 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                        RNC Mercantil
                      </label>
                      <input
                        type="text"
                        value={empresaRnc}
                        onChange={(e) => setEmpresaRnc(e.target.value)}
                        placeholder="Ej. 131-99420-1"
                        className="w-full h-11 px-3 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Plan Selector */}
                <div className="pt-2 space-y-2">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Seleccione el Plan de Servicio Comercial
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        id: "B2B_PYME" as const,
                        title: "Plan Proveedor Pyme",
                        price: "RD$ 2,900 / mes",
                        desc: "Hasta 3 rubros UNSPSC y 12 meses de historial de precios.",
                      },
                      {
                        id: "B2B_CORPORATE" as const,
                        title: "Plan Proveedor Corporativo",
                        price: "RD$ 8,500 / mes",
                        desc: "Rubros ilimitados, cuota de competidores y rango óptimo de precios.",
                      },
                    ].map((p) => {
                      const active = planTier === p.id
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPlanTier(p.id)}
                          className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                            active
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-outline-variant/40 bg-surface-container-lowest dark:bg-surface-container"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-on-surface">{p.title}</span>
                            <span className="font-mono text-[11px] font-bold text-primary">
                              {p.price}
                            </span>
                          </div>
                          <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">
                            {p.desc}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Personal Credentials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="reg-nombre"
                  className="block label-md text-on-surface-variant mb-1.5"
                >
                  Nombre Completo
                </label>
                <input
                  id="reg-nombre"
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Laura Méndez"
                  className="w-full h-12 px-3.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label
                  htmlFor="reg-cargo"
                  className="block label-md text-on-surface-variant mb-1.5"
                >
                  Cargo o Función
                </label>
                <input
                  id="reg-cargo"
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ej. Analista de Contrataciones"
                  className="w-full h-12 px-3.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label
                  htmlFor="reg-correo"
                  className="block label-md text-on-surface-variant mb-1.5"
                >
                  Correo Institucional
                </label>
                <input
                  id="reg-correo"
                  type="email"
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="usuario@organizacion.do"
                  className="w-full h-12 px-3.5 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label
                  htmlFor="reg-password"
                  className="block label-md text-on-surface-variant mb-1.5"
                >
                  Contraseña Segura
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mín. 8 caracteres, 1 mayús. y 1 núm."
                    className="w-full h-12 pl-3.5 pr-10 rounded-xl bg-surface-container-lowest dark:bg-surface-container border border-outline-variant text-sm text-on-surface focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" fullWidth className="uppercase tracking-wider text-xs cursor-pointer">
              Continuar al Paso de Activación
            </Button>
          </form>
        )}

        {/* STEP 3: CONFIRMATION & ACTIVATION */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-1 border-b border-outline-variant/25">
              <span className="text-xs font-semibold text-on-surface-variant">
                Paso 3 de 3 · Resumen de activación
              </span>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Editar datos</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-surface-container-low dark:bg-surface-container border border-outline-variant/35 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Titular de la cuenta</span>
                <span className="font-semibold text-on-surface">{nombre}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Correo de acceso</span>
                <span className="font-mono text-on-surface">{correo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Organización</span>
                <span className="font-semibold text-on-surface">
                  {modo === "INVITATION"
                    ? invitationQuery.data?.nombre || codigoInvitacion
                    : empresaNombre}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Plan de Servicio</span>
                <span className="font-semibold text-primary">
                  {modo === "INVITATION"
                    ? invitationQuery.data?.plan_etiqueta
                    : planTier === "B2B_CORPORATE"
                      ? "Plan Proveedor Corporativo"
                      : "Plan Proveedor Pyme"}
                </span>
              </div>
            </div>

            {modo === "NEW_COMPANY" && (
              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/25 text-xs text-on-surface-variant flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>
                  Activación inmediata en modalidad de demostración: su organización quedará habilitada al instante con código de invitación propio para su equipo.
                </span>
              </div>
            )}

            <Button
              type="button"
              isDisabled={registerMutation.isPending}
              onClick={handleFinalActivation}
              variant="primary"
              size="lg"
              fullWidth
              className="uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>
                {registerMutation.isPending
                  ? "ACTIVANDO CUENTA Y ORGANIZACIÓN..."
                  : "ACTIVAR CUENTA E INGRESAR A LA CONSOLA"}
              </span>
            </Button>
          </div>
        )}
      </div>
    </AuthShell>
  )
}
