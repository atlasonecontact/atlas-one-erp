import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  ShoppingCart,
  Package,
  Users,
  Zap,
  Shield,
  TrendingUp,
  Clock,
  ChevronRight,
  Star,
  Check,
  Store,
  Bell,
  Smartphone,
} from "lucide-react"
import Image from "next/image"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-white overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      {/* Glow effects */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 lg:px-12 lg:py-6 border-b border-cyan-500/10 bg-[#030712]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10">
            <Image src="/images/1.jpg" alt="Atlas One Logo" fill className="object-contain" />
          </div>
          <span className="text-xl font-bold tracking-tight text-cyan-400">ATLAS ONE</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          <Link href="#features" className="hover:text-cyan-400 transition-colors">
            Características
          </Link>
          <Link href="#pricing" className="hover:text-cyan-400 transition-colors">
            Precios
          </Link>
          <Link href="#testimonials" className="hover:text-cyan-400 transition-colors">
            Testimonios
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-gray-300 hover:text-cyan-400 hover:bg-cyan-400/10">
              Iniciar Sesión
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-6">Comenzar Gratis</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 pt-20 pb-32 lg:px-12 lg:pt-32 lg:pb-40">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm mb-8 animate-pulse">
            <Zap className="w-4 h-4" />
            <span>Sistema multi-kiosko con IA integrada</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 text-balance">
            La cadena de kioscos
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-500">
              más inteligente
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 text-pretty">
            Gestiona múltiples sucursales, empleados con acceso individual, notificaciones por WhatsApp y Telegram, y
            dashboards en tiempo real. Todo desde una sola plataforma.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-6 text-lg group shadow-lg shadow-cyan-500/20"
              >
                Empezar Ahora
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 px-8 py-6 text-lg bg-transparent"
              >
                Ver Demo en Vivo
              </Button>
            </Link>
          </div>

          {/* Dashboard Preview with actual images */}
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent z-10 pointer-events-none" />
            <div className="relative rounded-xl border border-cyan-500/20 bg-[#0a0f1a] p-2 shadow-2xl shadow-cyan-500/20">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-cyan-500/10">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-4 text-xs text-gray-500">dashboard.atlasone.com</span>
              </div>
              <div className="relative aspect-video overflow-hidden">
                <Image src="/images/3.jpg" alt="Atlas One Dashboard" fill className="object-cover object-top" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 px-6 py-20 lg:px-12 border-y border-cyan-500/10 bg-cyan-500/5">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard number="500+" label="Kioscos activos" />
          <StatCard number="$2M+" label="Ventas procesadas" />
          <StatCard number="99.9%" label="Uptime garantizado" />
          <StatCard number="24/7" label="Soporte técnico" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 px-6 py-24 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Todo lo que necesitas en <span className="text-cyan-400">un solo lugar</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Diseñado para cadenas de kioscos y comercios minoristas modernos
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Store className="w-6 h-6" />}
              title="Multi-Kiosko"
              description="Gestiona múltiples sucursales desde un solo panel. Cada kiosko con su propio plan, empleados y configuración."
            />
            <FeatureCard
              icon={<Users className="w-6 h-6" />}
              title="Empleados con Acceso"
              description="Crea credenciales auto-generadas para cada empleado. Controla permisos y sincroniza ventas en tiempo real."
            />
            <FeatureCard
              icon={<ShoppingCart className="w-6 h-6" />}
              title="Punto de Venta"
              description="Sistema POS rápido e intuitivo. Las ventas de empleados se sincronizan automáticamente con el dashboard del dueño."
            />
            <FeatureCard
              icon={<Bell className="w-6 h-6" />}
              title="Notificaciones Inteligentes"
              description="Recibe notificaciones por WhatsApp y Telegram cada vez que se realiza una venta. Con verificación de número."
            />
            <FeatureCard
              icon={<Smartphone className="w-6 h-6" />}
              title="Bots de Mensajería"
              description="Consulta estadísticas desde tu celular con comandos de Telegram. Ventas del día, mes y productos bajos en stock."
            />
            <FeatureCard
              icon={<Package className="w-6 h-6" />}
              title="Control de Inventario"
              description="Importa productos por CSV, monitorea stock por kiosko y recibe alertas de reposición automáticas."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Reportes por Kiosko"
              description="Dashboards con métricas individuales por sucursal y consolidadas de toda la cadena."
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Smart Insights"
              description="Predicciones y recomendaciones basadas en IA para maximizar tus ganancias."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Seguridad Total"
              description="Row Level Security, credenciales únicas por empleado y verificación telefónica para notificaciones."
            />
          </div>
        </div>
      </section>

      {/* Screenshot Section */}
      <section className="relative z-10 px-6 py-24 lg:px-12 bg-gradient-to-b from-transparent to-cyan-500/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold mb-4">
                Visualiza todo en <span className="text-cyan-400">tiempo real</span>
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Dashboards interactivos con gráficos de ventas, productos top, insights automáticos y mapas de calor.
                Cada kiosko tiene su propio dashboard accesible desde cualquier dispositivo.
              </p>
              <ul className="space-y-3">
                {[
                  "Ventas en tiempo real por kiosko y empleado",
                  "Gráficos de evolución de últimos 30 días",
                  "Ranking de productos más vendidos",
                  "Heatmaps de horarios de mayor venta",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300">
                    <Check className="w-5 h-5 text-cyan-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative rounded-xl border border-cyan-500/20 overflow-hidden shadow-2xl shadow-cyan-500/10">
              <Image src="/images/4.jpg" alt="Dashboard con gráficos" width={600} height={400} className="w-full" />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 px-6 py-24 lg:px-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Planes <span className="text-cyan-400">para cada etapa</span>
            </h2>
            <p className="text-gray-400">Sin costos ocultos. Cancela cuando quieras.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <PricingCard
              name="Básico"
              price="Gratis"
              description="Ideal para comenzar"
              features={["1 kiosco", "2 empleados", "50 productos", "Reportes básicos", "Sin integraciones"]}
            />
            <PricingCard
              name="Profesional"
              price="$29.99"
              description="Para negocios en crecimiento"
              features={[
                "Hasta 3 kioscos",
                "10 empleados por kiosko",
                "500 productos",
                "Reportes avanzados",
                "WhatsApp + Telegram",
                "Soporte prioritario",
              ]}
              popular
            />
            <PricingCard
              name="Empresarial"
              price="$99.99"
              description="Cadenas grandes"
              features={[
                "Kioscos ilimitados",
                "50 empleados por kiosko",
                "5000 productos",
                "Reportes premium",
                "Todas las integraciones",
                "Soporte 24/7 dedicado",
              ]}
            />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="relative z-10 px-6 py-24 lg:px-12 bg-gradient-to-b from-transparent to-cyan-500/5"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Lo que dicen nuestros <span className="text-cyan-400">clientes</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard
              quote="Pasé de tener 1 kiosco a 5 en un año. Atlas One me permitió escalar sin perder control de nada."
              author="María González"
              role="Dueña de Kioscos Express"
            />
            <TestimonialCard
              quote="Las notificaciones por WhatsApp son un game-changer. Sé exactamente qué pasa en cada sucursal sin estar ahí."
              author="Carlos Rodríguez"
              role="Cadena La Esquina (7 kioscos)"
            />
            <TestimonialCard
              quote="Mis empleados tienen su propio acceso y todas sus ventas se sincronizan al instante. Súper transparente."
              author="Ana Martínez"
              role="Propietaria de Minimarket Norte"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-24 lg:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/10 to-transparent p-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Transforma tu cadena hoy</h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Únete a cientos de cadenas de kioscos que ya confían en Atlas One para gestionar sus negocios.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-10 py-6 text-lg shadow-lg shadow-cyan-500/20"
                >
                  Crear Cuenta Gratis
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 px-10 py-6 text-lg bg-transparent"
                >
                  Ver Demo en Vivo
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-6 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              Sin tarjeta de crédito. Configuración en menos de 5 minutos
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 lg:px-12 border-t border-cyan-500/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8">
              <Image src="/images/1.jpg" alt="Atlas One Logo" fill className="object-contain" />
            </div>
            <span className="text-lg font-bold text-cyan-400">ATLAS ONE</span>
          </div>
          <div className="flex items-center gap-8 text-sm text-gray-500">
            <Link href="#" className="hover:text-cyan-400 transition-colors">
              Términos
            </Link>
            <Link href="#" className="hover:text-cyan-400 transition-colors">
              Privacidad
            </Link>
            <Link href="#" className="hover:text-cyan-400 transition-colors">
              Contacto
            </Link>
          </div>
          <p className="text-sm text-gray-600">© 2025 Atlas One. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  )
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl md:text-4xl font-bold text-cyan-400 mb-2">{number}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="group p-6 rounded-xl border border-cyan-500/10 bg-[#0a0f1a] hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-300">
      <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4 group-hover:bg-cyan-500/20 group-hover:scale-110 transition-all">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2 text-white">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
  )
}

function PricingCard({
  name,
  price,
  description,
  features,
  popular = false,
}: {
  name: string
  price: string
  description: string
  features: string[]
  popular?: boolean
}) {
  return (
    <div
      className={`relative p-8 rounded-xl border ${popular ? "border-cyan-500 bg-cyan-500/10" : "border-cyan-500/10 bg-[#0a0f1a]"}`}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-cyan-500 text-black text-xs font-semibold rounded-full">
          Más Popular
        </div>
      )}
      <h3 className="text-xl font-semibold mb-1">{name}</h3>
      <p className="text-sm text-gray-400 mb-4">{description}</p>
      <div className="mb-6">
        <span className="text-4xl font-bold text-cyan-400">{price}</span>
        <span className="text-gray-500">/mes</span>
      </div>
      <ul className="space-y-3 mb-8">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
            <Check className="w-4 h-4 text-cyan-400 shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
      <Link href="/register">
        <Button
          className={`w-full ${popular ? "bg-cyan-500 hover:bg-cyan-400 text-black" : "bg-white/10 hover:bg-white/20 text-white"}`}
        >
          Comenzar
        </Button>
      </Link>
    </div>
  )
}

function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <div className="p-6 rounded-xl border border-cyan-500/10 bg-[#0a0f1a]">
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-cyan-400 text-cyan-400" />
        ))}
      </div>
      <p className="text-gray-300 mb-6 leading-relaxed">"{quote}"</p>
      <div>
        <p className="font-semibold text-white">{author}</p>
        <p className="text-sm text-gray-500">{role}</p>
      </div>
    </div>
  )
}

function DashboardPreview() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {/* KPI Cards */}
      <div className="p-4 rounded-lg border border-cyan-500/20 bg-[#0d1424]">
        <p className="text-xs text-gray-500 mb-1">Ventas del día</p>
        <p className="text-2xl font-bold text-cyan-400">$15,200</p>
        <p className="text-xs text-green-400">↑ 12% vs ayer</p>
      </div>
      <div className="p-4 rounded-lg border border-cyan-500/20 bg-[#0d1424]">
        <p className="text-xs text-gray-500 mb-1">Ticket promedio</p>
        <p className="text-2xl font-bold text-cyan-400">$950</p>
        <p className="text-xs text-green-400">↑ 9.4%</p>
      </div>
      <div className="p-4 rounded-lg border border-cyan-500/20 bg-[#0d1424]">
        <p className="text-xs text-gray-500 mb-1">Ventas del mes</p>
        <p className="text-2xl font-bold text-cyan-400">$106,800</p>
        <p className="text-xs text-green-400">↑ 12%</p>
      </div>
      <div className="p-4 rounded-lg border border-cyan-500/20 bg-[#0d1424]">
        <p className="text-xs text-gray-500 mb-1">Producto top</p>
        <p className="text-lg font-bold text-white">Gaseosa Cola</p>
        <p className="text-xs text-gray-400">8 productos</p>
      </div>

      {/* Chart placeholder */}
      <div className="col-span-3 p-4 rounded-lg border border-cyan-500/20 bg-[#0d1424] h-32">
        <p className="text-xs text-gray-500 mb-2">Evolución de ventas (30 días)</p>
        <div className="flex items-end justify-between h-16 px-4">
          {[40, 55, 45, 60, 50, 70, 65, 80, 75, 85, 90, 95].map((h, i) => (
            <div
              key={i}
              className="w-2 bg-gradient-to-t from-cyan-500/50 to-cyan-400 rounded-t"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* Smart Insights */}
      <div className="p-4 rounded-lg border border-cyan-500/20 bg-[#0d1424]">
        <p className="text-xs text-gray-500 mb-2">Smart Insights</p>
        <div className="space-y-2 text-xs">
          <p className="text-cyan-400">↗ Ventas +6.2% hoy</p>
          <p className="text-yellow-400">⚠ 8 productos bajos</p>
        </div>
      </div>
    </div>
  )
}
