"use client";

import { useEffect, useRef } from "react";

// Microbiome co-occurrence network via Cytoscape.js + fCoSE (the lab-standard for
// this). Nodes = taxa (size = abundance, colour = phylum), clustered by phylum,
// amber border = a flag. Pan / zoom / drag built in. Sky/teal palette, no red.

const PHYLUM_HUE: Record<string, string> = {
  Firmicutes: "#15aeea", Bacteroidetes: "#037bb5", Actinobacteria: "#19b27a",
  Proteobacteria: "#7c6cf0", Verrucomicrobia: "#f4b21a",
  Fusobacteria: "#e08a3b", Euryarchaeota: "#9b7cc7",
  Fungi: "#d98f3b", Protozoa: "#c06cb8", Algae: "#2aa98a", Metazoa: "#8a8c5a", Host: "#8896a3",
  Bacteria: "#15aeea", Other: "#9aa7b2",
};
const FLAG = "#f4b21a";

function lighten(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  r = Math.round(r + (255 - r) * amt); g = Math.round(g + (255 - g) * amt); b = Math.round(b + (255 - b) * amt);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export function RNetwork({ abundance }: { abundance: any[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    let cy: any; let cancelled = false; let onResize: (() => void) | null = null;

    (async () => {
      const cytoscape = (await import("cytoscape")).default;
      const fcose = (await import("cytoscape-fcose")).default;
      try { cytoscape.use(fcose); } catch { /* already registered */ }
      if (cancelled || !ref.current) return;

      const W = ref.current.clientWidth || 600;
      const mobile = W < 560;
      const taxa = abundance.filter((a) => a.pct > 0.05);
      const maxPct = Math.max(...taxa.map((a: any) => a.pct), 1);
      // on phones only the most abundant taxa keep a permanent label (the rest
      // reveal on tap/hover) so nothing overlaps in the smaller canvas
      const keep = new Set(
        taxa.slice().sort((a: any, b: any) => b.pct - a.pct).slice(0, mobile ? 7 : taxa.length).map((a: any) => a.id)
      );
      const nodes = taxa.map((a: any) => {
        const color = PHYLUM_HUE[a.phylum] || "#19b27a";
        return {
          data: {
            id: a.id, label: a.species.split(" ")[0], full: a.species, phylum: a.phylum,
            pct: a.pct, status: a.status, size: 20 + 48 * Math.sqrt(a.pct / maxPct),
            color, grad: `${lighten(color, 0.45)} ${color}`, flag: a.status !== "ok" ? 1 : 0,
            showLabel: a.status !== "ok" || keep.has(a.id) ? 1 : 0,
          },
        };
      });
      const byPhylum: Record<string, any[]> = {};
      taxa.forEach((a: any) => { (byPhylum[a.phylum] ||= []).push(a); });
      const edges: any[] = [];
      Object.values(byPhylum).forEach((list) => {
        for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
          edges.push({ data: { id: `${list[i].id}_${list[j].id}`, source: list[i].id, target: list[j].id, color: PHYLUM_HUE[list[i].phylum] || "#19b27a" } });
        }
      });

      cy = cytoscape({
        container: ref.current,
        elements: [...nodes, ...edges],
        // cytoscape data() mappers don't satisfy the strict Stylesheet union; the
        // stylesheet is valid at runtime, so cast it.
        style: ([
          { selector: "node", style: {
            width: "data(size)", height: "data(size)",
            "background-fill": "radial-gradient", "background-gradient-stop-colors": "data(grad)", "background-gradient-stop-positions": "0 100",
            "border-width": 2, "border-color": "#ffffff",
            "underlay-color": "data(color)", "underlay-padding": 7, "underlay-opacity": 0.16, "underlay-shape": "ellipse",
            label: "data(label)", "font-size": mobile ? 9.5 : 11, "font-family": "ui-sans-serif, system-ui, sans-serif",
            "font-weight": 600, color: "#0e2a3f", "text-valign": "bottom", "text-margin-y": 4, "text-opacity": 0.86,
            "text-background-color": "#ffffff", "text-background-opacity": 0.72, "text-background-shape": "roundrectangle", "text-background-padding": 2,
            "transition-property": "border-color, border-width, underlay-opacity, opacity", "transition-duration": 0.18,
          } },
          { selector: "node[showLabel = 0]", style: { "text-opacity": 0 } },
          { selector: "node[flag = 1]", style: { "border-color": FLAG, "border-width": 3, "underlay-color": FLAG, "underlay-opacity": 0.22, "underlay-padding": 9 } },
          { selector: "edge", style: { width: 1.6, "line-color": "data(color)", "line-opacity": 0.22, "curve-style": "bezier" } },
          { selector: ".dim", style: { opacity: 0.1, "text-opacity": 0.06, "underlay-opacity": 0.03 } },
          { selector: ".hl", style: { "border-color": "#037bb5", "border-width": 3, "text-opacity": 1, "underlay-opacity": 0.32, "underlay-padding": 11 } },
        ] as any),
        layout: { name: "fcose", animate: true, animationDuration: 700, nodeRepulsion: mobile ? 7000 : 9500, idealEdgeLength: mobile ? 58 : 84, padding: mobile ? 16 : 28, randomize: true } as any,
        // wheel zoom is off so scrolling the page over the graph never traps; drag nodes + pan still work
        userZoomingEnabled: false, autoungrabify: false, autounselectify: true,
      });

      const tip = tipRef.current;
      cy.on("mouseover", "node", (e: any) => {
        const n = e.target;
        cy.elements().addClass("dim");
        n.removeClass("dim").addClass("hl");
        n.connectedEdges().removeClass("dim");
        n.connectedEdges().connectedNodes().removeClass("dim");
        if (tip) {
          const s = n.data("status");
          const tag = s === "low" ? " · low" : s === "high" ? " · high" : "";
          tip.innerHTML = `<b>${n.data("full")}</b><span>${n.data("pct").toFixed(1)}%${tag}</span>`;
          tip.style.opacity = "1";
        }
      });
      cy.on("mousemove", (e: any) => {
        if (tip && tip.style.opacity === "1") {
          const p = e.renderedPosition || { x: 0, y: 0 };
          tip.style.transform = `translate(${p.x + 14}px, ${p.y + 12}px)`;
        }
      });
      cy.on("mouseout", "node", () => {
        cy.elements().removeClass("dim hl");
        if (tip) tip.style.opacity = "0";
      });
      cy.ready(() => cy.fit(undefined, mobile ? 16 : 28));
      onResize = () => { try { cy.resize(); cy.fit(undefined, mobile ? 16 : 28); } catch { /* noop */ } };
      window.addEventListener("resize", onResize);
    })();

    return () => { cancelled = true; if (onResize) window.removeEventListener("resize", onResize); try { cy?.destroy(); } catch { /* noop */ } };
  }, [abundance]);

  return (
    <div className="rz-net-wrap">
      <div ref={ref} className="rz-net" />
      <div ref={tipRef} className="rz-net-tip" aria-hidden />
    </div>
  );
}
