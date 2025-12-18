export function AtlasLogo({
  className = "w-8 h-8",
  variant = "icon",
}: { className?: string; variant?: "icon" | "horizontal" | "vertical" }) {
  if (variant === "horizontal") {
    return (
      <div className="flex items-center gap-2.5">
        <img src="/images/logo-atlas.png" alt="Atlas One" className="w-8 h-8" />
        <img src="/images/nombre-atlas-horizontal.png" alt="ATLAS ONE" className="h-6" />
      </div>
    )
  }

  if (variant === "vertical") {
    return (
      <div className="flex flex-col items-center gap-1.5">
        <img src="/images/logo-atlas.png" alt="Atlas One" className="w-10 h-10" />
        <img src="/images/nombre-atlas.png" alt="ATLAS ONE" className="h-8" />
      </div>
    )
  }

  return <img src="/images/logo-atlas.png" alt="Atlas One" className={className} />
}
