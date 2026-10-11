import SocialIcon, { SOCIAL_LABELS } from "@/components/ui/SocialIcons";
import { linkProps } from "@/lib/links";
import type { SocialLink } from "@/lib/content";

// The social row under the hero headline. `dark` flips the icons with the pill's theme.
//
// Only platforms with a URL render. An icon with nowhere to go reads as a broken control rather
// than a slot waiting to be filled, so clearing a field in Strapi removes its icon outright — and
// with nothing linked at all the row disappears entirely.
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

  // 44px rings: a full touch target, same outlined-circle language as the hero's ArrowButton.
  const box = "flex h-11 w-11 items-center justify-center rounded-full border transition-colors";
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
            dark
              ? "border-cream/25 text-cream/85 hover:border-cream hover:bg-cream hover:text-ink"
              : "border-ink/20 text-ink/65 hover:border-ink hover:text-ink"
          }`}
        >
          <SocialIcon platform={platform} style={glyph} />
        </a>
      ))}
    </div>
  );
}
