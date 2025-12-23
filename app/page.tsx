import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  ShoppingCart,
  Package,
  Users,
  Shield,
  TrendingUp,
  Clock,
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
                  alt="Atlas One"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-contain"
                />
                <Image
                  src="/images/nombre-atlas-horizontal.png"
                  alt="Atlas One"
                  width={120}
                  height={32}
                  className="h-8 w-auto object-contain"
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
                Gestiona múltiples sucursales, empleados con acceso seguro, inventario sincronizado y recibe
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

              <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
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
                    <div className="px-3 py-1 rounded-md bg-white/5 text-xs text-gray-400">dashboard.atlasone.com</div>
                  </div>
                </div>
                <div className="relative aspect-[16/9] overflow-hidden rounded-b-xl bg-[#0a0f1e]">
                  <Image
                    src="/images/3.jpg"
                    alt="Atlas One Dashboard"
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

        {/* Stats Bar */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-white/5 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatCard number="500+" label="Kioscos activos" />
            <StatCard number="$2M+" label="En ventas procesadas" />
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
                description="Registrate gratis y configura tu primer kiosko. Añade productos importando un CSV o manualmente."
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
                  <Image src="/images/4.jpg" alt="Dashboard con gráficos" width={600} height={400} className="w-full" />
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
                name="Básico"
                price="Gratis"
                period="siempre"
                description="Perfecto para empezar"
                features={["1 kiosco", "2 empleados", "50 productos", "Reportes básicos", "Soporte por email"]}
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
                  "Bots de mensajería",
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

        {/* Social Proof */}
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl sm:text-5xl font-bold mb-4">
                Confiado por <span className="text-cyan-400">cientos de dueños</span>
              </h2>
              <p className="text-lg text-gray-400">Lee lo que dicen quienes ya transformaron sus cadenas</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <TestimonialCard
                quote="Pasé de 1 a 7 kioscos en un año. Atlas One me dio el control que necesitaba sin volverme loco con papeles y hojas de cálculo."
                author="María González"
                role="Kioscos Express"
                rating={5}
              />
              <TestimonialCard
                quote="Las notificaciones de WhatsApp son increíbles. Sé exactamente qué vende cada empleado sin estar físicamente en la sucursal."
                author="Carlos Rodríguez"
                role="Cadena La Esquina"
                rating={5}
              />
              <TestimonialCard
                quote="El bot de Telegram es mi favorito. Escribo /ventas desde mi celular y me dice cuánto vendí hoy. Súper rápido."
                author="Ana Martínez"
                role="Minimarket Norte"
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
                  Únete a cientos de dueños que ya gestionan sus kioscos de forma inteligente con Atlas One
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
                  <Link href="/register">
                    <Button size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-10 h-12">
                      Crear Cuenta Gratis
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-white/20 hover:bg-white/5 hover:border-white/30 h-12 px-10 bg-transparent"
                    >
                      Ver Demo
                    </Button>
                  </Link>
                </div>
                <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                  <Clock className="w-4 h-4" />
                  Sin tarjeta. Listo en 5 minutos.
                </p>
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
                <Image
                  src="/images/nombre-atlas-horizontal.png"
                  alt="Atlas One"
                  width={100}
                  height={28}
                  className="h-7 w-auto"
                />
              </div>

              <div className="flex items-center gap-8 text-sm text-gray-500">
                <Link href="#" className="hover:text-gray-300 transition-colors">
                  Términos
                </Link>
                <Link href="#" className="hover:text-gray-300 transition-colors">
                  Privacidad
                </Link>
                <Link href="#" className="hover:text-gray-300 transition-colors">
                  Contacto
                </Link>
                <Link href="#" className="hover:text-gray-300 transition-colors">
                  Documentación
                </Link>
              </div>

              <p className="text-sm text-gray-600">© 2025 Atlas One. Todos los derechos reservados.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-2">
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
  icon: any
  title: string
  description: string
  gradient: string
}) {
  return (
    <div className="group relative">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl`}
      />
      <div className="relative p-8 rounded-2xl border border-white/10 bg-[#0a0f1e]/50 backdrop-blur-sm hover:border-white/20 transition-all duration-300">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform duration-300">
          {React.cloneElement(icon as any, { className: "w-6 h-6" })}
        </div>
        <h3 className="text-xl font-semibold mb-3 text-white">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
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
  icon: any
}) {
  return (
    <div className="relative">
      <div className="flex items-start gap-4">
        <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center text-2xl font-bold text-cyan-400">
          {number}
        </div>
        <div className="flex-1 pt-2">
          <h3 className="text-xl font-semibold mb-2 text-white flex items-center gap-2">
            {title}
            {React.cloneElement(icon as any, { className: "w-5 h-5 text-cyan-400" })}
          </h3>
          <p className="text-gray-400 leading-relaxed">{description}</p>
        </div>
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
  popular = false,
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
      className={`relative rounded-2xl border ${popular ? "border-cyan-500/50 bg-gradient-to-b from-cyan-500/10 to-transparent" : "border-white/10 bg-[#0a0f1e]/50"} p-8`}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-black text-xs font-semibold">
            Más Popular
          </div>
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-1">{name}</h3>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
      <div className="mb-8">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
            {price}
          </span>
          <span className="text-gray-500">/{period}</span>
        </div>
      </div>
      <ul className="space-y-4 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className="mt-0.5 w-5 h-5 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 text-cyan-400" />
            </div>
            <span className="text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
      <Link href="/register">
        <Button
          className={`w-full h-11 ${popular ? "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black" : "border border-white/10 hover:bg-white/5"}`}
          variant={popular ? "default" : "outline"}
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
    <div className="p-8 rounded-2xl border border-white/10 bg-[#0a0f1e]/50 backdrop-blur-sm">
      <div className="flex gap-1 mb-6">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-cyan-400 text-cyan-400" />
        ))}
      </div>
      <p className="text-gray-300 mb-6 leading-relaxed text-lg">"{quote}"</p>
      <div>
        <p className="font-semibold text-white">{author}</p>
        <p className="text-sm text-gray-500">{role}</p>
      </div>
    </div>
  )
}
