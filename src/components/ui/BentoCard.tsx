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
    sizes?: string;
  };
}) {
  return (
    // Clip only when there's an image (the hover-zoom needs it); text cards stay visible so
    // decorative elements can spill outside the card.
    <div className={`group relative rounded-2xl ${image ? "overflow-hidden" : ""} ${className ?? ""}`}>
      {image ? (
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
          <Placeholder
            tone={image.tone}
            label={image.label}
            src={image.src}
            sizes={image.sizes}
          />
        </div>
      ) : null}
      {children ? (
        <div className="relative z-10 flex h-full flex-col">{children}</div>
      ) : null}
    </div>
  );
}
