import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// High-quality social share cover (1200x630) shown when the link is sent.
export const runtime = "nodejs";
export const alt = "GutGutGoose - Probiotics matched to your gut DNA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const font = await fetch(
    "https://cdn.jsdelivr.net/fontsource/fonts/plus-jakarta-sans@latest/latin-800-normal.ttf",
  ).then((r) => r.arrayBuffer());
  const goose = await readFile(join(process.cwd(), "public/brand/goose-only.png"));
  const gooseUri = `data:image/png;base64,${goose.toString("base64")}`;

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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={gooseUri} width={220} height={220} style={{ marginBottom: 26 }} alt="" />
        <div style={{ fontSize: 76, fontWeight: 800, color: "#0e2a3f", letterSpacing: -2.5, display: "flex" }}>
          GutGutGoose
        </div>
        <div style={{ fontSize: 33, fontWeight: 800, color: "#0e6aa0", marginTop: 16, display: "flex" }}>
          Probiotics matched to your gut DNA.
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Jakarta", data: font, weight: 800, style: "normal" }] },
  );
}
