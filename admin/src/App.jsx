import React, { useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import Layout from "./components/Layout";
import { ToastProvider } from "./components/Toast";

// Pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import MediaLibrary from "./pages/MediaLibrary";
import Leads from "./pages/Leads";
import ProjectManager from "./pages/ProjectManager";
import ServicesPage from "./pages/ServicesPage";
import TeamPage from "./pages/TeamPage";
import TestimonialsPage from "./pages/TestimonialsPage";
import BlogPage from "./pages/BlogPage";
import SettingsPage from "./pages/SettingsPage";
import CommunicationCenter from "./pages/CommunicationCenter";
import AiStudio from "./pages/AiStudio";

// Generic entity manager for remaining pages
import EntityManager from "./components/EntityManager";

function renderView(view, setView) {
  switch (view) {
    case "dashboard":
    case "analytics":
      return <Dashboard setView={setView} />;

    case "projects":
      return <ProjectManager />;

    case "services":
      return <ServicesPage />;

    case "team":
      return <TeamPage />;

    case "testimonials":
      return <TestimonialsPage />;

    case "blogs":
      return <BlogPage />;

    case "media":
      return <MediaLibrary />;

    case "leads":
      return <Leads />;

    case "communication":
      return <CommunicationCenter />;

    case "ai":
      return <AiStudio />;

    case "settings":
      return <SettingsPage />;

    // Generic entity manager for content/SEO/hero pages
    case "hero":
    case "sections":
    case "about":
    case "seo":
    case "security":
      return <EntityManager type={view} />;

    default:
      return <Dashboard setView={setView} />;
  }
}

function AdminApp() {
  const auth = useAuth();
  const [view, setView] = useState("dashboard");

  if (!auth) return <div className="loading">Loading…</div>;
  const { user, loading } = auth;

  if (loading) return <div className="loading">Loading CMS…</div>;
  if (!user) return <Login />;

  return (
    <Layout view={view} setView={setView}>
      {renderView(view, setView)}
    </Layout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AdminApp />
      </AuthProvider>
    </ToastProvider>
  );
}
