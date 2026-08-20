import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/story", label: "Story" },
  { to: "/products", label: "Products" },
  { to: "/contact", label: "Contact" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <header
      data-testid="site-header"
      className="fixed inset-x-0 top-0 z-50 border-b border-border bg-[#0A100C]/70 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between px-6 py-4 md:px-16 lg:px-24">
        <Link
          to="/"
          data-testid="brand-logo"
          className="font-serif text-2xl font-medium tracking-[0.18em] text-foreground transition-colors hover:text-primary"
        >
          KARUMBU
        </Link>
        <nav data-testid="desktop-nav" className="hidden items-center gap-10 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              data-testid={`nav-${l.label.toLowerCase()}-link`}
              className={`text-xs uppercase tracking-[0.2em] transition-colors ${
                pathname === l.to
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to="/contact"
            data-testid="nav-order-button"
            className="border border-primary px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary hover:text-white"
          >
            Order Now
          </Link>
        </nav>
        <button
          data-testid="mobile-menu-button"
          aria-label="Toggle menu"
          onClick={() => setOpen(!open)}
          className="text-foreground transition-colors hover:text-primary md:hidden"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            data-testid="mobile-nav"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border bg-[#0A100C]/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-6 px-6 py-8">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  data-testid={`mobile-nav-${l.label.toLowerCase()}-link`}
                  onClick={() => setOpen(false)}
                  className={`text-sm uppercase tracking-[0.2em] transition-colors ${
                    pathname === l.to ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};
