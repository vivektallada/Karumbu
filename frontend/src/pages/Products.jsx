import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { ArrowRight, MessageCircle, IndianRupee, Loader2 } from "lucide-react";
import { waLink } from "@/lib/wa";
import { mediaUrl } from "@/lib/media";
import { MaskedLines } from "@/components/MaskedLines";
import { Reveal } from "@/components/Reveal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Products() {
  const [products, setProducts] = useState([]);
  const [payState, setPayState] = useState({});

  const setPay = (slug, patch) =>
    setPayState((s) => ({ ...s, [slug]: { quantity: 1, ...(s[slug] || {}), ...patch } }));

  const togglePay = (slug) =>
    setPayState((s) => ({ ...s, [slug]: { quantity: 1, ...(s[slug] || {}), open: !s[slug]?.open } }));

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const startPay = async (p) => {
    const f = payState[p.slug] || {};
    if (!f.name || f.name.trim().length < 2 || !f.phone || f.phone.trim().length < 7) {
      toast.error("Please enter your name and phone to pay.");
      return;
    }
    setPay(p.slug, { loading: true });
    try {
      const ok = await loadRazorpay();
      if (!ok) throw new Error("script");
      const { data } = await axios.post(`${API}/payments/order`, {
        product: p.slug,
        quantity: Number(f.quantity || 1),
        name: f.name.trim(),
        phone: f.phone.trim(),
      });
      const rzp = new window.Razorpay({
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: "KARUMBU",
        description: `${data.product_name} × ${f.quantity || 1}`,
        prefill: { name: f.name.trim(), contact: f.phone.trim() },
        theme: { color: "#C86A23" },
        handler: async (res) => {
          try {
            await axios.post(`${API}/payments/verify`, res);
            toast.success("Payment received — your order is confirmed! We will call you shortly.");
            setPayState((s) => ({ ...s, [p.slug]: { quantity: 1, open: false } }));
          } catch {
            toast.error("Payment verification failed. Please reach us on WhatsApp.");
          }
        },
      });
      rzp.open();
    } catch (err) {
      if (err.response?.status === 503) {
        toast.error("Online payments are being set up — please use WhatsApp or the enquiry form for now.");
      } else {
        toast.error("Could not start payment. Please try again.");
      }
    } finally {
      setPay(p.slug, { loading: false });
    }
  };

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
                  <button
                    data-testid={`pay-now-${p.slug}`}
                    onClick={() => togglePay(p.slug)}
                    className="flex items-center justify-center gap-2 border border-primary bg-primary/10 px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    <IndianRupee className="h-3.5 w-3.5" />
                    Pay Now
                  </button>
                  {payState[p.slug]?.open && (
                    <div data-testid={`pay-form-${p.slug}`} className="flex flex-col gap-3 border border-border bg-background p-4">
                      <input
                        data-testid={`pay-name-${p.slug}`}
                        value={payState[p.slug]?.name || ""}
                        onChange={(e) => setPay(p.slug, { name: e.target.value })}
                        placeholder="Your name"
                        className="border border-border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none"
                      />
                      <input
                        data-testid={`pay-phone-${p.slug}`}
                        value={payState[p.slug]?.phone || ""}
                        onChange={(e) => setPay(p.slug, { phone: e.target.value })}
                        placeholder="Phone number"
                        className="border border-border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none"
                      />
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          data-testid={`pay-quantity-${p.slug}`}
                          value={payState[p.slug]?.quantity ?? 1}
                          onChange={(e) => setPay(p.slug, { quantity: e.target.value })}
                          className="w-20 border border-border bg-muted px-3 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none"
                        />
                        <button
                          data-testid={`pay-submit-${p.slug}`}
                          onClick={() => startPay(p)}
                          disabled={payState[p.slug]?.loading}
                          className="flex flex-1 items-center justify-center gap-2 bg-primary px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-accent disabled:opacity-60"
                        >
                          {payState[p.slug]?.loading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <IndianRupee className="h-3.5 w-3.5" />
                          )}
                          Pay ₹{p.price * Number(payState[p.slug]?.quantity || 1)}
                        </button>
                      </div>
                    </div>
                  )}
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
