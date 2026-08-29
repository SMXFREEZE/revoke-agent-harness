import { ImageResponse } from "next/og";

// High-quality social share cover (1200x630) shown when the link is sent.
export const runtime = "nodejs";
export const alt = "The Gaggle - Adversarial microbiome R&D";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const font = await fetch(
    "https://cdn.jsdelivr.net/fontsource/fonts/plus-jakarta-sans@latest/latin-800-normal.ttf",
  ).then((r) => r.arrayBuffer());
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Jakarta",
          background: "linear-gradient(150deg, #eaf6ff 0%, #d8eefb 52%, #e8f1fe 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -190,
            right: -120,
            width: 760,
            height: 760,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(21,174,234,0.22), rgba(21,174,234,0) 70%)",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 26 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 88, height: 74, borderRadius: 20, background: "#087347", color: "#fff", fontSize: 26, fontWeight: 800 }}>THE</div>
          <div style={{ display: "flex", color: "#087347", fontSize: 44, fontWeight: 800, letterSpacing: 5 }}>GAGGLE</div>
        </div>
        <div style={{ fontSize: 76, fontWeight: 800, color: "#0e2a3f", letterSpacing: -2.5, display: "flex" }}>
          One AI can convince itself.
        </div>
        <div style={{ fontSize: 33, fontWeight: 800, color: "#0e6aa0", marginTop: 16, display: "flex" }}>
          Ours has to survive the Gaggle.
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Jakarta", data: font, weight: 800, style: "normal" }] },
  );
}
