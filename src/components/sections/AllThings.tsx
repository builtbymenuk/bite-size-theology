import Link from "next/link";
import Reveal, { RevealItem } from "@/components/ui/Reveal";
import BentoCard from "@/components/ui/BentoCard";
import PolaroidStack from "@/components/ui/PolaroidStack";
import { getAllThings } from "@/lib/cms";

function ChatBubble({
  side,
  children,
}: {
  side: "left" | "right";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-snug ${
        side === "right"
          ? "self-end bg-blue text-white"
          : "self-start bg-white text-ink"
      }`}
    >
      {children}
    </div>
  );
}

export default async function AllThings() {
  const allThings = await getAllThings();
  const c = allThings.cards;
  const img = allThings.images ?? {};
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-5xl tracking-tight md:text-6xl">
          {allThings.headingLead}{" "}
          <span className="italic text-gold">{allThings.headingScript}</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-ink/60">
          {allThings.subtext}
        </p>
      </Reveal>

      <Reveal
        stagger
        className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:auto-rows-[300px] lg:grid-cols-4"
      >
        {/* Testimony — 2 wide */}
        <RevealItem className="lg:col-span-2">
          <BentoCard className="h-full min-h-[300px] bg-[#dfe7f1] p-6">
            <div className="relative flex h-full items-center">
              <div>
                <h3 className="font-display text-2xl">{c.testimony.title}</h3>
                <button className="mt-3 text-[11px] uppercase tracking-widest text-ink/60">
                  {c.testimony.cta} →
                </button>
              </div>
              {/* Oversized polaroids spilling past the card's top-right edge for a creative break-out. */}
              <PolaroidStack
                className="absolute -top-12 right-2 h-64 w-72 shrink-0 md:-right-10 md:-top-16 md:w-80"
                photos={[
                  { tone: "warm", label: "Testimony", src: img.testimony, rotate: 6, className: "absolute right-0 top-4 w-40 md:w-48" },
                  { tone: "cool", label: "Vlog", src: img.vlog, rotate: -8, className: "absolute left-0 top-12 w-36 md:w-44" },
                ]}
              />
            </div>
          </BentoCard>
        </RevealItem>

        {/* YouTube — 2 wide */}
        <RevealItem className="lg:col-span-2">
          <BentoCard
            className="h-full min-h-[300px]"
            image={{ tone: "dark", label: "YouTube — Camera Rig", src: img.youtube }}
          >
            <div className="flex h-full items-end p-6">
              <p className="max-w-xs text-sm text-cream/90">{c.youtube.body}</p>
            </div>
          </BentoCard>
        </RevealItem>

        {/* TikTok — tall */}
        <RevealItem className="lg:row-span-2">
          <BentoCard
            className="h-full min-h-[300px]"
            image={{ tone: "cool", label: "TikTok — Phone", src: img.tiktok }}
          >
            <div className="flex h-full flex-col justify-end p-5">
              <p className="text-sm text-cream/90">{c.tiktok.body}</p>
              <button className="mt-3 self-start rounded-full bg-cream/90 px-4 py-2 text-[11px] uppercase tracking-widest text-ink">
                {c.tiktok.cta}
              </button>
            </div>
          </BentoCard>
        </RevealItem>

        {/* Shop */}
        <RevealItem>
          <BentoCard
            className="h-full min-h-[300px]"
            image={{ tone: "warm", label: "Shop — Merch", src: img.shop }}
          >
            <div className="flex h-full items-end p-5">
              <h3 className="font-display text-3xl text-cream">{c.shop.title}</h3>
            </div>
          </BentoCard>
        </RevealItem>

        {/* Give Now */}
        <RevealItem>
          <BentoCard className="h-full min-h-[300px] bg-[#dfe7f1] p-5">
            <div className="flex h-full flex-col justify-between">
              <h3 className="font-display text-2xl">{c.give.title}</h3>
              <div>
                <p className="text-xs text-ink/60">{c.give.body}</p>
                <button className="mt-1 text-xs font-medium underline">
                  {c.give.cta}
                </button>
              </div>
            </div>
          </BentoCard>
        </RevealItem>

        {/* Chat — tall */}
        <RevealItem className="lg:row-span-2">
          <BentoCard className="h-full min-h-[300px] bg-[#dfe7f1] p-4">
            <div className="flex h-full flex-col justify-end gap-2">
              <ChatBubble side="left">{c.chat.question}</ChatBubble>
              {c.chat.replies.map((r, i) => (
                <ChatBubble key={i} side="right">
                  {r}
                </ChatBubble>
              ))}
              <ChatBubble side="left">{c.chat.close}</ChatBubble>
            </div>
          </BentoCard>
        </RevealItem>

        {/* Podcast */}
        <RevealItem>
          <BentoCard
            className="h-full min-h-[300px]"
            image={{ tone: "dark", label: "Podcast — Mic", src: img.podcast }}
          >
            <div className="flex h-full flex-col justify-end p-5">
              <p className="text-[10px] uppercase tracking-widest text-gold">
                {c.podcast.eyebrow}
              </p>
              <h3 className="font-display text-xl text-cream">
                {c.podcast.title}
              </h3>
            </div>
          </BentoCard>
        </RevealItem>

        {/* Book Caleb */}
        <RevealItem>
          <Link href="/book-caleb" className="block h-full">
            <BentoCard
              className="h-full min-h-[300px]"
              image={{ tone: "gold", label: "Book Caleb", src: img.book }}
            >
              <div className="flex h-full flex-col justify-end p-5">
                <h3 className="font-display text-2xl text-white">{c.book.title}</h3>
                <p className="mt-1 max-w-[12rem] text-xs text-white/80">
                  {c.book.body}
                </p>
              </div>
            </BentoCard>
          </Link>
        </RevealItem>
      </Reveal>
    </section>
  );
}
