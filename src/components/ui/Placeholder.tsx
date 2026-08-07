// Gradient tone blocks are the fallback/empty-state. When a CMS media `src` is present
// we render next/image over the gradient (the tone stays as the loading backdrop), so
// slots without an uploaded image look exactly as before.
import Image from "next/image";

const tones = {
  dark: "from-charcoal to-[#3a352d] text-cream/40",
  warm: "from-[#c9a06a] to-[#8a6a3f] text-white/50",
  light: "from-[#e9e3d7] to-[#d6ccba] text-ink/30",
  cool: "from-[#8794a0] to-[#4a555c] text-white/50",
  gold: "from-[#d8b072] to-[#b8945f] text-white/60",
  yellow: "from-[#f4d54a] to-[#e0b800] text-black/40",
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
