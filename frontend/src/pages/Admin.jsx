import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { LogOut, Trash2, Phone, CheckCircle2, CircleDot, RefreshCw, ImagePlus, Loader2, Sparkles, Copy, MessageCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from "recharts";
import { mediaUrl } from "@/lib/media";
import { waLinkTo } from "@/lib/wa";
import { Reveal } from "@/components/Reveal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusStyles = {
  new: "border-primary text-primary",
  contacted: "border-foreground/40 text-foreground",
  done: "border-border text-muted-foreground",
};

export default function Admin() {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState(null);
  const [products, setProducts] = useState([]);
  const [uploading, setUploading] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [drafting, setDrafting] = useState(null);
  const fileInputs = useRef({});

  const headers = useCallback(
    () => ({ Authorization: `Bearer ${localStorage.getItem("karumbu_admin_token")}` }),
    []
  );

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/enquiries`, { headers: headers() });
      setEnquiries(data);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem("karumbu_admin_token");
        navigate("/admin/login");
      } else {
        toast.error("Could not load enquiries.");
        setEnquiries([]);
      }
    }
  }, [headers, navigate]);

  useEffect(() => {
    if (!localStorage.getItem("karumbu_admin_token")) {
      navigate("/admin/login");
      return;
    }
    load();
  }, [load, navigate]);

  const setStatus = async (id, status) => {
    try {
      await axios.patch(`${API}/enquiries/${id}`, { status }, { headers: headers() });
      setEnquiries((list) => list.map((e) => (e.id === id ? { ...e, status } : e)));
      toast.success(`Marked as ${status}.`);
    } catch {
      toast.error("Update failed.");
    }
  };

  const remove = async (id) => {
    try {
      await axios.delete(`${API}/enquiries/${id}`, { headers: headers() });
      setEnquiries((list) => list.filter((e) => e.id !== id));
      toast.success("Enquiry deleted.");
    } catch {
      toast.error("Delete failed.");
    }
  };

  const loadProducts = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/products`);
      setProducts(data);
    } catch {}
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const uploadImage = async (slug, file) => {
    if (!file) return;
    setUploading(slug);
    try {
      const fd = new FormData();
      fd.append("file", file);
      await axios.post(`${API}/products/${slug}/image`, fd, { headers: headers() });
      toast.success("Photo updated across the site.");
      await loadProducts();
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Upload failed.");
    } finally {
      setUploading(null);
    }
  };

  const removeImage = async (slug) => {
    try {
      await axios.delete(`${API}/products/${slug}/image`, { headers: headers() });
      toast.success("Reverted to default photo.");
      await loadProducts();
    } catch {
      toast.error("Remove failed.");
    }
  };

  const draftReply = async (e) => {
    setDrafting(e.id);
    setDrafts((d) => ({ ...d, [e.id]: "" }));
    try {
      const resp = await fetch(`${API}/enquiries/${e.id}/draft-reply`, {
        method: "POST",
        headers: headers(),
      });
      if (!resp.ok) throw new Error();
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const obj = JSON.parse(payload);
            if (obj.delta) setDrafts((d) => ({ ...d, [e.id]: (d[e.id] || "") + obj.delta }));
            if (obj.error) toast.error(obj.error);
          } catch {}
        }
      }
    } catch {
      toast.error("Could not draft a reply.");
      setDrafts((d) => {
        const next = { ...d };
        delete next[e.id];
        return next;
      });
    } finally {
      setDrafting(null);
    }
  };

  const copyDraft = async (id) => {
    try {
      await navigator.clipboard.writeText(drafts[id]);
      toast.success("Reply copied.");
    } catch {
      toast.error("Copy failed.");
    }
  };

  const logout = () => {
    localStorage.removeItem("karumbu_admin_token");
    navigate("/admin/login");
  };

  const counts = {
    total: enquiries?.length ?? 0,
    new: enquiries?.filter((e) => e.status === "new").length ?? 0,
    bottles: enquiries?.reduce((s, e) => s + e.quantity, 0) ?? 0,
  };

  const brewStats = useMemo(() => {
    const map = {};
    (enquiries || []).forEach((e) => {
      if (!map[e.product]) map[e.product] = { enquiries: 0, bottles: 0 };
      map[e.product].enquiries += 1;
      map[e.product].bottles += e.quantity;
    });
    return Object.entries(map).map(([slug, v]) => ({
      name: products.find((p) => p.slug === slug)?.name || (slug === "assorted-case" ? "Assorted Case" : slug),
      ...v,
    }));
  }, [enquiries, products]);

  const weekStats = useMemo(() => {
    if (!enquiries?.length) return [];
    const weeks = {};
    enquiries.forEach((e) => {
      const d = new Date(e.created_at);
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
      monday.setHours(0, 0, 0, 0);
      const key = monday.toISOString().slice(0, 10);
      weeks[key] = (weeks[key] || 0) + 1;
    });
    return Object.keys(weeks)
      .sort()
      .map((k) => ({
        week: new Date(k).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        enquiries: weeks[k],
      }));
  }, [enquiries]);

  return (
    <div data-testid="admin-dashboard" className="min-h-screen px-6 pt-32 pb-24 md:px-16 md:pt-40 lg:px-24">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Karumbu Admin</p>
          <h1 className="mt-4 font-serif text-4xl font-light text-foreground md:text-6xl">
            Enquiries <span className="italic text-primary">board.</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            data-testid="admin-refresh-button"
            onClick={load}
            className="flex items-center gap-2 border border-border px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <button
            data-testid="admin-logout-button"
            onClick={logout}
            className="flex items-center gap-2 border border-border px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
      </div>

      <div className="mt-12 grid gap-px border border-border bg-border md:grid-cols-3">
        {[
          { label: "Total Enquiries", value: counts.total, testid: "stat-total" },
          { label: "Awaiting Reply", value: counts.new, testid: "stat-new" },
          { label: "Bottles Requested", value: counts.bottles, testid: "stat-bottles" },
        ].map((s) => (
          <div key={s.label} className="bg-muted p-8" data-testid={s.testid}>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{s.label}</p>
            <p className="mt-3 font-serif text-5xl font-light text-primary">{s.value}</p>
          </div>
        ))}
      </div>

      {enquiries?.length > 0 && (
        <div data-testid="analytics-section" className="mt-12 grid gap-px border border-border bg-border md:grid-cols-2">
          <div className="bg-muted p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">What sells — by brew</p>
            <div className="mt-6 h-64" data-testid="brew-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={brewStats} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="#213827" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" interval={0} tick={{ fill: "#939E96", fontSize: 11 }} axisLine={{ stroke: "#213827" }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: "#939E96", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#121E15", border: "1px solid #213827", color: "#F4EBE1", fontSize: 12 }}
                    labelStyle={{ color: "#C86A23" }}
                    cursor={{ fill: "#1C2F21" }}
                  />
                  <Bar dataKey="enquiries" name="Enquiries" fill="#C86A23" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="bottles" name="Bottles" fill="#46743a" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex gap-6 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="flex items-center gap-2"><span className="h-2 w-2 bg-primary" /> Enquiries</span>
              <span className="flex items-center gap-2"><span className="h-2 w-2 bg-[#46743a]" /> Bottles</span>
            </div>
          </div>
          <div className="bg-muted p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Enquiries by week</p>
            <div className="mt-6 h-64" data-testid="week-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekStats} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="#213827" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="week" tick={{ fill: "#939E96", fontSize: 11 }} axisLine={{ stroke: "#213827" }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: "#939E96", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#121E15", border: "1px solid #213827", color: "#F4EBE1", fontSize: 12 }}
                    labelStyle={{ color: "#C86A23" }}
                    cursor={{ stroke: "#213827" }}
                  />
                  <Area type="monotone" dataKey="enquiries" name="Enquiries" stroke="#C86A23" strokeWidth={2} fill="#C86A23" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Weeks starting Monday</p>
          </div>
        </div>
      )}

      <div className="mt-12">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Product Photos</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Upload real photos of your brews — they replace the stock images on the Home and Products pages instantly.
        </p>
        <div className="mt-6 grid gap-px border border-border bg-border md:grid-cols-3">
          {products.map((p) => (
            <div key={p.slug} className="bg-muted p-6" data-testid={`photo-card-${p.slug}`}>
              <div className="overflow-hidden border border-border">
                <img
                  src={mediaUrl(p.image)}
                  alt={p.name}
                  data-testid={`photo-preview-${p.slug}`}
                  className="h-40 w-full object-cover"
                />
              </div>
              <p className="mt-4 font-serif text-xl font-light text-foreground">{p.name}</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {p.custom_image ? "Your photo" : "Default stock photo"}
              </p>
              <div className="mt-4 flex gap-3">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={(el) => (fileInputs.current[p.slug] = el)}
                  onChange={(e) => {
                    uploadImage(p.slug, e.target.files?.[0]);
                    e.target.value = "";
                  }}
                  data-testid={`photo-input-${p.slug}`}
                />
                <button
                  onClick={() => fileInputs.current[p.slug]?.click()}
                  disabled={uploading === p.slug}
                  data-testid={`photo-upload-${p.slug}`}
                  className="flex items-center gap-2 border border-primary px-4 py-2 text-xs uppercase tracking-[0.15em] text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-60"
                >
                  {uploading === p.slug ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ImagePlus className="h-3.5 w-3.5" />
                  )}
                  Upload
                </button>
                {p.custom_image && (
                  <button
                    onClick={() => removeImage(p.slug)}
                    data-testid={`photo-remove-${p.slug}`}
                    className="flex items-center gap-2 border border-border px-4 py-2 text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-px border border-border bg-border">
        {enquiries === null && (
          <div className="bg-muted p-10 text-sm text-muted-foreground" data-testid="enquiries-loading">Loading enquiries…</div>
        )}
        {enquiries?.length === 0 && (
          <div className="bg-muted p-10 text-sm text-muted-foreground" data-testid="enquiries-empty">
            No enquiries yet. New orders from the contact page will appear here.
          </div>
        )}
        {enquiries?.map((e, i) => (
          <Reveal key={e.id} delay={Math.min(i * 0.05, 0.3)}>
            <div
              data-testid={`enquiry-row-${e.id}`}
              className="flex flex-col gap-6 bg-muted p-6 transition-colors hover:bg-secondary md:p-8 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-serif text-2xl font-light text-foreground">{e.name}</h3>
                  <span
                    data-testid={`enquiry-status-${e.id}`}
                    className={`border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${statusStyles[e.status] || statusStyles.new}`}
                  >
                    {e.status}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 text-primary" /> {e.phone}
                </p>
                <p className="mt-2 text-sm text-foreground">
                  <span className="text-primary">{e.product}</span> · {e.quantity} bottles
                </p>
                {e.message && <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">“{e.message}”</p>}
                <p className="mt-3 text-xs text-muted-foreground">
                  {new Date(e.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-3">
                <button
                  data-testid={`enquiry-draft-${e.id}`}
                  onClick={() => draftReply(e)}
                  disabled={drafting === e.id}
                  className="flex items-center gap-2 border border-primary px-4 py-2 text-xs uppercase tracking-[0.15em] text-primary transition-colors hover:bg-primary hover:text-white disabled:opacity-60"
                >
                  {drafting === e.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {drafting === e.id ? "Drafting…" : "Draft Reply"}
                </button>
                {e.status !== "contacted" && e.status !== "done" && (
                  <button
                    data-testid={`enquiry-contacted-${e.id}`}
                    onClick={() => setStatus(e.id, "contacted")}
                    className="flex items-center gap-2 border border-foreground/30 px-4 py-2 text-xs uppercase tracking-[0.15em] text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    <CircleDot className="h-3.5 w-3.5" /> Contacted
                  </button>
                )}
                {e.status !== "done" && (
                  <button
                    data-testid={`enquiry-done-${e.id}`}
                    onClick={() => setStatus(e.id, "done")}
                    className="flex items-center gap-2 border border-primary px-4 py-2 text-xs uppercase tracking-[0.15em] text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Done
                  </button>
                )}
                <button
                  data-testid={`enquiry-delete-${e.id}`}
                  onClick={() => remove(e.id)}
                  className="flex items-center gap-2 border border-border px-4 py-2 text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
              {drafts[e.id] !== undefined && (
                <div data-testid={`draft-box-${e.id}`} className="w-full border-t border-border pt-6">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-primary">Drafted reply — warm host voice</p>
                  <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {drafts[e.id]}
                    {drafting === e.id && <span className="animate-pulse text-primary">▍</span>}
                  </p>
                  {drafting !== e.id && drafts[e.id] && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        data-testid={`draft-copy-${e.id}`}
                        onClick={() => copyDraft(e.id)}
                        className="flex items-center gap-2 border border-border px-4 py-2 text-xs uppercase tracking-[0.15em] text-foreground transition-colors hover:border-primary hover:text-primary"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </button>
                      <a
                        href={waLinkTo(e.phone.replace(/\D/g, ""), drafts[e.id])}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`draft-send-${e.id}`}
                        className="flex items-center gap-2 bg-primary px-4 py-2 text-xs uppercase tracking-[0.15em] text-white transition-colors hover:bg-accent"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> Send on WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
