// Gradient tone blocks are the fallback/empty-state. When a CMS media `src` is present
// we render next/image over the gradient (the tone stays as the loading backdrop), so
// slots without an uploaded image look exactly as before.
import Image from "next/image";

// Brand-family gradients (legacy tone names kept). Cool navy/blue/teal + plum accent.
const tones = {
  dark: "from-charcoal to-[#0a1a33] text-cream/40",
  warm: "from-[#b06a86] to-[#7a3f59] text-white/50",
  light: "from-[#dbe3ef] to-[#c2cede] text-ink/30",
  cool: "from-[#5b7aa8] to-[#2b3f63] text-white/50",
  gold: "from-[#d8bb8c] to-[#b8945f] text-white/60",
  yellow: "from-[#4fb0c0] to-[#2c7a8c] text-white/50",
} as const;

export default function Placeholder({
  label,
  tone = "light",
  src,
  alt,
  className,
}: {
  label?: string;
  tone?: keyof typeof tones;
  src?: string;
  alt?: string;
  className?: string;
}) {
  if (src) {
    // Local decorative SVG (our themed defaults) → background-image, dodging next/image's
    // SVG restrictions (same trick as the photo.svg icon below). CMS/raster → next/image.
    if (src.startsWith("/") && src.endsWith(".svg")) {
      return (
        <div
          role="img"
          aria-label={alt ?? label ?? ""}
          className={`h-full w-full bg-cover bg-center ${className ?? ""}`}
          style={{ backgroundImage: `url('${src}')` }}
        />
      );
    }
    return (
      <div
        className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${tones[tone]} ${className ?? ""}`}
      >
        <Image
          src={src}
          alt={alt ?? label ?? ""}
          fill
          className="object-cover"
          sizes="100vw"
        />
      </div>
    );
  }
  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br ${tones[tone]} ${className ?? ""}`}
    >
      {/* Real placeholder-image file (bg-image avoids next/image's remote/SVG rules for a local
          decorative asset). Replaced by an uploaded CMS image via the `src` branch above. */}
      <span
        aria-hidden
        className="h-9 w-9 shrink-0 bg-contain bg-center bg-no-repeat opacity-40"
        style={{ backgroundImage: "url('/placeholders/photo.svg')" }}
      />
      {label ? (
        <span className="px-4 text-center text-[10px] font-medium uppercase tracking-[0.25em]">
          {label}
        </span>
      ) : null}
    </div>
  );
}
