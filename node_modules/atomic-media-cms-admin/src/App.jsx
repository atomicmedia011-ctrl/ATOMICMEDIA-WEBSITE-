import React, { useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import Layout from "./components/Layout";
import { ToastProvider } from "./components/Toast";
import Dashboard from "./pages/Dashboard";
import EntityManager from "./components/EntityManager";
import Login from "./pages/Login";
import MediaLibrary from "./pages/MediaLibrary";
import Leads from "./pages/Leads";
import ProjectManager from "./pages/ProjectManager";
import CommunicationCenter from "./pages/CommunicationCenter";
import AiStudio from "./pages/AiStudio";

function AdminApp() {
  const auth = useAuth();
  const [view, setView] = useState("dashboard");

  if (!auth) return <div className="loading">Loading CMS</div>;
  const { user, loading } = auth;

  if (loading) return <div className="loading">Loading CMS</div>;
  if (!user) return <Login />;

  const content = view === "dashboard"
    ? <Dashboard setView={setView} />
    : view === "media"
      ? <MediaLibrary />
      : view === "leads"
        ? <Leads />
        : view === "communication"
          ? <CommunicationCenter />
          : view === "ai"
            ? <AiStudio />
            : view === "projects"
              ? <ProjectManager />
              : view === "analytics"
                ? <Dashboard setView={setView} />
                : <EntityManager type={view} />;

  return <Layout view={view} setView={setView}>{content}</Layout>;
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
