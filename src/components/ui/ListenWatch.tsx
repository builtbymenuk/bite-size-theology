"use client";

import type { PodcastAction } from "@/lib/content";
import { linkProps } from "@/lib/links";

function PlatformIcon({ platform }: { platform: "spotify" | "youtube" }) {
  if (platform === "spotify") {
    return (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="#1DB954" aria-hidden>
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.6 14.4a.62.62 0 01-.86.2c-2.35-1.44-5.3-1.76-8.8-.96a.62.62 0 11-.28-1.2c3.83-.88 7.1-.5 9.74 1.1a.62.62 0 01.2.86zm1.23-2.73a.78.78 0 01-1.07.26c-2.7-1.66-6.8-2.14-9.98-1.17a.78.78 0 11-.45-1.5c3.64-1.1 8.15-.56 11.24 1.34a.78.78 0 01.26 1.07zm.1-2.84C14.55 8.9 9.5 8.72 6.6 9.6a.94.94 0 11-.55-1.8c3.34-1 8.9-.82 12.35 1.24a.94.94 0 11-.96 1.6z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <rect x="2" y="5.5" width="20" height="13" rx="3.5" fill="#FF0000" />
      <path d="M10 9.2l5 2.8-5 2.8V9.2z" fill="#fff" />
    </svg>
  );
}

// The Spotify/YouTube pill pair. Shared by the podcast hero and the Podcast section so they
// can't drift apart. Reads podcast.actions (Listen → spotify, Watch → youtube). A youtube action
// links to `youtubeUrl` (the channel) when provided; spotify stays an inert button until a URL exists.
export default function ListenWatch({
  actions,
  youtubeUrl,
  className,
}: {
  actions: PodcastAction[];
  youtubeUrl?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-3 ${className ?? ""}`}>
      {actions.map((a) => {
        const cls = `inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-transform hover:scale-[1.03] ${
          a.platform === "spotify"
            ? "border border-ink/10 bg-white text-ink shadow-sm"
            : "bg-ink text-cream"
        }`;
        const inner = (
          <>
            <PlatformIcon platform={a.platform} />
            {a.label}
          </>
        );
        // CMS action.url wins; YouTube falls back to the channel URL. Blank → inert button.
        const p = linkProps(a.url || (a.platform === "youtube" ? youtubeUrl : undefined));
        return p.href ? (
          <a key={a.label} {...p} className={cls}>
            {inner}
          </a>
        ) : (
          <button key={a.label} className={cls}>
            {inner}
          </button>
        );
      })}
    </div>
  );
}
