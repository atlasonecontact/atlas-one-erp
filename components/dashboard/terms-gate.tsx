"use client"

import { useEffect, useState } from "react"
import { ShieldCheck, ChevronDown, ChevronUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// Versión de los términos vigente. Si el texto cambia de forma relevante, subí este
// valor: a todos los usuarios que ya aceptaron una versión anterior se les vuelve a
// mostrar la cajita.
const TERMS_VERSION = "2026-09-29"

export function TermsGate() {
  const [userId, setUserId] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [checked, setChecked] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    const check = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || cancelled) return

      const { data: profile, error: selectError } = await supabase
        .from("profiles")
        .select("terms_accepted_at, terms_version")
        .eq("id", user.id)
        .maybeSingle()
      if (cancelled) return

      if (selectError) {
        console.error("[TermsGate] No se pudo leer profiles.terms_accepted_at:", selectError)
      }

      if (!profile?.terms_accepted_at || profile.terms_version !== TERMS_VERSION) {
        setUserId(user.id)
        setVisible(true)
      }
    }

    check()
    return () => {
      cancelled = true
    }
  }, [])

  const accept = async () => {
    if (!checked || !userId) return
    setSaving(true)
    setError("")
    const supabase = createClient()
    const { error: updError } = await supabase
      .from("profiles")
      .update({ terms_accepted_at: new Date().toISOString(), terms_version: TERMS_VERSION })
      .eq("id", userId)
    setSaving(false)
    if (updError) {
      console.error("[TermsGate] No se pudo guardar la aceptación:", updError)
      const missingColumn = updError.message?.toLowerCase().includes("column")
      setError(
        missingColumn
          ? "Falta aplicar la migración de base de datos (script 220_profiles_terms_acceptance.sql) antes de poder guardar esto."
          : `No pudimos guardar tu aceptación: ${updError.message || "error desconocido"}`,
      )
      return
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-cyan-500/20 bg-[#0a0f1a] p-6 shadow-2xl sm:p-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15">
            <ShieldCheck className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Términos y Condiciones</h2>
            <p className="text-xs text-gray-400">Antes de seguir usando Atlas One, aceptalos</p>
          </div>
        </div>

        <p className="mb-3 text-sm text-gray-300">
          Para usar Atlas One necesitamos que leas y aceptes nuestros Términos y Condiciones. Podés abrir el texto
          completo acá abajo.
        </p>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mb-3 flex items-center gap-1 self-start text-xs font-medium text-cyan-400 hover:text-cyan-300"
        >
          {expanded ? (
            <>
              Ocultar el texto completo <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              Leer el texto completo <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>

        {expanded && (
          <div className="mb-4 flex-1 overflow-y-auto whitespace-pre-line rounded-lg border border-white/10 bg-black/30 p-4 text-xs leading-relaxed text-gray-400">
            {TERMS_TEXT}
          </div>
        )}

        <label className="mb-4 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-cyan-500"
          />
          <span className="text-sm text-gray-300">
            Leí y acepto los{" "}
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300"
            >
              Términos y Condiciones
            </button>{" "}
            de uso de Atlas One.
          </span>
        </label>

        {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

        <button
          type="button"
          disabled={!checked || saving}
          onClick={accept}
          className="h-11 w-full rounded-lg bg-cyan-500 font-semibold text-black transition-colors hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-gray-500"
        >
          {saving ? "Guardando..." : "Aceptar y continuar"}
        </button>
      </div>
    </div>
  )
}

const TERMS_TEXT = `Última actualización: 29 de septiembre de 2026

1. Aceptación de estos términos
Al crear una cuenta y usar Atlas One estás aceptando estos Términos y Condiciones en su totalidad. Si no estás de acuerdo, no debés usar el servicio. Si usás Atlas One en representación de un comercio, declarás tener las facultades para obligarlo a estos términos.

2. Qué es Atlas One
Atlas One es un software de gestión (punto de venta, stock, caja, compras, empleados y estadísticas) provisto como servicio en la nube ("SaaS"), pensado para kioscos y comercios. Es una herramienta de gestión: no somos un estudio contable, impositivo ni legal, y no reemplazamos el asesoramiento de un profesional matriculado.

3. Tu cuenta
Sos responsable de mantener la confidencialidad de tu usuario y contraseña, y de toda la actividad que ocurra en tu cuenta y en las cuentas de los empleados que vos crees dentro de ella. Si sospechás un uso no autorizado, avisanos apenas puedas. La información de registro que nos das (nombre, email, datos del negocio) tiene que ser real y la tenés que mantener actualizada.

4. Uso permitido
Te comprometés a usar Atlas One de forma lícita, y a no intentar vulnerar su seguridad, sobrecargar la infraestructura, copiar o revender el software, ni cargar contenido ilegal, engañoso o que infrinja derechos de terceros.

5. Tus datos
Los datos que cargás en Atlas One (productos, ventas, clientes, empleados, etc.) son tuyos. Los usamos únicamente para prestarte el servicio, mostrártelos a vos y hacer que la plataforma funcione (por ejemplo, mediante proveedores de infraestructura como Supabase y Vercel). No vendemos tus datos a terceros. Sos responsable de la exactitud de la información que cargás y de cumplir con la normativa de protección de datos personales que te corresponda como comercio (por ejemplo, respecto de tus clientes y empleados).

6. Facturación electrónica y cumplimiento fiscal
Atlas One puede ayudarte a emitir comprobantes electrónicos y a llevar tus registros de ventas, stock y caja. Sos el único responsable de que tu actividad comercial, tus comprobantes y tus obligaciones impositivas cumplan con la normativa vigente (ARCA/AFIP y las que correspondan). No garantizamos que el uso del software por sí solo te haga cumplir con tus obligaciones fiscales, y te recomendamos validar esos aspectos con tu contador.

7. Disponibilidad del servicio
Hacemos nuestro mejor esfuerzo para que Atlas One esté disponible de forma continua, pero al ser un servicio en la nube puede haber interrupciones, mantenimientos o fallas de terceros (proveedores de hosting, internet, pagos, etc.) que están fuera de nuestro control. No garantizamos disponibilidad del 100% ni un funcionamiento libre de errores.

8. Planes y pagos
El uso de Atlas One puede estar sujeto a un plan pago según lo informado en la plataforma. Los precios pueden actualizarse, avisándote con anticipación razonable. La falta de pago puede derivar en la suspensión o baja de tu cuenta.

9. Limitación de responsabilidad
En la máxima medida permitida por la ley, Atlas One se provee "tal cual" ("as is"), sin garantías de ningún tipo. No somos responsables por pérdidas de ventas, de datos, lucro cesante, ni por decisiones comerciales que tomes en base a la información que el sistema te muestra, ni por fallas de terceros (proveedores de pago, de hosting, de conectividad, u organismos como ARCA/AFIP). Nuestra responsabilidad total frente a vos, si existiera, se limita al monto que hayas pagado por el servicio en los últimos 3 meses.

10. Propiedad intelectual
El software, el diseño, la marca "Atlas One" y todo el contenido de la plataforma (salvo tus propios datos) son de nuestra propiedad o de nuestros licenciantes. No se te transfiere ningún derecho sobre ellos más que el uso del servicio conforme a estos términos.

11. Suspensión y baja de cuenta
Podemos suspender o dar de baja tu cuenta si incumplís estos términos, por falta de pago, o por uso indebido de la plataforma. Vos podés dar de baja tu cuenta cuando quieras. En ambos casos, vas a poder solicitar una exportación razonable de tus datos dentro de un plazo prudencial luego de la baja.

12. Cambios en estos términos
Podemos actualizar estos Términos y Condiciones. Si el cambio es relevante, te lo vamos a volver a pedir que aceptes antes de seguir usando la plataforma, como en este mismo paso.

13. Ley aplicable y jurisdicción
Estos términos se rigen por las leyes de la República Argentina. Cualquier controversia se someterá a los tribunales ordinarios competentes, con renuncia a cualquier otro fuero o jurisdicción.

14. Contacto
Por consultas sobre estos términos podés escribirnos a atlasonecontact@gmail.com.`
