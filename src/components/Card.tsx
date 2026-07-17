import type { ReactNode } from "react";

/** Consistent surface container used across the app. */
export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article";
}) {
  return (
    <Tag
      className={`rounded-2xl border border-line bg-surface p-5 shadow-[var(--shadow-sm)] sm:p-6 ${className}`}
    >
      {children}
    </Tag>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-display text-xl text-ink sm:text-2xl">{title}</h2>
      </div>
      {children}
    </div>
  );
}
