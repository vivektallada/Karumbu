import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";
import { LogOut, Trash2, Phone, CheckCircle2, CircleDot, RefreshCw, ImagePlus, Loader2, Sparkles, Copy, MessageCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from "recharts";
import { mediaUrl } from "@/lib/media";
import { waLinkTo } from "@/lib/wa";
import { getSettings, clearSettingsCache } from "@/lib/settings";
import { Plus, Eye, EyeOff, Save } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusStyles = {
  new: "border-primary text-primary",
  contacted: "border-foreground/40 text-foreground",
  done: "border-border text-muted-foreground",
};

const adminInput =
  "w-full border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none";

export default function Admin() {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState(null);
  const [products, setProducts] = useState([]);
  const [uploading, setUploading] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [drafting, setDrafting] = useState(null);
  const [settingsForm, setSettingsForm] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [edits, setEdits] = useState({});
  const [savingProduct, setSavingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: "", tagline: "", price: "", description: "", badge: "" });
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
      const { data } = await axios.get(`${API}/admin/products`, { headers: headers() });
      setProducts(data);
    } catch {}
  }, [headers]);

  useEffect(() => {
    loadProducts();
    clearSettingsCache();
    getSettings().then((s) =>
      setSettingsForm({
        contact_email: s.contact_email || "",
        phone: s.phone || "",
        whatsapp_number: s.whatsapp_number || "",
        location: s.location || "",
        hero_line1: s.hero_line1 || "",
        hero_line2: s.hero_line2 || "",
        hero_subcopy: s.hero_subcopy || "",
      })
    );
  }, [loadProducts]);

  const setEdit = (slug, key, value) =>
    setEdits((e) => ({ ...e, [slug]: { ...(e[slug] || {}), [key]: value } }));

  const saveProduct = async (slug) => {
    const changes = edits[slug] || {};
    const payload = Object.fromEntries(
      Object.entries(changes).filter(([, v]) => v !== "" && v !== undefined)
    );
    if (payload.price !== undefined) payload.price = Number(payload.price);
    if (Object.keys(payload).length === 0) {
      toast.error("Nothing changed.");
      return;
    }
    setSavingProduct(slug);
    try {
      await axios.put(`${API}/admin/products/${slug}`, payload, { headers: headers() });
      toast.success("Product updated across the site.");
      setEdits((e) => ({ ...e, [slug]: {} }));
      await loadProducts();
    } catch {
      toast.error("Update failed.");
    } finally {
      setSavingProduct(null);
    }
  };

  const toggleActive = async (p) => {
    try {
      await axios.put(`${API}/admin/products/${p.slug}`, { active: !p.active }, { headers: headers() });
      toast.success(p.active ? `${p.name} hidden from the site.` : `${p.name} is live again.`);
      await loadProducts();
    } catch {
      toast.error("Could not update product.");
    }
  };

  const deleteProduct = async (p) => {
    try {
      await axios.delete(`${API}/admin/products/${p.slug}`, { headers: headers() });
      toast.success(`${p.name} deleted.`);
      await loadProducts();
    } catch {
      toast.error("Delete failed.");
    }
  };

  const createProduct = async (e) => {
    e.preventDefault();
    setSavingProduct("new");
    try {
      await axios.post(
        `${API}/admin/products`,
        { ...newProduct, price: Number(newProduct.price) },
        { headers: headers() }
      );
      toast.success("Product added to the site.");
      setNewProduct({ name: "", tagline: "", price: "", description: "", badge: "" });
      await loadProducts();
    } catch (err) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Could not add product.");
    } finally {
      setSavingProduct(null);
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await axios.put(`${API}/admin/settings`, settingsForm, { headers: headers() });
      clearSettingsCache();
      toast.success("Site settings updated everywhere.");
    } catch {
      toast.error("Could not save settings.");
    } finally {
      setSavingSettings(false);
    }
  };

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

      {settingsForm && (
        <form onSubmit={saveSettings} data-testid="settings-form" className="mt-12 border border-border bg-muted p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">Site Settings</p>
          <p className="mt-2 text-xs text-muted-foreground">
            These update the footer, contact page, WhatsApp buttons and the home page headline everywhere at once.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Contact email</label>
              <input data-testid="settings-email" value={settingsForm.contact_email} onChange={(e) => setSettingsForm((s) => ({ ...s, contact_email: e.target.value }))} className={adminInput} />
            </div>
            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Phone</label>
              <input data-testid="settings-phone" value={settingsForm.phone} onChange={(e) => setSettingsForm((s) => ({ ...s, phone: e.target.value }))} className={adminInput} />
            </div>
            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">WhatsApp number (country code, digits only)</label>
              <input data-testid="settings-whatsapp" value={settingsForm.whatsapp_number} onChange={(e) => setSettingsForm((s) => ({ ...s, whatsapp_number: e.target.value.replace(/\D/g, "") }))} className={adminInput} />
            </div>
            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Location</label>
              <input data-testid="settings-location" value={settingsForm.location} onChange={(e) => setSettingsForm((s) => ({ ...s, location: e.target.value }))} className={adminInput} />
            </div>
            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Hero headline — line 1</label>
              <input data-testid="settings-hero1" value={settingsForm.hero_line1} onChange={(e) => setSettingsForm((s) => ({ ...s, hero_line1: e.target.value }))} className={adminInput} />
            </div>
            <div>
              <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Hero headline — line 2 (shown in amber italic)</label>
              <input data-testid="settings-hero2" value={settingsForm.hero_line2} onChange={(e) => setSettingsForm((s) => ({ ...s, hero_line2: e.target.value }))} className={adminInput} />
            </div>
          </div>
          <div className="mt-4">
            <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Hero subtext</label>
            <textarea rows={2} data-testid="settings-subcopy" value={settingsForm.hero_subcopy} onChange={(e) => setSettingsForm((s) => ({ ...s, hero_subcopy: e.target.value }))} className={`${adminInput} resize-none`} />
          </div>
          <button type="submit" disabled={savingSettings} data-testid="settings-save-button" className="mt-6 flex items-center gap-2 bg-primary px-6 py-3 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-accent disabled:opacity-60">
            {savingSettings ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Settings
          </button>
        </form>
      )}

      <div className="mt-12">
        <p className="text-xs uppercase tracking-[0.3em] text-primary">Products</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Edit names, prices, descriptions and photos — or hide, delete and add brews. Every change goes live on the site instantly.
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
              <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6">
                <input data-testid={`edit-name-${p.slug}`} defaultValue={p.name} onChange={(e) => setEdit(p.slug, "name", e.target.value)} placeholder="Name" className={adminInput} />
                <input data-testid={`edit-tagline-${p.slug}`} defaultValue={p.tagline} onChange={(e) => setEdit(p.slug, "tagline", e.target.value)} placeholder="Tagline" className={adminInput} />
                <div className="flex gap-3">
                  <input data-testid={`edit-price-${p.slug}`} type="number" min={1} defaultValue={p.price} onChange={(e) => setEdit(p.slug, "price", e.target.value)} placeholder="Price ₹" className={`${adminInput} w-28`} />
                  <input data-testid={`edit-badge-${p.slug}`} defaultValue={p.badge} onChange={(e) => setEdit(p.slug, "badge", e.target.value)} placeholder="Badge" className={adminInput} />
                </div>
                <textarea data-testid={`edit-description-${p.slug}`} rows={3} defaultValue={p.description} onChange={(e) => setEdit(p.slug, "description", e.target.value)} placeholder="Description" className={`${adminInput} resize-none`} />
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => saveProduct(p.slug)} disabled={savingProduct === p.slug} data-testid={`save-product-${p.slug}`} className="flex items-center gap-2 bg-primary px-4 py-2 text-xs uppercase tracking-[0.15em] text-white transition-colors hover:bg-accent disabled:opacity-60">
                    {savingProduct === p.slug ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
                  </button>
                  <button onClick={() => toggleActive(p)} data-testid={`toggle-product-${p.slug}`} className="flex items-center gap-2 border border-border px-4 py-2 text-xs uppercase tracking-[0.15em] text-foreground transition-colors hover:border-primary hover:text-primary">
                    {p.active ? (<><EyeOff className="h-3.5 w-3.5" /> Hide</>) : (<><Eye className="h-3.5 w-3.5" /> Show</>)}
                  </button>
                  <button onClick={() => deleteProduct(p)} data-testid={`delete-product-${p.slug}`} className="flex items-center gap-2 border border-border px-4 py-2 text-xs uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:border-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
                {!p.active && (
                  <p className="text-[10px] uppercase tracking-[0.2em] text-destructive" data-testid={`hidden-label-${p.slug}`}>Hidden from site</p>
                )}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={createProduct} data-testid="add-product-form" className="mt-6 border border-border bg-muted p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Add a new brew</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input required minLength={2} data-testid="new-product-name" value={newProduct.name} onChange={(e) => setNewProduct((n) => ({ ...n, name: e.target.value }))} placeholder="Name (e.g. Panimirtham)" className={adminInput} />
            <input data-testid="new-product-tagline" value={newProduct.tagline} onChange={(e) => setNewProduct((n) => ({ ...n, tagline: e.target.value }))} placeholder="Tagline (e.g. Lemon · Cane · Mint)" className={adminInput} />
            <input required type="number" min={1} data-testid="new-product-price" value={newProduct.price} onChange={(e) => setNewProduct((n) => ({ ...n, price: e.target.value }))} placeholder="Price ₹" className={adminInput} />
            <input data-testid="new-product-badge" value={newProduct.badge} onChange={(e) => setNewProduct((n) => ({ ...n, badge: e.target.value }))} placeholder="Badge (e.g. New)" className={adminInput} />
          </div>
          <textarea rows={2} data-testid="new-product-description" value={newProduct.description} onChange={(e) => setNewProduct((n) => ({ ...n, description: e.target.value }))} placeholder="Short description" className={`${adminInput} mt-3 resize-none`} />
          <button type="submit" disabled={savingProduct === "new"} data-testid="add-product-button" className="mt-4 flex items-center gap-2 bg-primary px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-accent disabled:opacity-60">
            {savingProduct === "new" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add Product
          </button>
        </form>
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
                  {e.paid && (
                    <span
                      data-testid={`enquiry-paid-${e.id}`}
                      className="border border-[#46743a] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[#8fbf6a]"
                    >
                      Paid ₹{e.amount}
                    </span>
                  )}
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
