import SocialIcon, { SOCIAL_LABELS } from "@/components/ui/SocialIcons";
import { linkProps } from "@/lib/links";
import type { SocialLink } from "@/lib/content";

// The social row in the hero's corner chip. `dark` flips the icons with the pill's theme.
//
// Only platforms with a URL render. An icon with nowhere to go reads as a broken control rather
// than a slot waiting to be filled, so clearing a field in Strapi removes its icon outright — and
// with nothing linked at all the chip itself disappears instead of leaving an empty pill.
export default function SocialLinks({
  socials,
  dark,
  size = 18,
  className = "",
}: {
  socials: SocialLink[];
  dark?: boolean;
  size?: number;
  className?: string;
}) {
  const linked = socials
    .map((s) => ({ platform: s.platform, props: linkProps(s.url) }))
    .filter((s) => s.props.href);
  if (!linked.length) return null;

  // 32px boxes: six of them plus the chip's padding is what has to fit in the margin beside the nav
  // pill, and 36px pushed the whole row into it. See the clearance formula in Hero.tsx.
  const box = "flex h-8 w-8 items-center justify-center transition-colors";
  const glyph = { width: size, height: size };

  return (
    <div className={`items-center ${className}`}>
      {linked.map(({ platform, props }) => (
        <a
          key={platform}
          {...props}
          // Icon-only, so the accessible name has to come from aria-label.
          aria-label={SOCIAL_LABELS[platform]}
          className={`${box} ${
            dark ? "text-cream/80 hover:text-cream" : "text-ink/65 hover:text-ink"
          }`}
        >
          <SocialIcon platform={platform} style={glyph} />
        </a>
      ))}
    </div>
  );
}
