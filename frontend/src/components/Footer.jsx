import { Link } from "react-router-dom";
import { Sprout, MessageCircle } from "lucide-react";
import { waLink } from "@/lib/wa";

export const Footer = () => {
  return (
    <footer data-testid="site-footer" className="border-t border-border bg-muted">
      <div className="grid gap-12 px-6 py-16 md:grid-cols-3 md:px-16 lg:px-24">
        <div>
          <p className="font-serif text-2xl tracking-[0.18em] text-foreground">KARUMBU</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Sugarcane panakam brewed in small batches along the Kaveri delta. The field, in a glass.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Explore</p>
          <div className="mt-4 flex flex-col gap-3">
            <Link to="/story" data-testid="footer-story-link" className="text-sm text-foreground transition-colors hover:text-primary">Our Story</Link>
            <Link to="/products" data-testid="footer-products-link" className="text-sm text-foreground transition-colors hover:text-primary">The Range</Link>
            <Link to="/contact" data-testid="footer-contact-link" className="text-sm text-foreground transition-colors hover:text-primary">Order & Contact</Link>
            <Link to="/admin/login" data-testid="footer-admin-link" className="text-sm text-muted-foreground transition-colors hover:text-primary">Admin Panel</Link>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Reach Us</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-foreground">
            <span data-testid="footer-email">karumbu09@gmail.com</span>
            <span data-testid="footer-phone">+91 91217 44996</span>
            <a
              href={waLink("Hi KARUMBU! I'd like to place an order.")}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="footer-whatsapp-link"
              className="flex items-center gap-2 text-foreground transition-colors hover:text-primary"
            >
              <MessageCircle className="h-3.5 w-3.5 text-primary" /> Chat on WhatsApp
            </a>
            <span className="text-muted-foreground">Rajamundry, Andhra Pradesh</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border px-6 py-6 md:px-16 lg:px-24">
        <p className="text-xs text-muted-foreground">© 2026 Karumbu Beverages</p>
        <Sprout className="h-4 w-4 text-primary" />
      </div>
    </footer>
  );
};
