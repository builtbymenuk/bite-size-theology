import SocialIcon, { SOCIAL_LABELS } from "@/components/ui/SocialIcons";
import { linkProps } from "@/lib/links";
import type { SocialLink } from "@/lib/content";

// The social row, shared by the hero's corner chip and the nav pill. `dark` mirrors CartButton so
// the icons flip with the pill's theme.
//
// All six platforms always render. One without a URL yet becomes a dimmed, non-interactive span —
// so the set reads as complete from day one and each icon lights up the moment its field is filled
// in under "Shared — Navbar". A placeholder is decorative, so it's aria-hidden: screen readers must
// not announce something that isn't a link.
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
  // 32px boxes: six of them plus the chip's padding is what has to fit in the margin beside the nav
  // pill, and 36px pushed the whole row into it. See the clearance formula in Hero.tsx.
  const box = "flex h-8 w-8 items-center justify-center transition-colors";
  const glyph = { width: size, height: size };

  return (
    <div className={`items-center ${className}`}>
      {socials.map(({ platform, url }) => {
        const props = linkProps(url);

        if (!props.href) {
          return (
            <span
              key={platform}
              aria-hidden
              className={`${box} ${dark ? "text-cream/30" : "text-ink/20"}`}
            >
              <SocialIcon platform={platform} style={glyph} />
            </span>
          );
        }

        return (
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
        );
      })}
    </div>
  );
}
