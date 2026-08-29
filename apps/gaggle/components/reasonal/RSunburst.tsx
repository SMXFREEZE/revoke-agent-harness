"use client";

import { useEffect, useRef } from "react";

// Krona-style hierarchical sunburst via Apache ECharts, tuned to look like an
// Apple Health ring: each phylum is one hue, its species fan out as tonal shades
// of that hue, segments have rounded corners + clean white gaps, a focal center
// label names the dominant phylum, and an amber rim marks a flagged species.
// Fully responsive: label sizes + how many labels show scale with the container
// width so nothing ever overlaps on phones. Loaded lazily.

const PHYLUM_HUE: Record<string, string> = {
  Firmicutes: "#13a7e6", Bacteroidetes: "#0570ad", Actinobacteria: "#17b083",
  Proteobacteria: "#7b66f2", Verrucomicrobia: "#f2a81d",
  Fusobacteria: "#e08a3b", Euryarchaeota: "#9b7cc7",
  Fungi: "#d98f3b", Protozoa: "#c06cb8", Algae: "#2aa98a", Metazoa: "#8a8c5a", Host: "#8896a3",
  Bacteria: "#13a7e6", Other: "#9aa7b2",
};
const FLAG = "#f4b21a";
const INK = "#0e2a3f";

function rgb(h: string) { h = h.replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function hex(r: number, g: number, b: number) { const c = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0"); return `#${c(r)}${c(g)}${c(b)}`; }
function lighten(h: string, amt: number) { const [r, g, b] = rgb(h); return hex(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt); }
function lum(h: string) { const [r, g, b] = rgb(h); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
function labelInk(h: string) { return lum(h) > 0.62 ? INK : "#ffffff"; }

export function RSunburst({ abundance }: { abundance: any[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    let chart: any; let cancelled = false; let onResize: (() => void) | null = null; let lastW = 0;

    (async () => {
      const echarts = await import("echarts/core");
      const { SunburstChart } = await import("echarts/charts");
      const { TooltipComponent, GraphicComponent } = await import("echarts/components");
      const { CanvasRenderer } = await import("echarts/renderers");
      echarts.use([SunburstChart, TooltipComponent, GraphicComponent, CanvasRenderer]);
      if (cancelled || !ref.current) return;

      chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
      const taxa = abundance.filter((a) => a.pct > 0.05);
      const byPhylum: Record<string, any[]> = {};
      taxa.forEach((a: any) => { (byPhylum[a.phylum] ||= []).push(a); });
      const total = taxa.reduce((s, a) => s + a.pct, 0) || 1;
      const order = Object.keys(byPhylum).sort((x, y) => byPhylum[y].reduce((s, a) => s + a.pct, 0) - byPhylum[x].reduce((s, a) => s + a.pct, 0));
      const dom = order[0];
      const domPct = dom ? Math.round((byPhylum[dom].reduce((s, a) => s + a.pct, 0) / total) * 100) : 0;

      // build the option for a given container width so phones drop tiny labels
      const buildOption = (w: number) => {
        const small = w < 560, tiny = w < 400;
        const spFont = tiny ? 8.5 : small ? 9.5 : 10.5;     // species label size
        const phFont = tiny ? 9.5 : small ? 10.5 : 11.5;    // phylum label size
        const spMinAngle = tiny ? 14 : small ? 10 : 6;      // hide thin species labels first on phones
        const phShareMin = tiny ? 2 : small ? 0.16 : 0.12;  // on tiny screens drop inner labels (legend + center name them)
        const ctr = tiny ? 18 : small ? 20 : 23;            // center % font
        // on phones, only the most abundant species keep a label (the rest show
        // on tap) so radial labels never collide in the smaller canvas
        const topK = tiny ? 5 : small ? 8 : Infinity;
        const sortedPct = taxa.map((a) => a.pct).sort((x, y) => y - x);
        const kThresh = sortedPct.length > topK ? sortedPct[topK - 1] : 0;

        const data = order.map((ph) => {
          const base = PHYLUM_HUE[ph] || "#17b083";
          const kids = byPhylum[ph].slice().sort((a, b) => b.pct - a.pct);
          const share = kids.reduce((s, a) => s + a.pct, 0) / total;
          return {
            name: ph,
            itemStyle: { color: base, borderColor: "#ffffff", borderWidth: 3 },
            label: { show: false },
            children: kids.map((a: any, i: number) => {
              const shade = lighten(base, kids.length > 1 ? 0.04 + (i / (kids.length - 1)) * 0.5 : 0.16);
              const flagged = a.status !== "ok";
              return {
                name: a.species, value: a.pct,
                itemStyle: { color: shade, borderColor: flagged ? FLAG : "#ffffff", borderWidth: flagged ? 2.5 : 2 },
                label: { show: false },
              };
            }),
          };
        });

        return {
          animationDuration: 1100, animationEasing: "cubicOut",
          tooltip: {
            trigger: "item", backgroundColor: "rgba(255,255,255,0.94)", borderWidth: 0, padding: [9, 13],
            textStyle: { color: INK, fontSize: 12.5 },
            extraCssText: "border-radius:13px;box-shadow:0 10px 34px rgba(3,123,181,0.22);backdrop-filter:blur(8px);",
            formatter: (p: any) => {
              const path = (p.treePathInfo || []).slice(1).map((t: any) => t.name).join(" &rsaquo; ");
              const v = typeof p.value === "number" ? `<b style="font-size:15px">${p.value.toFixed(1)}%</b>` : "";
              return `<div style="font-weight:600">${path || p.name}</div>${v}`;
            },
          },
          graphic: [
            { type: "text", left: "center", top: "45%", z: 20, style: { text: `${domPct}%`, font: `700 ${ctr}px ui-sans-serif, system-ui, sans-serif`, fill: INK, textAlign: "center" } },
            { type: "text", left: "center", top: "54%", z: 20, style: { text: dom || "", font: `600 ${tiny ? 9 : 11}px ui-sans-serif, system-ui, sans-serif`, fill: "#6a869a", textAlign: "center" } },
          ],
          series: [{
            type: "sunburst", radius: ["26%", "97%"], center: ["50%", "50%"], data,
            sort: undefined, nodeClick: "rootToNode", animationDurationUpdate: 700,
            emphasis: { focus: "ancestor" },
            itemStyle: { borderColor: "#ffffff", borderWidth: 2, borderRadius: 5 },
            blur: { itemStyle: { opacity: 0.32 } },
            // names live in the legend + hover tooltip, the rings stay clean
            label: { show: false },
            levels: [
              {},
              { r0: "27%", r: "51%", label: { rotate: "tangential", fontWeight: 700, minAngle: 30 },
                itemStyle: { borderWidth: 3, borderRadius: 6, shadowBlur: 16, shadowColor: "rgba(8,40,63,0.14)", shadowOffsetY: 2 } },
              { r0: "53%", r: "96%", label: { align: "right", padding: 3 },
                itemStyle: { borderRadius: 4, shadowBlur: 10, shadowColor: "rgba(8,40,63,0.10)", shadowOffsetY: 1 } },
            ],
          }],
        };
      };

      lastW = ref.current.clientWidth || 360;
      chart.setOption(buildOption(lastW));

      onResize = () => {
        if (!chart || !ref.current) return;
        const w = ref.current.clientWidth || lastW;
        chart.resize();
        // re-tune labels only when the width crosses a breakpoint band
        const band = (x: number) => (x < 400 ? 0 : x < 560 ? 1 : 2);
        if (band(w) !== band(lastW)) chart.setOption(buildOption(w), { lazyUpdate: true });
        lastW = w;
      };
      window.addEventListener("resize", onResize);
    })();

    return () => {
      cancelled = true;
      if (onResize) window.removeEventListener("resize", onResize);
      try { chart?.dispose(); } catch { /* noop */ }
    };
  }, [abundance]);

  return <div ref={ref} className="rz-echart" />;
}
