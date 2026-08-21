import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, Send, MessageCircle } from "lucide-react";
import { waLink } from "@/lib/wa";
import { MaskedLines } from "@/components/MaskedLines";
import { Reveal } from "@/components/Reveal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SIDE_IMG =
  "https://images.pexels.com/photos/12741759/pexels-photo-12741759.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const inputClass =
  "w-full border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none";
const labelClass = "mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground";

export default function Contact() {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    product: "",
    quantity: 6,
    message: "",
  });

  useEffect(() => {
    axios
      .get(`${API}/products`)
      .then((r) => setProducts(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const p = searchParams.get("product");
    if (p) setForm((f) => ({ ...f, product: p }));
  }, [searchParams]);

  useEffect(() => {
    const token = localStorage.getItem("karumbu_customer_token");
    if (!token) return;
    axios
      .get(`${API}/auth/customer/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) =>
        setForm((f) => ({ ...f, name: r.data.name || f.name, phone: r.data.phone || f.phone }))
      )
      .catch(() => {});
  }, []);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem("karumbu_customer_token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(`${API}/enquiries`, { ...form, quantity: Number(form.quantity) }, { headers });
      toast.success("Enquiry received — we will call you back within a day.");
      setForm({ name: "", phone: "", product: "", quantity: 6, message: "" });
    } catch {
      toast.error("Could not send your enquiry. Please check the details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="contact-page" className="pt-32 md:pt-40">
      <section className="px-6 md:px-16 lg:px-24">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Order & Contact</p>
        <h1 className="mt-6 font-serif text-[clamp(3rem,8vw,6.5rem)] font-light leading-[0.98] tracking-tight text-foreground">
          <MaskedLines
            lines={[
              <>Bring the field</>,
              <span className="italic text-primary">to your door.</span>,
            ]}
            delay={0.2}
          />
        </h1>
      </section>

      <section className="grid gap-12 px-6 py-24 md:px-16 md:py-32 lg:grid-cols-2 lg:px-24">
        <Reveal>
          <div className="spotlight-frame group relative h-full min-h-[360px] overflow-hidden border border-border">
            <img
              src={SIDE_IMG}
              alt="A glass of amber panakam"
              data-testid="contact-side-image"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A100C]/90 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-8">
              <p className="text-xs uppercase tracking-[0.3em] text-primary">Reach Us</p>
              <p className="mt-4 font-serif text-2xl font-light text-foreground">karumbu09@gmail.com</p>
              <p className="mt-1 text-sm text-muted-foreground">+91 91217 44996 · Thanjavur, Tamil Nadu</p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <form
            data-testid="contact-form"
            onSubmit={submit}
            className="flex flex-col gap-6 border border-border bg-muted p-8 md:p-10"
          >
            <div>
              <label htmlFor="name" className={labelClass}>Your Name</label>
              <input
                id="name"
                data-testid="contact-name-input"
                required
                minLength={2}
                value={form.name}
                onChange={update("name")}
                placeholder="Meenakshi Raman"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>Phone</label>
              <input
                id="phone"
                data-testid="contact-phone-input"
                required
                minLength={7}
                maxLength={15}
                value={form.phone}
                onChange={update("phone")}
                placeholder="+91 98XXX XXXXX"
                className={inputClass}
              />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="product" className={labelClass}>Brew</label>
                <select
                  id="product"
                  data-testid="contact-product-select"
                  required
                  value={form.product}
                  onChange={update("product")}
                  className={inputClass}
                >
                  <option value="" disabled>Choose a brew</option>
                  {products.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name} — ₹{p.price}
                    </option>
                  ))}
                  <option value="assorted-case">Assorted Case (all three)</option>
                </select>
              </div>
              <div>
                <label htmlFor="quantity" className={labelClass}>Quantity (bottles)</label>
                <input
                  id="quantity"
                  data-testid="contact-quantity-input"
                  type="number"
                  required
                  min={1}
                  max={1000}
                  value={form.quantity}
                  onChange={update("quantity")}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label htmlFor="message" className={labelClass}>Message (optional)</label>
              <textarea
                id="message"
                data-testid="contact-message-input"
                rows={4}
                value={form.message}
                onChange={update("message")}
                placeholder="Delivery area, festival dates, bulk orders…"
                className={`${inputClass} resize-none`}
              />
            </div>
            <button
              type="submit"
              data-testid="submit-order-button"
              disabled={loading}
              className="group mt-2 flex items-center justify-center gap-3 bg-primary px-8 py-4 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  Send Enquiry
                  <Send className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
            <a
              href={waLink("Hi KARUMBU! I'd like to place an order.")}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="contact-whatsapp-button"
              className="flex items-center justify-center gap-3 border border-border px-8 py-4 text-xs uppercase tracking-[0.2em] text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <MessageCircle className="h-4 w-4" />
              Or order instantly on WhatsApp
            </a>
            <p className="text-xs text-muted-foreground">
              We reply within one working day. No spam — only panakam.
            </p>
          </form>
        </Reveal>
      </section>
    </div>
  );
}
