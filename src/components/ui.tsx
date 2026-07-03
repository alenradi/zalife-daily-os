import type { ReactNode } from "react";
import { quoteForIndex, QUOTES } from "../data/quotes";

export function PageHead({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-head">
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}

export function Card({
  title,
  sub,
  right,
  children,
  className = "",
}: {
  title?: string;
  sub?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || right) && (
        <div className="card-title between" style={{ width: "100%" }}>
          <div className="row center gap-sm">
            <span className="accent-bar" />
            <div>
              {title && <h3>{title}</h3>}
              {sub && <div className="card-sub">{sub}</div>}
            </div>
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatTile({
  k,
  v,
  tone,
}: {
  k: string;
  v: ReactNode;
  tone?: "teal" | "gold";
}) {
  return (
    <div className="stat">
      <div className="k">{k}</div>
      <div className={`v ${tone ?? ""}`}>{v}</div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  const idx = Math.floor(Math.random() * QUOTES.length);
  return (
    <div className="empty">
      <div>{children}</div>
      <div className="quote">„{quoteForIndex(idx)}"</div>
    </div>
  );
}
