import React from "react";
import {
  BarChart3, BookOpen, BriefcaseBusiness, FileText, FolderKanban,
  Bot, Home, Image, LayoutDashboard, LogOut, MessageCircle,
  MessageSquareQuote, Search, Settings, Shield, Users, Layers,
  Megaphone, Zap, Globe
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const navGroups = [
  {
    label: "Overview",
    items: [
      ["dashboard", "Dashboard", LayoutDashboard],
      ["analytics", "Analytics", BarChart3],
    ]
  },
  {
    label: "Content",
    items: [
      ["hero", "Hero Section", Home],
      ["sections", "Page Sections", Layers],
      ["projects", "Projects", FolderKanban],
      ["services", "Services", BriefcaseBusiness],
      ["team", "Team", Users],
      ["testimonials", "Testimonials", MessageSquareQuote],
      ["blogs", "Blog", BookOpen],
      ["about", "About Page", FileText],
    ]
  },
  {
    label: "Marketing",
    items: [
      ["leads", "Leads & CRM", MessageCircle],
      ["communication", "Communication", Megaphone],
      ["ai", "AI Studio", Bot],
    ]
  },
  {
    label: "System",
    items: [
      ["media", "Media Library", Image],
      ["seo", "SEO", Globe],
      ["settings", "Settings", Settings],
      ["security", "Security", Shield],
    ]
  }
];

export default function Layout({ view, setView, children }) {
  const { user, logout } = useAuth();
  const initials = (user?.name || "A").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar-inner">
          {/* Brand */}
          <div className="sidebar-brand">
            <div className="brand-mark">A</div>
            <div className="brand-info">
              <strong>Atomic CMS</strong>
              <small>{user?.role || "admin"}</small>
            </div>
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav">
            {navGroups.map(group => (
              <div key={group.label}>
                <div className="nav-section-label">{group.label}</div>
                {group.items.map(([key, label, Icon]) => (
                  <button
                    key={key}
                    className={`nav-btn${view === key ? " active" : ""}`}
                    onClick={() => setView(key)}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="sidebar-footer">
            <div className="site-status">
              <span className="status-dot online" />
              <span>Website Online</span>
            </div>
            <button className="logout-btn" onClick={logout}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div className="topbar-search">
            <Search size={15} />
            <input placeholder="Search content, media, leads…" />
          </div>
          <div className="topbar-right">
            <div className="user-pill">
              <div className="user-avatar">{initials}</div>
              <span className="user-name">{user?.name || "Admin"}</span>
            </div>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
