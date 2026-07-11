import { getEyebrow } from "@/lib/cms";

export default async function EyebrowStrip() {
  const eyebrow = await getEyebrow();
  return (
    <div className="border-b border-ink/10">
      <div className="mx-auto max-w-7xl px-6 py-5">
        <p className="text-[11px] uppercase tracking-[0.3em] text-ink/50">
          {eyebrow}
        </p>
      </div>
    </div>
  );
}
