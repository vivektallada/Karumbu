import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { MaskedLines } from "@/components/MaskedLines";
import { Reveal } from "@/components/Reveal";
import { Marquee } from "@/components/Marquee";

const FIELD_IMG =
  "https://images.unsplash.com/photo-1775619427924-16ff07cf2f2e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHwyfHxzdWdhcmNhbmUlMjBmaWVsZCUyMG1vcm5pbmd8ZW58MHx8fHwxNzg3MTk1MTQ0fDA&ixlib=rb-4.1.0&q=85";
const JAGGERY_IMG =
  "https://images.pexels.com/photos/11952642/pexels-photo-11952642.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
const COPPER_IMG =
  "https://images.unsplash.com/photo-1612846213933-916a1f56d859?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwxfHxjb3BwZXIlMjBnbGFzcyUyMHRyYWRpdGlvbmFsJTIwSW5kaWFuJTIwZHJpbmt8ZW58MHx8fHwxNzg3MTk1MTQ0fDA&ixlib=rb-4.1.0&q=85";

const chapters = [
  {
    number: "01",
    title: "The Field",
    body: "Our cane comes from family farms along the Kaveri delta, cut at first light when the stalks are coolest and sweetest. Nothing travels more than a morning before it is pressed.",
    image: FIELD_IMG,
    alt: "Sugarcane field under a clear sky",
  },
  {
    number: "02",
    title: "The Craft",
    body: "Jaggery is pounded, never refined. Dry ginger is sun-cured, cardamom cracked by hand. Panakam has been made this way for a thousand summers — we changed nothing.",
    image: JAGGERY_IMG,
    alt: "Jaggery crafted outdoors by hand",
  },
  {
    number: "03",
    title: "The Pour",
    body: "Every bottle is brewed in small batches, chilled over ice and poured the way it is at temple festivals — generous, cold and gone too soon.",
    image: COPPER_IMG,
    alt: "Copper kettle pouring panakam",
  },
];

export default function Story() {
  return (
    <div data-testid="story-page" className="pt-32 md:pt-40">
      <section data-testid="story-hero" className="px-6 md:px-16 lg:px-24">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Our Story</p>
        <h1 className="mt-6 font-serif text-[clamp(3rem,8vw,6.5rem)] font-light leading-[0.98] tracking-tight text-foreground">
          <MaskedLines
            lines={[
              <>Born in the cane belt,</>,
              <span className="italic text-primary">poured from memory.</span>,
            ]}
            delay={0.2}
          />
        </h1>
        <Reveal delay={0.3}>
          <p className="mt-12 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Karumbu means sugarcane in Tamil. It is also the word our founder's grandmother used
            when she called the grandchildren in from the fields — promising a brass tumbler of
            cold panakam waiting in the shade.
          </p>
        </Reveal>
      </section>

      <section data-testid="story-manifesto" className="px-6 py-24 md:px-16 md:py-32 lg:px-24">
        <Reveal>
          <p className="max-w-3xl font-serif text-3xl font-light leading-snug text-foreground md:text-5xl">
            We believe a drink can carry a place. Ours carries the delta —{" "}
            <span className="italic text-primary">its heat, its soil, its patience.</span>
          </p>
        </Reveal>
      </section>

      <section className="flex flex-col gap-24 px-6 pb-24 md:gap-32 md:px-16 md:pb-32 lg:px-24">
        {chapters.map((c, i) => (
          <div
            key={c.number}
            data-testid={`story-chapter-${c.number}`}
            className={`grid items-center gap-12 lg:grid-cols-12 ${
              i % 2 === 1 ? "" : ""
            }`}
          >
            <Reveal className={`lg:col-span-6 ${i % 2 === 1 ? "lg:order-2" : ""}`}>
              <div className="spotlight-frame group overflow-hidden border border-border">
                <img
                  src={c.image}
                  alt={c.alt}
                  data-testid={`chapter-image-${c.number}`}
                  className="h-[340px] w-full object-cover transition-transform duration-700 group-hover:scale-105 md:h-[460px]"
                />
              </div>
            </Reveal>
            <div className={`lg:col-span-6 ${i % 2 === 1 ? "lg:order-1" : ""}`}>
              <Reveal>
                <span className="chapter-number font-serif text-7xl font-light md:text-9xl">
                  {c.number}
                </span>
                <h2 className="mt-4 font-serif text-4xl font-light text-foreground md:text-5xl">
                  {c.title}
                </h2>
                <p className="mt-8 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
                  {c.body}
                </p>
              </Reveal>
            </div>
          </div>
        ))}
      </section>

      <Marquee />

      <section className="px-6 py-28 md:px-16 md:py-36 lg:px-24">
        <Reveal>
          <h2 className="max-w-3xl font-serif text-4xl font-light leading-tight text-foreground md:text-6xl">
            Taste what the field <span className="italic text-primary">tastes like.</span>
          </h2>
          <Link
            to="/products"
            data-testid="story-cta-products"
            className="group mt-12 inline-flex items-center gap-3 bg-primary px-8 py-4 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-accent"
          >
            See the Range
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
