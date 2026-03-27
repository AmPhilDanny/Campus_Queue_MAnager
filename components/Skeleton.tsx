"use client";

/* ---- Skeleton primitives ---- */

export function SkeletonText({ width = "wide" }: { width?: "wide" | "medium" | "short" }) {
  return <div className={`skeleton skeleton-text ${width}`} />;
}

export function SkeletonBlock({ height }: { height?: string }) {
  return <div className="skeleton skeleton-block" style={{ height }} />;
}

export function SkeletonCard() {
  return <div className="skeleton skeleton-card" />;
}

/* ---- Composed: list of cards ---- */
export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            padding: "1rem",
            borderRadius: "var(--radius)",
            background: "#f8fafc",
            marginBottom: "0.75rem",
          }}
        >
          <SkeletonText width="medium" />
          <SkeletonText width="short" />
        </div>
      ))}
    </>
  );
}

/* ---- Composed: stat cards row ---- */
export function SkeletonStats({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${count}, 1fr)`, gap: "1rem" }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ textAlign: "center" }}>
          <SkeletonText width="short" />
          <SkeletonBlock />
        </div>
      ))}
    </div>
  );
}
