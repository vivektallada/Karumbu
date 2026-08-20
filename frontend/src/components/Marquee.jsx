import { Sprout } from "lucide-react";

const items = [
  "100% Pure Cane",
  "Handcrafted Jaggery",
  "South Indian Heritage",
  "No Refined Sugar",
  "Small Batch Brews",
  "Kaveri Delta Grown",
];

export const Marquee = () => (
  <div
    data-testid="editorial-marquee"
    className="overflow-hidden border-y border-border bg-[#F4EBE1] py-5"
  >
    <div className="animate-marquee flex w-max">
      {[0, 1].map((copy) => (
        <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
          {items.map((text, i) => (
            <span key={i} className="flex items-center">
              <span className="whitespace-nowrap px-12 font-serif text-lg italic text-[#0A100C] md:text-xl">
                {text}
              </span>
              <Sprout className="h-4 w-4 shrink-0 text-[#A35117]" />
            </span>
          ))}
        </div>
      ))}
    </div>
  </div>
);
