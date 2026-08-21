import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, LogIn } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminLogin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/login`, form, { withCredentials: true });
      localStorage.setItem("karumbu_admin_token", data.token);
      toast.success("Welcome back, Admin.");
      navigate("/admin");
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="admin-login-page" className="flex min-h-screen items-center justify-center px-6 pt-20">
      <form
        data-testid="admin-login-form"
        onSubmit={submit}
        className="w-full max-w-md border border-border bg-muted p-8 md:p-10"
      >
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Karumbu Admin</p>
        <h1 className="mt-4 font-serif text-4xl font-light text-foreground">
          Sign <span className="italic text-primary">in.</span>
        </h1>
        <div className="mt-10 flex flex-col gap-6">
          <div>
            <label htmlFor="admin-email" className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</label>
            <input
              id="admin-email"
              data-testid="admin-email-input"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="admin@karumbu.in"
              className="w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="admin-password" className="mb-2 block text-xs uppercase tracking-[0.2em] text-muted-foreground">Password</label>
            <input
              id="admin-password"
              data-testid="admin-password-input"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••••••"
              className="w-full border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none"
            />
          </div>
          <button
            type="submit"
            data-testid="admin-login-submit"
            disabled={loading}
            className="group flex items-center justify-center gap-3 bg-primary px-8 py-4 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-accent disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </div>
        <Link to="/" data-testid="admin-login-back-link" className="mt-8 block text-xs text-muted-foreground transition-colors hover:text-primary">
          ← Back to site
        </Link>
      </form>
    </div>
  );
}
