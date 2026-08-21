import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight, MessageCircle } from "lucide-react";
import { waLink } from "@/lib/wa";
import { mediaUrl } from "@/lib/media";
import { MaskedLines } from "@/components/MaskedLines";
import { Reveal } from "@/components/Reveal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Products() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios
      .get(`${API}/products`)
      .then((r) => setProducts(r.data))
      .catch(() => {});
  }, []);

  return (
    <div data-testid="products-page" className="pt-32 md:pt-40">
      <section className="px-6 md:px-16 lg:px-24">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">The Range</p>
        <h1 className="mt-6 font-serif text-[clamp(3rem,8vw,6.5rem)] font-light leading-[0.98] tracking-tight text-foreground">
          <MaskedLines
            lines={[
              <>Small batch.</>,
              <span className="italic text-primary">Big field energy.</span>,
            ]}
            delay={0.2}
          />
        </h1>
        <Reveal delay={0.3}>
          <p className="mt-12 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Every variant starts with the same morning-pressed cane. What changes is the spice,
            the steep, and the story it tells.
          </p>
        </Reveal>
      </section>

      <section data-testid="products-grid" className="px-6 py-24 md:px-16 md:py-32 lg:px-24">
        <div className="grid gap-px border border-border bg-border md:grid-cols-3">
          {products.map((p, i) => (
            <div
              key={p.slug}
              data-testid={`product-card-${p.slug}`}
              className="group flex flex-col bg-muted transition-colors hover:bg-secondary"
            >
              <div className="spotlight-frame overflow-hidden">
                <img
                  src={mediaUrl(p.image)}
                  alt={p.name}
                  data-testid={`product-image-${p.slug}`}
                  className="h-64 w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-8">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-primary">{p.badge}</p>
                  <p className="text-xs text-muted-foreground">{p.unit}</p>
                </div>
                <h2 className="mt-4 font-serif text-3xl font-light text-foreground">{p.name}</h2>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">{p.tagline}</p>
                <p className="mt-6 flex-1 text-sm leading-relaxed text-muted-foreground">{p.description}</p>
                <div className="mt-8 flex items-center justify-between">
                  <p className="font-serif text-3xl text-primary">₹{p.price}</p>
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  <Link
                    to={`/contact?product=${p.slug}`}
                    data-testid={`add-to-order-${p.slug}`}
                    className="group/btn flex items-center justify-center gap-2 bg-primary px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-accent"
                  >
                    Add to Order
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </Link>
                  <a
                    href={waLink(`Hi KARUMBU! I'd like to order ${p.name} (₹${p.price} / ${p.unit}).`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid={`whatsapp-order-${p.slug}`}
                    className="flex items-center justify-center gap-2 border border-border px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp Order
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Reveal delay={0.15}>
          <p className="mt-10 text-xs text-muted-foreground">
            Prices include chilled delivery within Tamil Nadu. Cases of 12+ get festival pricing — mention it in your enquiry.
          </p>
        </Reveal>
      </section>
    </div>
  );
}
