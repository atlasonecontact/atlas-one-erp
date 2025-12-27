import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  ShoppingCart,
  Package,
  Users,
  Shield,
  TrendingUp,
  Check,
  Store,
  Bell,
  Sparkles,
  Lock,
  MessageSquare,
} from "lucide-react"
import Image from "next/image"
import type { Metadata } from "next"
import { StatCard, FeatureCard, StepCard, TestimonialCard } from "@/components/cards"

export const metadata: Metadata = {
  title: "Atlas One - ERP Inteligente para Cadenas de Kioscos",
  description:
    "Sistema completo para gestionar múltiples sucursales, empleados, inventario y recibir notificaciones de ventas en WhatsApp y Telegram. Comienza gratis.",
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0f1e] via-[#0f1729] to-[#0a0f1e] text-white">
      {/* Subtle grid background */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Ambient glow effects */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] pointer-events-none" />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="border-b border-white/5 backdrop-blur-xl bg-[#0a0f1e]/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/logo-atlas.png"
                  alt="Atlas One Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain"
                  priority
                />
                <Image
                  src="/images/nombre-atlas-horizontal.png"
                  alt="Atlas One"
                  width={120}
                  height={32}
                  className="h-8 w-auto object-contain hidden sm:block"
                  priority
                />
              </div>

              <div className="hidden md:flex items-center gap-8 text-sm">
                <Link href="#features" className="text-gray-300 hover:text-white transition-colors">
                  Características
                </Link>
                <Link href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
                  Cómo funciona
                </Link>
                <Link href="#pricing" className="text-gray-300 hover:text-white transition-colors">
                  Precios
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/5">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Button disabled className="bg-gray-600 text-gray-300 font-medium cursor-not-allowed">
                  Próximamente
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-sm mb-8">
                <Sparkles className="w-4 h-4" />
                Sistema multi-kiosko con IA y notificaciones inteligentes
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
                El sistema de gestión
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500">
                  más inteligente y completo para tu negocio
                </span>
              </h1>

              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                Gestiona múltiples sucursales, empleados con acceso seguro, inventario sincronizado y recibe
                notificaciones en WhatsApp y Telegram. Todo desde una sola plataforma.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Button
                  size="lg"
                  disabled
                  className="bg-gray-600 hover:bg-gray-600 text-gray-300 font-semibold px-8 h-12 cursor-not-allowed"
                >
                  Próximamente
                </Button>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/10 hover:bg-white/5 hover:border-white/20 h-12 px-8 bg-transparent"
                  >
                    Ver Demo en Vivo
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400" />
                  Sin tarjeta de crédito
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400" />
                  Setup en 5 minutos
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400" />
                  Soporte en español
                </div>
              </div>
            </div>

            {/* Dashboard Preview */}
            <div className="mt-20 max-w-6xl mx-auto">
              <div className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-2 shadow-2xl shadow-black/50">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="px-3 py-1 rounded-md bg-white/5 text-xs text-gray-400">app.atlasone.com.ar</div>
                  </div>
                </div>
                <div className="relative aspect-[16/9] overflow-hidden rounded-b-xl bg-[#0a0f1e]">
                  <Image
                    src="/images/3.jpg"
                    alt="Atlas One Dashboard - Panel de control para gestión de kioscos"
                    fill
                    className="object-cover object-top"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar - CHANGE: Updated to realistic stats */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-white/5 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard number="Multi-kiosko" label="Gestión centralizada" />
            <StatCard number="Tiempo real" label="Sincronización de datos" />
            <StatCard number="99.9%" label="Uptime garantizado" />
            <StatCard number="24/7" label="Soporte técnico" />
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                Todo lo que necesitas para{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  escalar tu negocio
                </span>
              </h2>
              <p className="text-lg text-gray-400">
                Una plataforma completa diseñada específicamente para cadenas de kioscos y comercios minoristas
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={<Store />}
                title="Multi-Kiosko Centralizado"
                description="Gestiona todas tus sucursales desde un único panel. Cada kiosko con su inventario, empleados y reportes independientes."
                gradient="from-cyan-500/10 to-blue-500/10"
              />
              <FeatureCard
                icon={<Users />}
                title="Gestión de Empleados"
                description="Credenciales auto-generadas por sucursal. Cada empleado registra ventas que se sincronizan en tiempo real con el dashboard del dueño."
                gradient="from-blue-500/10 to-violet-500/10"
              />
              <FeatureCard
                icon={<Bell />}
                title="Notificaciones Inteligentes"
                description="Recibe notificaciones por WhatsApp y Telegram con cada venta. Verificación de número incluida para seguridad total."
                gradient="from-violet-500/10 to-purple-500/10"
              />
              <FeatureCard
                icon={<MessageSquare />}
                title="Bots de Telegram"
                description="Consulta ventas del día, mes y productos con bajo stock directamente desde tu celular con comandos simples."
                gradient="from-purple-500/10 to-pink-500/10"
              />
              <FeatureCard
                icon={<Package />}
                title="Control de Inventario"
                description="Importa productos masivamente por CSV. Monitorea stock por kiosko y recibe alertas automáticas de reposición."
                gradient="from-pink-500/10 to-rose-500/10"
              />
              <FeatureCard
                icon={<BarChart3 />}
                title="Dashboards en Tiempo Real"
                description="Métricas individuales por sucursal y reportes consolidados de toda la cadena con gráficos interactivos."
                gradient="from-rose-500/10 to-cyan-500/10"
              />
              <FeatureCard
                icon={<ShoppingCart />}
                title="Punto de Venta Rápido"
                description="POS intuitivo optimizado para atención rápida. Las ventas de empleados aparecen al instante en tu dashboard."
                gradient="from-cyan-500/10 to-teal-500/10"
              />
              <FeatureCard
                icon={<TrendingUp />}
                title="Insights con IA"
                description="Predicciones de demanda, recomendaciones de precios y análisis de tendencias para maximizar tus ganancias."
                gradient="from-teal-500/10 to-emerald-500/10"
              />
              <FeatureCard
                icon={<Shield />}
                title="Seguridad Total"
                description="Row Level Security, credenciales únicas por empleado, verificación telefónica y encriptación end-to-end."
                gradient="from-emerald-500/10 to-cyan-500/10"
              />
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section
          id="how-it-works"
          className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white/[0.02] to-transparent"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                Comienza en <span className="text-cyan-400">3 pasos simples</span>
              </h2>
              <p className="text-lg text-gray-400">Configura tu cadena completa en menos de 10 minutos</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <StepCard
                number="01"
                title="Crea tu cuenta"
                description="Regístrate gratis y configura tu primer kiosko. Añade productos importando un CSV o manualmente."
                icon={<Lock />}
              />
              <StepCard
                number="02"
                title="Añade empleados"
                description="Genera credenciales de acceso para cada empleado. Ellos podrán registrar ventas desde su sesión individual."
                icon={<Users />}
              />
              <StepCard
                number="03"
                title="Recibe notificaciones"
                description="Conecta WhatsApp y Telegram. Cada venta te llega al instante con todos los detalles de la transacción."
                icon={<Bell />}
              />
            </div>
          </div>
        </section>

        {/* Screenshot Showcase */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-sm mb-6">
                  <BarChart3 className="w-4 h-4" />
                  Visualización en tiempo real
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold mb-4">
                  Decisiones inteligentes con{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                    datos en vivo
                  </span>
                </h3>
                <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                  Dashboards interactivos con gráficos de ventas, ranking de productos, heatmaps de horarios pico e
                  insights automáticos generados por IA.
                </p>
                <ul className="space-y-4">
                  {[
                    "Ventas en tiempo real por kiosko y empleado",
                    "Gráficos de evolución de últimos 30 días",
                    "Top 10 productos más vendidos por sucursal",
                    "Mapas de calor de horarios de mayor actividad",
                    "Predicciones de demanda con machine learning",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-3xl" />
                <div className="relative rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
                  <Image
                    src="/images/4.jpg"
                    alt="Dashboard de Atlas One con gráficos de ventas en tiempo real"
                    width={600}
                    height={400}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section
          id="pricing"
          className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent"
        >
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative">
              {/* Decorative gradient orbs */}
              <div
                className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-20 blur-3xl"
                style={{ background: "radial-gradient(circle, #00ffff 0%, transparent 70%)" }}
              />
              <div
                className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full opacity-20 blur-3xl"
                style={{ background: "radial-gradient(circle, #00ffff 0%, transparent 70%)" }}
              />

              <div className="relative z-10 backdrop-blur-sm bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-12 shadow-2xl">
                <div className="mb-8">
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                    ¿Listo para{" "}
                    <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                      transformar
                    </span>{" "}
                    tu negocio?
                  </h2>
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                    Cada negocio es único. Por eso ofrecemos planes personalizados que se adaptan exactamente a tus
                    necesidades y presupuesto.
                  </p>
                </div>

                <div className="space-y-6 mb-10">
                  <div className="flex items-center justify-center gap-3 text-gray-300">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="text-lg">Sin contratos a largo plazo</span>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-gray-300">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="text-lg">Implementación incluida</span>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-gray-300">
                    <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span className="text-lg">Soporte técnico dedicado</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button asChild size="lg" className="group relative overflow-hidden px-8 py-6 text-lg font-semibold">
                    <a
                      href="mailto:contacto@atlasone.com"
                      className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                    >
                      <span className="relative z-10">Contactanos y cotiza tu plan</span>
                      <svg
                        className="w-5 h-5 transition-transform group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </a>
                  </Button>

                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="px-8 py-6 text-lg border-white/20 hover:bg-white/5 text-white bg-transparent"
                  >
                    <a href="https://wa.me/5491112345678" target="_blank" rel="noopener noreferrer">
                      WhatsApp
                    </a>
                  </Button>
                </div>

                <p className="mt-8 text-sm text-gray-400">
                  Respuesta en menos de 24 horas • Presupuesto sin compromiso
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof - CHANGE: Updated to generic testimonials */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                Diseñado para <span className="text-cyan-400">dueños como vos</span>
              </h2>
              <p className="text-lg text-gray-400">Funcionalidades pensadas para el día a día del comercio minorista</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <TestimonialCard
                quote="Gestión centralizada de múltiples sucursales sin tener que estar físicamente en cada una. Todo sincronizado en tiempo real."
                author="Control Total"
                role="Multi-sucursal"
                rating={5}
              />
              <TestimonialCard
                quote="Las notificaciones de WhatsApp permiten saber exactamente qué vende cada empleado sin estar físicamente en la sucursal."
                author="Visibilidad 24/7"
                role="Notificaciones"
                rating={5}
              />
              <TestimonialCard
                quote="El bot de Telegram permite consultar ventas del día con un simple comando desde el celular. Súper práctico y rápido."
                author="Acceso Móvil"
                role="Bot Telegram"
                rating={5}
              />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 p-12 text-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.1),transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.1),transparent_50%)]" />
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">Transforma tu cadena hoy</h2>
                <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
                  Comienza a gestionar tus kioscos de forma inteligente con Atlas One. Configuración rápida y soporte en
                  español.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    size="lg"
                    disabled
                    className="bg-gray-600 hover:bg-gray-600 text-gray-300 font-semibold px-8 h-12 cursor-not-allowed"
                  >
                    Próximamente
                  </Button>
                  <Link href="/login">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/20 hover:bg-white/5 hover:border-white/30 h-12 px-8 bg-transparent"
                    >
                      Probar Demo
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <Image src="/images/logo-atlas.png" alt="Atlas One" width={32} height={32} className="w-8 h-8" />
                <span className="font-semibold">Atlas One</span>
              </div>
              <div className="flex items-center gap-8 text-sm text-gray-400">
                <Link href="#features" className="hover:text-white transition-colors">
                  Características
                </Link>
                <Link href="#pricing" className="hover:text-white transition-colors">
                  Precios
                </Link>
                <Link href="/login" className="hover:text-white transition-colors">
                  Iniciar Sesión
                </Link>
              </div>
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Atlas One. Todos los derechos reservados.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
