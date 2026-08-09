"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { linkProps } from "@/lib/links";

const MotionLink = motion(Link);

export default function ArrowButton({
  label,
  className,
  dark,
  href,
}: {
  label?: string;
  className?: string;
  dark?: boolean;
  href?: string;
}) {
  const link = linkProps(href); // external → new tab; internal → same tab; blank → {} (button)
  const Comp: any = link.href ? MotionLink : motion.button;
  return (
    <Comp
      {...(link.href ? link : { type: "button" })}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className={`group inline-flex items-center gap-3 ${className ?? ""}`}
    >
      {label ? (
        <span className="text-[11px] font-medium uppercase tracking-[0.22em]">
          {label}
        </span>
      ) : null}
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${
          dark ? "border-cream/40" : "border-current"
        }`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="transition-transform duration-300 group-hover:translate-x-0.5"
        >
          <path
            d="M2 8h11M9 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </Comp>
  );
}
