import { ImageResponse } from "next/og";

/**
 * File-based Open Graph / Twitter image. Next auto-wires og:image and
 * twitter:image from this route and serves it at /opengraph-image. Rendered
 * with next/og (Satori) — keep to flexbox layout and inline styles only.
 */
export const alt = "HomeCost Canada — Ontario tax, affordability & home-cost planner";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b1220",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "96px",
              height: "96px",
              borderRadius: "22px",
              background: "#2563eb",
              color: "#ffffff",
              fontSize: "60px",
              fontWeight: 700,
            }}
          >
            H
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "34px",
              fontWeight: 600,
              color: "#93a4c3",
              letterSpacing: "0.02em",
            }}
          >
            HomeCost Canada
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              fontSize: "76px",
              fontWeight: 700,
              lineHeight: 1.05,
              color: "#ffffff",
              maxWidth: "980px",
            }}
          >
            Ontario tax, affordability &amp; home-cost planner
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "34px",
              fontWeight: 400,
              lineHeight: 1.3,
              color: "#93a4c3",
              maxWidth: "920px",
            }}
          >
            Your take-home pay, the home you can afford, and your full monthly cost — built on 2026
            Ontario tax rules.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", width: "40px", height: "6px", borderRadius: "3px", background: "#2563eb" }} />
          <div style={{ display: "flex", fontSize: "26px", color: "#6b7a99" }}>
            Educational demonstration — not financial advice
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
