import React from "react";
import {
  BarChart3, BookOpen, BriefcaseBusiness, FileText, FolderKanban, Home,
  Bot, Image, LayoutDashboard, LogOut, MessageCircle, MessageSquareQuote, Search, Settings,
  Shield, Users
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const nav = [
  ["dashboard", "Dashboard", LayoutDashboard],
  ["hero", "Hero", Home],
  ["sections", "Homepage", FolderKanban],
  ["about", "About", FileText],
  ["services", "Services", BriefcaseBusiness],
  ["projects", "Projects", FolderKanban],
  ["testimonials", "Testimonials", MessageSquareQuote],
  ["team", "Team", Users],
  ["blogs", "Blog", BookOpen],
  ["media", "Media", Image],
  ["seo", "SEO", FileText],
  ["leads", "Leads", MessageSquareQuote],
  ["communication", "Communication", MessageCircle],
  ["ai", "AI Studio", Bot],
  ["analytics", "Analytics", BarChart3],
  ["settings", "Settings", Settings],
  ["security", "Security", Shield]
];

export default function Layout({ view, setView, children }) {
  const { user, logout } = useAuth();
  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">A</span>
          <div>
            <strong>Atomic CMS</strong>
            <small>{user?.role}</small>
          </div>
        </div>
        <nav>
          {nav.map(([key, label, Icon]) => (
            <button className={view === key ? "active" : ""} key={key} onClick={() => setView(key)}>
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <button className="logout" onClick={logout}><LogOut size={18} /> Logout</button>
      </aside>
      <main>
        <header className="topbar">
          <div className="search"><Search size={18} /><input placeholder="Search content, media, leads" /></div>
          <div className="user-pill">{user?.name}</div>
        </header>
        {children}
      </main>
    </div>
  );
}
