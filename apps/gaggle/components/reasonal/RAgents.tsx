"use client";

import { createRef, useRef } from "react";
import { RWordReveal } from "./reveal";
import { AnimatedBeam, Circle, Icons } from "@/components/ui/animated-beam";
import { cn } from "@/lib/utils/cn";

// "Built for agents": the magic-ui / ui-layouts multiple-output beam diagram.
// The real toolchain we used feeds the central GutGutGoose hub, which streams the
// answer out to you: live data (NCBI, PubMed), the viz libraries (Cytoscape,
// ECharts) and the framework (Next.js, React). Real logos, not placeholders.
const NODES: { key: keyof typeof Icons; pad?: string }[] = [
  { key: "ncbi" }, { key: "pubmed" }, { key: "cytoscape", pad: "p-2.5" }, { key: "echarts", pad: "p-3" },
];
function AnimatedBeamMultipleOutput({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(NODES.map(() => createRef<HTMLDivElement>())).current;
  return (
    <div
      className={cn(
        "relative flex w-full max-w-[500px] mx-auto items-center justify-center overflow-hidden rounded-lg border bg-muted lg:p-10 sm:p-4 p-2 md:shadow-xl",
        className
      )}
      ref={containerRef}
    >
      <div className="flex h-full w-full flex-row items-stretch justify-between gap-10">
        <div className="flex flex-col justify-center">
          <Circle ref={userRef}>
            <Icons.user />
          </Circle>
        </div>
        <div className="flex flex-col justify-center">
          <Circle ref={hubRef} className="h-[88px] w-[88px] p-1">
            <Icons.logo />
          </Circle>
        </div>
        <div className="flex flex-col justify-center gap-2">
          {NODES.map((n, i) => {
            const Ico = Icons[n.key];
            return (
              <Circle key={n.key} ref={nodeRefs[i]} className={n.pad || ""}>
                <Ico />
              </Circle>
            );
          })}
        </div>
      </div>

      {nodeRefs.map((ref, i) => (
        <AnimatedBeam key={i} containerRef={containerRef} fromRef={ref} toRef={hubRef} duration={3} />
      ))}
      <AnimatedBeam containerRef={containerRef} fromRef={hubRef} toRef={userRef} duration={3} />
    </div>
  );
}

export function RAgents() {
  return (
    <section className="rz-sec" id="agents">
      <div className="rz-card-w">
        <div className="rz-agents">
          <div className="rz-agents__copy">
            <span className="kick" style={{ color: "#0e8fd0" }}>Built for agents</span>
            <RWordReveal as="h2" className="rz-agents__title" text="Your gut report, available to any AI." />
            <p className="rz-agents__lead">The whole platform is a Model Context Protocol server, so Claude, Cursor or any MCP agent can analyse a sample, read the report, then reach into live <b>PubMed</b> and <b>ClinicalTrials.gov</b> to back a flagged microbe with real published research and active trials. Nothing is mocked: the classifier runs live and every citation is a real PubMed record or registered trial.</p>
            <p className="rz-agents__note">
              <span className="rz-agents__notedot" aria-hidden />
              Point any MCP client at <code>mcp/gutgutgoose-server.mjs</code>
            </p>
          </div>

          <AnimatedBeamMultipleOutput className="rz-agents__beamcard" />
        </div>
      </div>
    </section>
  );
}
