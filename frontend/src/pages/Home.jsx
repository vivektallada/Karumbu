import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight, ArrowDown } from "lucide-react";
import { CaneScene } from "@/components/CaneScene";
import { MaskedLines } from "@/components/MaskedLines";
import { Reveal } from "@/components/Reveal";
import { Marquee } from "@/components/Marquee";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const JAGGERY_IMG =
  "https://images.pexels.com/photos/11952642/pexels-photo-11952642.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
const COPPER_IMG =
  "https://images.unsplash.com/photo-1612846213933-916a1f56d859?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NjV8MHwxfHNlYXJjaHwxfHxjb3BwZXIlMjBnbGFzcyUyMHRyYWRpdGlvbmFsJTIwSW5kaWFuJTIwZHJpbmt8ZW58MHx8fHwxNzg3MTk1MTQ0fDA&ixlib=rb-4.1.0&q=85";

export default function Home() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios
      .get(`${API}/products`)
      .then((r) => setProducts(r.data))
      .catch(() => {});
  }, []);

  return (
    <div data-testid="home-page">
      <section data-testid="hero-section" className="relative min-h-screen overflow-hidden">
        <CaneScene />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#0A100C_94%)]" />
        <div className="pointer-events-none relative z-10 flex min-h-screen flex-col justify-end px-6 pb-20 md:px-16 md:pb-24 lg:px-24">
          <p
            data-testid="hero-overline"
            className="mb-6 text-xs uppercase tracking-[0.3em] text-primary md:text-sm"
          >
            Karumbu · Sugarcane Panakam
          </p>
          <h1 className="font-serif text-[clamp(3rem,9vw,7rem)] font-light leading-[0.95] tracking-tight text-foreground">
            <MaskedLines
              lines={[
                <>The field,</>,
                <span className="italic text-primary">in a glass.</span>,
              ]}
              delay={0.25}
            />
          </h1>
          <div className="mt-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <p
              data-testid="hero-subcopy"
              className="max-w-md text-sm leading-relaxed text-muted-foreground md:text-base"
            >
              Cold-pressed cane, hand-pounded jaggery, dry ginger and cardamom — a South Indian
              classic, brewed in small batches along the Kaveri delta.
            </p>
            <div className="pointer-events-auto flex flex-wrap items-center gap-4">
              <Link
                to="/products"
                data-testid="hero-cta-products"
                className="group flex items-center gap-3 bg-primary px-7 py-3.5 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-accent"
              >
                Explore the Range
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                to="/story"
                data-testid="hero-cta-story"
                className="border border-border px-7 py-3.5 text-xs uppercase tracking-[0.2em] text-foreground transition-colors hover:border-primary hover:text-primary"
              >
                Our Story
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-20 right-6 z-10 hidden flex-col items-center gap-3 md:right-16 lg:right-24 md:flex">
          <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground [writing-mode:vertical-lr]">
            Scroll
          </span>
          <div className="h-16 w-px overflow-hidden bg-border">
            <div className="animate-scroll-cue h-full w-full bg-primary" />
          </div>
          <ArrowDown className="h-3.5 w-3.5 text-primary" />
        </div>
      </section>

      <Marquee />

      <section data-testid="story-preview-section" className="px-6 py-24 md:px-16 md:py-32 lg:px-24">
        <div className="grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <div className="spotlight-frame group overflow-hidden border border-border">
              <img
                src={JAGGERY_IMG}
                alt="Jaggery being crafted by hand"
                data-testid="story-preview-image"
                className="h-[420px] w-full object-cover transition-transform duration-700 group-hover:scale-105 md:h-[520px]"
              />
            </div>
          </Reveal>
          <div className="flex flex-col justify-center lg:col-span-5">
            <Reveal>
              <p className="text-xs uppercase tracking-[0.3em] text-primary">Our Story</p>
              <h2 className="mt-6 font-serif text-4xl font-light leading-tight text-foreground md:text-5xl">
                Jaggery pounded by hand, cane pressed at dawn.
              </h2>
            </Reveal>
            <Reveal delay={0.15}>
              <p className="mt-8 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
                Panakam has cooled South Indian summers for a thousand years. We bottle it the way
                our grandmothers brewed it — no refined sugar, no shortcuts, nothing the field
                did not give us.
              </p>
              <Link
                to="/story"
                data-testid="story-preview-link"
                className="group mt-10 inline-flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-foreground transition-colors hover:text-primary"
              >
                Read the full story
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      <section data-testid="spotlight-section" className="border-t border-border px-6 py-24 md:px-16 md:py-32 lg:px-24">
        <Reveal>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h2 className="font-serif text-4xl font-light leading-tight text-foreground md:text-6xl">
              The <span className="italic text-primary">range.</span>
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              Three pours, one field. Brewed weekly, chilled over ice, gone too soon.
            </p>
          </div>
        </Reveal>
        <div className="mt-16 grid gap-8 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <div className="spotlight-frame group h-full overflow-hidden border border-border">
              <img
                src={COPPER_IMG}
                alt="Copper kettle pouring panakam"
                data-testid="spotlight-image"
                className="h-[320px] w-full object-cover transition-transform duration-700 group-hover:scale-105 lg:h-full"
              />
            </div>
          </Reveal>
          <div className="flex flex-col gap-px border border-border bg-border lg:col-span-7">
            {products.map((p, i) => (
              <Reveal key={p.slug} delay={i * 0.1}>
                <div
                  data-testid={`product-card-${p.slug}`}
                  className="group flex flex-col gap-6 bg-muted p-8 transition-colors hover:bg-secondary md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-primary">{p.badge}</p>
                    <h3 className="mt-2 font-serif text-3xl font-light text-foreground">{p.name}</h3>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">{p.tagline}</p>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="font-serif text-2xl text-primary">₹{p.price}</p>
                      <p className="text-xs text-muted-foreground">{p.unit}</p>
                    </div>
                    <Link
                      to={`/contact?product=${p.slug}`}
                      data-testid={`add-to-order-${p.slug}`}
                      className="border border-primary px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary hover:text-white"
                    >
                      Order
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section data-testid="cta-band" className="border-t border-border px-6 py-28 md:px-16 md:py-40 lg:px-24">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Small batches, weekly</p>
          <h2 className="mt-6 max-w-3xl font-serif text-5xl font-light leading-[1.05] text-foreground md:text-7xl">
            Thirsty <span className="italic text-primary">yet?</span>
          </h2>
          <Link
            to="/contact"
            data-testid="cta-order-button"
            className="group mt-12 inline-flex items-center gap-3 bg-primary px-8 py-4 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-accent"
          >
            Order a Batch
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Reveal>
      </section>
    </div>
  );
}
