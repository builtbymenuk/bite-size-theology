import Placeholder from "./Placeholder";

// Card shell: rounded, clips content, hover image-zoom (CSS — cheaper than motion for continuous hover).
export default function BentoCard({
  className,
  children,
  image,
}: {
  className?: string;
  children?: React.ReactNode;
  image?: {
    tone: React.ComponentProps<typeof Placeholder>["tone"];
    label?: string;
    src?: string;
  };
}) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl ${className ?? ""}`}>
      {image ? (
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
          <Placeholder tone={image.tone} label={image.label} src={image.src} />
        </div>
      ) : null}
      {children ? (
        <div className="relative z-10 flex h-full flex-col">{children}</div>
      ) : null}
    </div>
  );
}
