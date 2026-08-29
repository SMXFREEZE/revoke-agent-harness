import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EmblaOptionsType } from "embla-carousel";
import { ProgramCard } from "@/components/player/ProgramCard";
import { programsByCategory, type Category } from "@/lib/data/catalog";
import {
  Carousel,
  SliderContainer,
  Slider,
  SliderPrevButton,
  SliderNextButton,
} from "@/components/ui/uilayouts/carousel";

const THEME: Record<string, string> = {
  fitness: "violet", dance: "pink", yoga: "teal", mindfulness: "sun",
  meditation: "plum", sports: "coral", "martial-arts": "sky",
};

const OPTIONS: EmblaOptionsType = {
  loop: false,
  align: "start",
  dragFree: true,
  containScroll: "trimSnaps",
};

export function Shelf({ category }: { category: Category }) {
  const programs = programsByCategory(category.id);
  if (!programs.length) return null;

  return (
    <section className="rz-w-shelf" data-theme={THEME[category.id] ?? "violet"} id={`shelf-${category.id}`}>
      <div className="rz-w-shelf__head">
        <div>
          <h3 className="rz-w-shelf__title">
            <span className="rz-w-shelf__dot" aria-hidden />
            {category.name}
            <span className="w2-shelf-count">{programs.length}</span>
          </h3>
          <p className="rz-w-shelf__tag">{category.tagline}</p>
        </div>
        <Link href={`/watch/${category.id}`} className="rz-w-shelf__all w2-shelf-link">
          See all
          <span className="w2-shelf-all__arrow" aria-hidden>→</span>
        </Link>
      </div>

      {/* ui-layouts Carousel (Embla): drag, snap, keyboard arrows, auto-disabling buttons */}
      <Carousel options={OPTIONS} className="rz-w-carousel">
        <SliderContainer className="rz-w-carousel__track gap-4">
          {programs.map((p) => (
            <Slider key={p.id} className="rz-w-slide">
              <ProgramCard program={p} />
            </Slider>
          ))}
        </SliderContainer>
        <SliderPrevButton className="rz-w-arrow rz-w-arrow--prev" aria-label={`Scroll ${category.name} left`}>
          <ChevronLeft strokeWidth={2.4} aria-hidden />
        </SliderPrevButton>
        <SliderNextButton className="rz-w-arrow rz-w-arrow--next" aria-label={`Scroll ${category.name} right`}>
          <ChevronRight strokeWidth={2.4} aria-hidden />
        </SliderNextButton>
      </Carousel>
    </section>
  );
}
