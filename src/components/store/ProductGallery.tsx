"use client";

import { useState } from "react";
import Placeholder from "@/components/ui/Placeholder";
import type { Tone } from "@/lib/content";

export default function ProductGallery({
  images,
  tone,
  title,
}: {
  images: string[];
  tone: Tone;
  title: string;
}) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
        <Placeholder
          tone={tone}
          src={images[active]}
          label={images.length ? "" : title}
          alt={title}
        />
      </div>
      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-5 gap-3">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === active}
              className={`relative aspect-square overflow-hidden rounded-lg ring-2 transition ${
                i === active ? "ring-ink" : "ring-transparent hover:ring-ink/30"
              }`}
            >
              <Placeholder tone={tone} src={img} label="" alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
