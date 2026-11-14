import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, LogOut, Package, User } from "lucide-react";
import { MaskedLines } from "@/components/MaskedLines";
import { Reveal } from "@/components/Reveal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const inputClass =
  "w-full border border-border bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none";
const labelClass = "mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground";

const statusStyles = {
  new: "border-primary text-primary",
  contacted: "border-foreground/40 text-foreground",
  done: "border-border text-muted-foreground",
};

export default function Account() {
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(undefined);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  const token = useCallback(() => localStorage.getItem("karumbu_customer_token"),[]);
const headers = useCallback(() => ({ Authorization: `Bearer ${token()}` }),[token]);
  const loadOrders = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/my/orders`, { headers: headers() });
      setOrders(data);
    } catch {
      setOrders([]);
    }
  }, [headers]);

  useEffect(() => {
    axios.get(`${API}/products`).then((r) => setProducts(r.data)).catch(() => {});
    if (!token()) {
      setUser(null);
      return;
    }
    axios
      .get(`${API}/auth/customer/me`, { headers: headers() })
      .then((r) => {
        setUser(r.data);
        loadOrders();
      })
      .catch(() => {
        localStorage.removeItem("karumbu_customer_token");
        localStorage.removeItem("karumbu_customer_user");
        setUser(null);
      });
  }, [loadOrders, token, headers]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = mode === "login" ? `${API}/auth/customer/login` : `${API}/auth/customer/register`;
      const payload = mode === "login" ? { email: form.email, password: form.password } : form;
      const { data } = await axios.post(url, payload);
      localStorage.setItem("karumbu_customer_token", data.token);
      localStorage.setItem("karumbu_customer_user", JSON.stringify(data.user));
      setUser(data.user);
      toast.success(mode === "login" ? "Welcome back!" : "Account created — welcome to KARUMBU!");
      loadOrders();
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("karumbu_customer_token");
    localStorage.removeItem("karumbu_customer_user");
    setUser(null);
    setOrders([]);
    toast.success("Signed out.");
  };

  const productName = (slug) =>
    products.find((p) => p.slug === slug)?.name || (slug === "assorted-case" ? "Assorted Case" : slug);

  if (user === undefined) {
    return (
      <div data-testid="account-loading" className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading your account…
      </div>
    );
  }

  if (user) {
    return (
      <div data-testid="account-page" className="px-6 pt-32 pb-24 md:px-16 md:pt-40 lg:px-24">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-primary">My Account</p>
            <h1 className="mt-4 font-serif text-4xl font-light text-foreground md:text-6xl">
              Vanakkam, <span className="italic text-primary">{user.name.split(" ")[0]}.</span>
            </h1>
            <p className="mt-4 text-sm text-muted-foreground" data-testid="account-email">{user.email}</p>
          </div>
          <button
            data-testid="account-logout-button"
            onClick={logout}
            className="flex w-fit items-center gap-2 border border-border px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>

        <div className="mt-16">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-primary">
            <Package className="h-4 w-4" /> Your Orders
          </p>
          <div className="mt-6 flex flex-col gap-px border border-border bg-border" data-testid="orders-list">
            {orders.length === 0 && (
              <div className="bg-muted p-10 text-sm text-muted-foreground" data-testid="orders-empty">
                No orders yet. Head to the Products page and pick your brew.
              </div>
            )}
            {orders.map((o) => (
              <div
                key={o.id}
                data-testid={`order-row-${o.id}`}
                className="flex flex-col gap-4 bg-muted p-6 transition-colors hover:bg-secondary md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-serif text-2xl font-light text-foreground">{productName(o.product)}</h3>
                    <span className={`border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${statusStyles[o.status] || statusStyles.new}`}>
                      {o.status}
                    </span>
                    {o.paid && (
                      <span className="border border-[#46743a] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#8fbf6a]">
                        Paid ₹{o.amount}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {o.quantity} bottles · {new Date(o.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="account-auth-page" className="flex min-h-screen items-center justify-center px-6 pt-20">
      <div className="w-full max-w-md border border-border bg-muted p-8 md:p-10">
        <p className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-primary">
          <User className="h-4 w-4" /> My Karumbu
        </p>
        <h1 className="mt-4 font-serif text-4xl font-light text-foreground">
          <MaskedLines lines={[mode === "login" ? "Welcome back." : "Join the field."]} />
        </h1>
        <form data-testid="account-form" onSubmit={submit} className="mt-10 flex flex-col gap-6">
          {mode === "register" && (
            <>
              <div>
                <label htmlFor="account-name" className={labelClass}>Name</label>
                <input
                  id="account-name"
                  data-testid="account-name-input"
                  required
                  minLength={2}
                  value={form.name}
                  onChange={update("name")}
                  placeholder="Meenakshi Raman"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="account-phone" className={labelClass}>Phone (optional)</label>
                <input
                  id="account-phone"
                  data-testid="account-phone-input"
                  maxLength={15}
                  value={form.phone}
                  onChange={update("phone")}
                  placeholder="+91 98XXX XXXXX"
                  className={inputClass}
                />
              </div>
            </>
          )}
          <div>
            <label htmlFor="account-email" className={labelClass}>Email</label>
            <input
              id="account-email"
              data-testid="account-email-input"
              type="email"
              required
              value={form.email}
              onChange={update("email")}
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="account-password" className={labelClass}>Password</label>
            <input
              id="account-password"
              data-testid="account-password-input"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={update("password")}
              placeholder="Minimum 8 characters"
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            data-testid="account-submit-button"
            disabled={loading}
            className="flex items-center justify-center gap-3 bg-primary px-8 py-4 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-accent disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
        <button
          data-testid="account-toggle-mode"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="mt-6 text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
