import React, { useEffect, useState } from "react";
import { Globe, Image as ImageIcon, Lock, Palette, Phone, Save, Settings, Share2 } from "lucide-react";
import { api } from "../api/client";
import MediaField from "../components/MediaField";
import { useToast } from "../components/Toast";

const TABS = [
  { id: "branding", label: "Branding", icon: Palette },
  { id: "hero", label: "Hero", icon: ImageIcon },
  { id: "contact", label: "Contact", icon: Phone },
  { id: "social", label: "Social", icon: Share2 },
  { id: "seo", label: "SEO", icon: Globe },
  { id: "security", label: "Security", icon: Lock },
];

const socialPlatforms = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "twitter", label: "X / Twitter" },
  { key: "youtube", label: "YouTube" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "tiktok", label: "TikTok" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [tab, setTab] = useState("branding");
  const [saving, setSaving] = useState(false);
  const notify = useToast();

  async function load() {
    const r = await api("/api/admin/settings?limit=1");
    const item = (r.items || [])[0] || { key: "global" };
    setSettings(item);
  }

  useEffect(() => { load().catch(e => notify(e.message, "error")); }, []);

  function updateField(f, v) { setSettings(cur => ({ ...cur, [f]: v })); }

  function updateNested(root, k, v) {
    setSettings(cur => ({ ...cur, [root]: { ...(cur[root] || {}), [k]: v } }));
  }

  async function save() {
    setSaving(true);
    try {
      const body = { ...settings, key: "global" };
      const method = body._id ? "PATCH" : "POST";
      const path = body._id ? `/api/admin/settings/${body._id}` : "/api/admin/settings";
      const saved = await api(path, { method, body });
      notify("Settings saved ✓");
      setSettings(saved);
    } catch (e) { notify(e.message, "error"); }
    finally { setSaving(false); }
  }

  if (!settings) return <section className="workspace"><div className="loading" style={{ minHeight: 200 }}>Loading settings…</div></section>;

  const contact = settings.contact || {};
  const social = settings.socialLinks || {};
  const seo = settings.seo || {};
  const security = settings.security || {};

  return (
    <section className="workspace">
      <div className="page-header">
        <div className="page-header-text">
          <p className="eyebrow">Configuration</p>
          <h1>Settings</h1>
          <p>Control your website's global branding, hero content, contact info, social links, SEO defaults, and security.</p>
        </div>
        <div className="page-header-actions">
          <button onClick={save} disabled={saving}><Save size={16} /> Save Settings</button>
        </div>
      </div>

      <div className="editor-panel" style={{ maxWidth: 900 }}>
        <div className="editor-tabs">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`tab-btn${tab === id ? " active" : ""}`} onClick={() => setTab(id)}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Branding */}
        {tab === "branding" && (
          <div className="editor-body">
            <div className="editor-section-title"><Palette size={14} /> Company &amp; Logo</div>
            <div className="form-grid">
              <label className="field">
                <span>Company Name</span>
                <input value={settings.companyName || ""} onChange={e => updateField("companyName", e.target.value)} placeholder="Atomic Media" />
              </label>
              <label className="field">
                <span>Tagline</span>
                <input value={settings.tagline || ""} onChange={e => updateField("tagline", e.target.value)} placeholder="Capture. Create. Inspire." />
              </label>
            </div>
            <div className="divider" />
            <div className="project-media-section">
              <MediaField label="Light Logo" value={settings.logo} accept="image" defaultFolder="branding" onChange={v => updateField("logo", v)} />
              <MediaField label="Dark / Inverse Logo" value={settings.darkLogo} accept="image" defaultFolder="branding" onChange={v => updateField("darkLogo", v)} />
              <MediaField label="Favicon" value={settings.favicon} accept="image" defaultFolder="branding" onChange={v => updateField("favicon", v)} />
              <MediaField label="Loading Animation Asset" value={settings.loadingAnimationAsset} accept="image" defaultFolder="branding" onChange={v => updateField("loadingAnimationAsset", v)} />
            </div>
          </div>
        )}

        {/* Hero */}
        {tab === "hero" && (
          <div className="editor-body">
            <div className="editor-section-title"><ImageIcon size={14} /> Hero Section</div>
            <div className="form-grid">
              <label className="field">
                <span>Heading</span>
                <input value={settings.heroHeading || ""} onChange={e => updateField("heroHeading", e.target.value)} placeholder="We Create Extraordinary Visuals" />
              </label>
              <label className="field">
                <span>Subheading</span>
                <input value={settings.heroSubheading || ""} onChange={e => updateField("heroSubheading", e.target.value)} placeholder="Photography · Videography · Branding" />
              </label>
              <label className="field">
                <span>CTA Button Text</span>
                <input value={settings.heroCtaText || ""} onChange={e => updateField("heroCtaText", e.target.value)} placeholder="View Portfolio" />
              </label>
              <label className="field">
                <span>CTA Button Link</span>
                <input value={settings.heroCtaLink || ""} onChange={e => updateField("heroCtaLink", e.target.value)} placeholder="/projects" />
              </label>
            </div>
            <div className="divider" />
            <div className="project-media-section">
              <MediaField label="Hero Background Image" value={settings.heroBackgroundImage} accept="image" defaultFolder="hero" onChange={v => updateField("heroBackgroundImage", v)} />
              <MediaField label="Hero Background Video" value={settings.heroBackgroundVideo} accept="video" defaultFolder="hero" onChange={v => updateField("heroBackgroundVideo", v)} />
              <MediaField label="Hero Images (carousel)" value={settings.heroImages || []} accept="image" multiple defaultFolder="hero/images" onChange={v => updateField("heroImages", v)} />
              <MediaField label="Hero Videos (reel)" value={settings.heroVideos || []} accept="video" multiple defaultFolder="hero/videos" onChange={v => updateField("heroVideos", v)} />
              <MediaField label="Hero Reels" value={settings.reels || []} accept="video" multiple defaultFolder="hero/reels" onChange={v => updateField("reels", v)} />
            </div>
          </div>
        )}

        {/* Contact */}
        {tab === "contact" && (
          <div className="editor-body">
            <div className="editor-section-title"><Phone size={14} /> Contact Information</div>
            <div className="form-grid">
              {[
                ["email", "Email Address", "hello@atomicmedia.com"],
                ["phone", "Phone Number", "+91 98765 43210"],
                ["whatsapp", "WhatsApp Number", "+91 98765 43210"],
                ["address", "Address / Location", "Mumbai, Maharashtra"],
                ["city", "City", "Mumbai"],
                ["country", "Country", "India"],
              ].map(([k, label, ph]) => (
                <label key={k} className="field">
                  <span>{label}</span>
                  <input value={contact[k] || ""} onChange={e => updateNested("contact", k, e.target.value)} placeholder={ph} />
                </label>
              ))}
            </div>
            <div className="divider" />
            <div className="editor-section-title">Footer</div>
            <div className="form-grid cols-1">
              <label className="field">
                <span>Footer Text</span>
                <textarea rows={4} value={typeof settings.footer === "object" ? JSON.stringify(settings.footer, null, 2) : settings.footer || ""} onChange={e => updateField("footer", e.target.value)} placeholder='{"copy": "© 2024 Atomic Media. All rights reserved.", "links": []}' />
              </label>
            </div>
          </div>
        )}

        {/* Social */}
        {tab === "social" && (
          <div className="editor-body">
            <div className="editor-section-title"><Share2 size={14} /> Social Media Links</div>
            <div className="form-grid">
              {socialPlatforms.map(({ key, label }) => (
                <label key={key} className="field">
                  <span>{label}</span>
                  <input value={social[key] || ""} onChange={e => updateNested("socialLinks", key, e.target.value)} placeholder={`https://${key}.com/…`} />
                </label>
              ))}
            </div>
          </div>
        )}

        {/* SEO */}
        {tab === "seo" && (
          <div className="editor-body">
            <div className="editor-section-title"><Globe size={14} /> Default SEO</div>
            <div className="form-grid cols-1">
              <label className="field">
                <span>Default Meta Title</span>
                <input value={seo.metaTitle || ""} onChange={e => updateNested("seo", "metaTitle", e.target.value)} placeholder="Atomic Media — Premium Photography & Videography" />
              </label>
              <label className="field">
                <span>Default Meta Description</span>
                <textarea rows={3} value={seo.metaDescription || ""} onChange={e => updateNested("seo", "metaDescription", e.target.value)} placeholder="We capture extraordinary moments…" />
              </label>
              <label className="field">
                <span>Meta Keywords (comma-separated)</span>
                <input value={seo.metaKeywords || ""} onChange={e => updateNested("seo", "metaKeywords", e.target.value)} placeholder="photography, videography, branding" />
              </label>
              <label className="field">
                <span>Canonical URL</span>
                <input value={seo.canonicalUrl || ""} onChange={e => updateNested("seo", "canonicalUrl", e.target.value)} placeholder="https://atomicmedia.com" />
              </label>
            </div>
            <div className="divider" />
            <div className="project-media-section">
              <MediaField label="Default OG Image" value={settings.ogImage || null} accept="image" defaultFolder="seo" onChange={v => updateField("ogImage", v)} />
            </div>
          </div>
        )}

        {/* Security */}
        {tab === "security" && (
          <div className="editor-body">
            <div className="editor-section-title"><Lock size={14} /> Security Configuration</div>
            <div style={{ padding: "12px 16px", borderRadius: "var(--r)", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "var(--warning)", fontSize: 13, marginBottom: 16 }}>
              ⚠ Changes here affect authentication and access control. Be careful.
            </div>
            <div className="form-grid cols-1">
              <label className="field">
                <span>Security JSON (raw)</span>
                <textarea rows={12} value={typeof security === "object" ? JSON.stringify(security, null, 2) : security || ""} onChange={e => updateField("security", e.target.value)} />
              </label>
            </div>
          </div>
        )}

        <div className="editor-actions">
          <button className="btn-secondary" onClick={load}>Discard Changes</button>
          <button onClick={save} disabled={saving}><Save size={15} /> Save Settings</button>
        </div>
      </div>
    </section>
  );
}
