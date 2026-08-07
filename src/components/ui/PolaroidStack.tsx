import Placeholder from "./Placeholder";

type Photo = {
  tone: React.ComponentProps<typeof Placeholder>["tone"];
  label?: string;
  src?: string; // CMS photo; empty → placeholder
  rotate?: number;
  className?: string;
};

// Layered, slightly-rotated photos with white polaroid borders. Position each via `className`.
export default function PolaroidStack({
  photos,
  className,
}: {
  photos: Photo[];
  className?: string;
}) {
  return (
    <div className={`relative ${className ?? ""}`}>
      {photos.map((p, i) => (
        <div
          key={i}
          className={`bg-white p-2 shadow-xl ${p.className ?? ""}`}
          style={{ rotate: `${p.rotate ?? 0}deg` }}
        >
          <div className="aspect-[4/5] overflow-hidden">
            <Placeholder tone={p.tone} label={p.label} src={p.src} />
          </div>
        </div>
      ))}
    </div>
  );
}
