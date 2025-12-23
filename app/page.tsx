import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  ShoppingCart,
  Package,
  Users,
  Shield,
  TrendingUp,
  Star,
  Check,
  Store,
  Bell,
  ArrowRight,
  Sparkles,
  Lock,
  MessageSquare,
} from "lucide-react"
import Image from "next/image"
import type { Metadata } from "next"

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
                  Caracteristicas
                </Link>
                <Link href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
                  Como funciona
                </Link>
                <Link href="#pricing" className="text-gray-300 hover:text-white transition-colors">
                  Precios
                </Link>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/5">
                    Iniciar Sesion
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-medium">Comenzar Gratis</Button>
                </Link>
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
                El ERP completo para
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500">
                  cadenas de kioscos
                </span>
              </h1>

              <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                Gestiona multiples sucursales, empleados con acceso seguro, inventario sincronizado y recibe
                notificaciones en WhatsApp y Telegram. Todo desde una sola plataforma.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                <Link href="/register">
                  <Button size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 h-12 group">
                    Empezar Gratis
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
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
                  Sin tarjeta de credito
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400" />
                  Setup en 5 minutos
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-cyan-400" />
                  Soporte en espanol
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
                    alt="Atlas One Dashboard - Panel de control para gestion de kioscos"
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
            <StatCard number="Multi-kiosko" label="Gestion centralizada" />
            <StatCard number="Tiempo real" label="Sincronizacion de datos" />
            <StatCard number="99.9%" label="Uptime garantizado" />
            <StatCard number="24/7" label="Soporte tecnico" />
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
                Una plataforma completa disenada especificamente para cadenas de kioscos y comercios minoristas
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <FeatureCard
                icon={<Store />}
                title="Multi-Kiosko Centralizado"
                description="Gestiona todas tus sucursales desde un unico panel. Cada kiosko con su inventario, empleados y reportes independientes."
                gradient="from-cyan-500/10 to-blue-500/10"
              />
              <FeatureCard
                icon={<Users />}
                title="Gestion de Empleados"
                description="Credenciales auto-generadas por sucursal. Cada empleado registra ventas que se sincronizan en tiempo real con el dashboard del dueno."
                gradient="from-blue-500/10 to-violet-500/10"
              />
              <FeatureCard
                icon={<Bell />}
                title="Notificaciones Inteligentes"
                description="Recibe notificaciones por WhatsApp y Telegram con cada venta. Verificacion de numero incluida para seguridad total."
                gradient="from-violet-500/10 to-purple-500/10"
              />
              <FeatureCard
                icon={<MessageSquare />}
                title="Bots de Telegram"
                description="Consulta ventas del dia, mes y productos con bajo stock directamente desde tu celular con comandos simples."
                gradient="from-purple-500/10 to-pink-500/10"
              />
              <FeatureCard
                icon={<Package />}
                title="Control de Inventario"
                description="Importa productos masivamente por CSV. Monitorea stock por kiosko y recibe alertas automaticas de reposicion."
                gradient="from-pink-500/10 to-rose-500/10"
              />
              <FeatureCard
                icon={<BarChart3 />}
                title="Dashboards en Tiempo Real"
                description="Metricas individuales por sucursal y reportes consolidados de toda la cadena con graficos interactivos."
                gradient="from-rose-500/10 to-cyan-500/10"
              />
              <FeatureCard
                icon={<ShoppingCart />}
                title="Punto de Venta Rapido"
                description="POS intuitivo optimizado para atencion rapida. Las ventas de empleados aparecen al instante en tu dashboard."
                gradient="from-cyan-500/10 to-teal-500/10"
              />
              <FeatureCard
                icon={<TrendingUp />}
                title="Insights con IA"
                description="Predicciones de demanda, recomendaciones de precios y analisis de tendencias para maximizar tus ganancias."
                gradient="from-teal-500/10 to-emerald-500/10"
              />
              <FeatureCard
                icon={<Shield />}
                title="Seguridad Total"
                description="Row Level Security, credenciales unicas por empleado, verificacion telefonica y encriptacion end-to-end."
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
                description="Registrate gratis y configura tu primer kiosko. Anade productos importando un CSV o manualmente."
                icon={<Lock />}
              />
              <StepCard
                number="02"
                title="Anade empleados"
                description="Genera credenciales de acceso para cada empleado. Ellos podran registrar ventas desde su sesion individual."
                icon={<Users />}
              />
              <StepCard
                number="03"
                title="Recibe notificaciones"
                description="Conecta WhatsApp y Telegram. Cada venta te llega al instante con todos los detalles de la transaccion."
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
                  Visualizacion en tiempo real
                </div>
                <h3 className="text-3xl sm:text-4xl font-bold mb-4">
                  Decisiones inteligentes con{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                    datos en vivo
                  </span>
                </h3>
                <p className="text-lg text-gray-400 mb-8 leading-relaxed">
                  Dashboards interactivos con graficos de ventas, ranking de productos, heatmaps de horarios pico e
                  insights automaticos generados por IA.
                </p>
                <ul className="space-y-4">
                  {[
                    "Ventas en tiempo real por kiosko y empleado",
                    "Graficos de evolucion de ultimos 30 dias",
                    "Top 10 productos mas vendidos por sucursal",
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
                    alt="Dashboard de Atlas One con graficos de ventas en tiempo real"
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
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                Planes que <span className="text-cyan-400">crecen contigo</span>
              </h2>
              <p className="text-lg text-gray-400">Comienza gratis. Escala cuando lo necesites. Sin sorpresas.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <PricingCard
                name="Basico"
                price="Gratis"
                period="siempre"
                description="Perfecto para empezar"
                features={["1 kiosco", "2 empleados", "50 productos", "Reportes basicos", "Soporte por email"]}
              />
              <PricingCard
                name="Profesional"
                price="$29.99"
                period="mes"
                description="Para negocios en crecimiento"
                features={[
                  "Hasta 5 kioscos",
                  "10 empleados por kiosko",
                  "500 productos",
                  "Reportes avanzados",
                  "WhatsApp + Telegram",
                  "Bots de mensajeria",
                  "Soporte prioritario",
                ]}
                popular
              />
              <PricingCard
                name="Empresarial"
                price="$99.99"
                period="mes"
                description="Para cadenas grandes"
                features={[
                  "Kioscos ilimitados",
                  "50 empleados por kiosko",
                  "5000 productos",
                  "Reportes premium + IA",
                  "Todas las integraciones",
                  "API personalizada",
                  "Soporte 24/7 dedicado",
                  "Onboarding personalizado",
                ]}
              />
            </div>
          </div>
        </section>

        {/* Social Proof - CHANGE: Updated to generic testimonials */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                Disenado para <span className="text-cyan-400">duenos como vos</span>
              </h2>
              <p className="text-lg text-gray-400">Funcionalidades pensadas para el dia a dia del comercio minorista</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <TestimonialCard
                quote="Gestion centralizada de multiples sucursales sin tener que estar fisicamente en cada una. Todo sincronizado en tiempo real."
                author="Control Total"
                role="Multi-sucursal"
                rating={5}
              />
              <TestimonialCard
                quote="Las notificaciones de WhatsApp permiten saber exactamente que vende cada empleado sin estar fisicamente en la sucursal."
                author="Visibilidad 24/7"
                role="Notificaciones"
                rating={5}
              />
              <TestimonialCard
                quote="El bot de Telegram permite consultar ventas del dia con un simple comando desde el celular. Super practico y rapido."
                author="Acceso Movil"
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
                  Comienza a gestionar tus kioscos de forma inteligente con Atlas One. Configuracion rapida y soporte en
                  espanol.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/register">
                    <Button size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 h-12">
                      Crear Cuenta Gratis
                    </Button>
                  </Link>
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
                  Caracteristicas
                </Link>
                <Link href="#pricing" className="hover:text-white transition-colors">
                  Precios
                </Link>
                <Link href="/login" className="hover:text-white transition-colors">
                  Iniciar Sesion
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

// Component definitions
function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-1">
        {number}
      </div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
}) {
  return (
    <div
      className={`group relative rounded-2xl border border-white/5 bg-gradient-to-br ${gradient} p-6 hover:border-white/10 transition-all duration-300`}
    >
      <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-4 text-cyan-400 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </div>
  )
}

function StepCard({
  number,
  title,
  description,
  icon,
}: {
  number: string
  title: string
  description: string
  icon: React.ReactNode
}) {
  return (
    <div className="relative">
      <div className="text-7xl font-bold text-white/5 absolute -top-4 -left-2">{number}</div>
      <div className="relative pt-8">
        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-4 text-cyan-400">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function PricingCard({
  name,
  price,
  period,
  description,
  features,
  popular,
}: {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  popular?: boolean
}) {
  return (
    <div
      className={`relative rounded-2xl border ${popular ? "border-cyan-500/50 bg-gradient-to-b from-cyan-500/10 to-transparent" : "border-white/10 bg-white/[0.02]"} p-8`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyan-500 text-black text-xs font-medium">
          Mas Popular
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-1">{name}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <div className="mb-6">
        <span className="text-4xl font-bold">{price}</span>
        <span className="text-gray-400">/{period}</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3">
            <Check className="w-5 h-5 text-cyan-400 shrink-0" />
            <span className="text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
      <Link href="/register" className="block">
        <Button
          className={`w-full ${popular ? "bg-cyan-500 hover:bg-cyan-400 text-black" : "bg-white/5 hover:bg-white/10"}`}
        >
          Comenzar
        </Button>
      </Link>
    </div>
  )
}

function TestimonialCard({
  quote,
  author,
  role,
  rating,
}: {
  quote: string
  author: string
  role: string
  rating: number
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
      <div className="flex items-center gap-1 mb-4">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
        ))}
      </div>
      <p className="text-gray-300 mb-6 leading-relaxed">{`"${quote}"`}</p>
      <div>
        <p className="font-semibold">{author}</p>
        <p className="text-sm text-gray-400">{role}</p>
      </div>
    </div>
  )
}
