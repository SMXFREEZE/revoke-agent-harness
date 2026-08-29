"use client";

import { useState } from "react";
import { RWordReveal } from "./reveal";
import { FAQS } from "@/lib/data/site";

export function RFaq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="rz-sec" id="faq">
      <div className="rz-card-w">
        <div className="rz-faq">
          <header className="rz-faq__head">
            <span className="rz-eyebrow">FAQ</span>
            <RWordReveal as="h2" className="rz-h2" text="Frequently asked questions." />
          </header>
          <div className="rz-faq__list">
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <div className="rz-faq__item" key={f.q} data-open={isOpen}>
                  <button
                    className="rz-faq__q"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    <span className="rz-faq__q-text">{f.q}</span>
                    <span className="rz-faq__icon" aria-hidden />
                  </button>
                  <div className="rz-faq__a" role="region">
                    <div>
                      <p>{f.a}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
