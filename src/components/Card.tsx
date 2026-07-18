import type { ReactNode } from "react";

/**
 * Consistent surface container used across the app.
 *
 * A card can optionally own its section header (eyebrow + title, with an
 * optional action on the right). Keeping the header *inside* the card binds it
 * tightly to its content: when a multi-column grid collapses on small screens
 * the header can never drift into the gap above and read as a caption for the
 * card before it. This is the institutional, bank-grade grouping we want.
 */
export function Card({
  children,
  className = "",
  bodyClassName = "",
  as: Tag = "div",
  eyebrow,
  title,
  titleId,
  action,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: {
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  as?: "div" | "section" | "article";
  eyebrow?: string;
  title?: ReactNode;
  titleId?: string;
  action?: ReactNode;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}) {
  const hasHeader = Boolean(eyebrow || title);

  return (
    <Tag
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      className={`flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-sm)] transition-shadow duration-300 hover:shadow-[var(--shadow-md)] ${className}`}
    >
      {hasHeader ? <CardHeader eyebrow={eyebrow} title={title} titleId={titleId} action={action} /> : null}
      <div className={`p-5 sm:p-6 ${hasHeader ? "pt-4 sm:pt-5" : ""} ${bodyClassName}`}>{children}</div>
    </Tag>
  );
}

/** Header region rendered at the top of a Card. */
function CardHeader({
  eyebrow,
  title,
  titleId,
  action,
}: {
  eyebrow?: string;
  title?: ReactNode;
  titleId?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-surface-2/40 px-5 py-4 sm:px-6">
      <div>
        {eyebrow ? (
          <p className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            <span aria-hidden className="h-3 w-[3px] rounded-full bg-accent" />
            {eyebrow}
          </p>
        ) : null}
        {title ? (
          <h2 id={titleId} className="font-display text-lg text-ink sm:text-xl">
            {title}
          </h2>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

/**
 * Standalone section header. Retained for headers that sit above a group of
 * cards rather than a single card (e.g. the comparison section, which reveals a
 * multi-card panel below the heading). For a header that belongs to one card,
 * prefer passing `eyebrow`/`title` to <Card> so the two stay bound together.
 */
export function SectionTitle({
  eyebrow,
  title,
  titleId,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  titleId?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow ? (
          <p className="mb-1.5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            <span aria-hidden className="h-3 w-[3px] rounded-full bg-accent" />
            {eyebrow}
          </p>
        ) : null}
        <h2 id={titleId} className="font-display text-xl text-ink sm:text-2xl">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
