import React, { useEffect, useMemo, useState } from "react";
import { Bot, Copy, FileText, Lightbulb, Mail, Save, Search } from "lucide-react";
import { api } from "../api/client";
import { useToast } from "../components/Toast";

export default function AiStudio() {
  const [leads, setLeads] = useState([]);
  const [services, setServices] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [generations, setGenerations] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [ideasInput, setIdeasInput] = useState({ niche: "", platform: "Instagram", goal: "Lead generation", tone: "Premium" });
  const [seoInput, setSeoInput] = useState({ topic: "", page: "", service: "" });
  const [proposalInput, setProposalInput] = useState({ leadId: "", serviceId: "", projectType: "", clientName: "" });
  const [loading, setLoading] = useState("");
  const [query, setQuery] = useState("");
  const notify = useToast();

  async function load() {
    const [leadData, serviceData, conversationData, generationData, proposalData] = await Promise.all([
      api("/api/admin/leads"),
      api("/api/admin/services?limit=100"),
      api("/api/admin/ai/chatbot/conversations"),
      api("/api/admin/ai/generations"),
      api("/api/admin/ai/proposals")
    ]);
    setLeads(leadData.items || []);
    setServices(serviceData.items || []);
    setConversations(conversationData.items || []);
    setGenerations(generationData.items || []);
    setProposals(proposalData.items || []);
  }

  useEffect(() => { load().catch((error) => notify(error.message, "error")); }, []);

  const filteredConversations = useMemo(() => {
    const needle = query.toLowerCase();
    return conversations.filter((item) => `${item.name} ${item.email} ${item.business} ${item.serviceNeed} ${item.leadScore}`.toLowerCase().includes(needle));
  }, [conversations, query]);

  async function generateIdeas() {
    setLoading("ideas");
    try {
      await api("/api/admin/ai/content-ideas", { method: "POST", body: ideasInput });
      notify("Content ideas generated");
      await load();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading("");
    }
  }

  async function generateSeo() {
    setLoading("seo");
    try {
      await api("/api/admin/ai/seo", { method: "POST", body: seoInput });
      notify("SEO suggestions generated");
      await load();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading("");
    }
  }

  async function generateProposal() {
    setLoading("proposal");
    try {
      await api("/api/admin/ai/proposals/generate", { method: "POST", body: proposalInput });
      notify("Proposal generated");
      await load();
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setLoading("");
    }
  }

  async function updateProposal(proposal, content) {
    const saved = await api(`/api/admin/ai/proposals/${proposal._id}`, { method: "PATCH", body: { content } });
    setProposals((current) => current.map((item) => item._id === saved._id ? saved : item));
    notify("Proposal saved");
  }

  async function emailProposal(proposal) {
    await api(`/api/admin/ai/proposals/${proposal._id}/email`, { method: "POST", body: {} });
    notify("Proposal email queued");
    await load();
  }

  function copy(value) {
    navigator.clipboard?.writeText(value);
    notify("Copied");
  }

  function renderResult(result) {
    return typeof result === "string" ? result : JSON.stringify(result || {}, null, 2);
  }

  return (
    <section className="workspace">
      <div className="section-head">
        <div>
          <p className="eyebrow">AI powered features</p>
          <h1>AI Studio</h1>
          <p className="section-description">Qualify chatbot leads, generate content ideas, create SEO plans, and draft proposals from existing leads and services.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-title-row"><div><p className="eyebrow">Lead qualification</p><h2>Chatbot Conversations</h2></div><Bot size={20} /></div>
          <div className="project-search compact"><Search size={18} /><input placeholder="Search conversations" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          <div className="mini-list">
            {!filteredConversations.length && <div className="empty-state">No chatbot conversations yet.</div>}
            {filteredConversations.slice(0, 8).map((item) => (
              <div className="mini-row" key={item._id}>
                <div><strong>{item.name || item.email || "Visitor"}</strong><small>{item.business || item.serviceNeed || "Lead details pending"}</small></div>
                <span className="status-dot">{item.leadScore}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title-row"><div><p className="eyebrow">Content engine</p><h2>Idea Generator</h2></div><Lightbulb size={20} /></div>
          <div className="project-form-grid">
            <label><span>Business Niche</span><input value={ideasInput.niche} onChange={(event) => setIdeasInput({ ...ideasInput, niche: event.target.value })} /></label>
            <label><span>Platform</span><input value={ideasInput.platform} onChange={(event) => setIdeasInput({ ...ideasInput, platform: event.target.value })} /></label>
            <label><span>Goal</span><input value={ideasInput.goal} onChange={(event) => setIdeasInput({ ...ideasInput, goal: event.target.value })} /></label>
            <label><span>Tone</span><input value={ideasInput.tone} onChange={(event) => setIdeasInput({ ...ideasInput, tone: event.target.value })} /></label>
          </div>
          <div className="editor-actions"><button onClick={generateIdeas} disabled={loading === "ideas"}><Save size={18} /> Generate Ideas</button></div>
        </div>

        <div className="panel">
          <div className="panel-title-row"><div><p className="eyebrow">SEO assistant</p><h2>Keyword Suggestions</h2></div><Search size={20} /></div>
          <div className="project-form-grid">
            <label><span>Service / Topic</span><input value={seoInput.topic} onChange={(event) => setSeoInput({ ...seoInput, topic: event.target.value })} /></label>
            <label><span>Page</span><input value={seoInput.page} onChange={(event) => setSeoInput({ ...seoInput, page: event.target.value })} /></label>
            <label><span>Service</span><input value={seoInput.service} onChange={(event) => setSeoInput({ ...seoInput, service: event.target.value })} /></label>
          </div>
          <div className="editor-actions"><button onClick={generateSeo} disabled={loading === "seo"}><Save size={18} /> Generate SEO</button></div>
        </div>

        <div className="panel">
          <div className="panel-title-row"><div><p className="eyebrow">Proposal builder</p><h2>Generate Proposal</h2></div><FileText size={20} /></div>
          <div className="project-form-grid">
            <label><span>Lead</span><select value={proposalInput.leadId} onChange={(event) => setProposalInput({ ...proposalInput, leadId: event.target.value })}><option value="">Select lead</option>{leads.map((lead) => <option value={lead._id} key={lead._id}>{lead.name || lead.email}</option>)}</select></label>
            <label><span>Service</span><select value={proposalInput.serviceId} onChange={(event) => setProposalInput({ ...proposalInput, serviceId: event.target.value })}><option value="">Select service</option>{services.map((service) => <option value={service._id} key={service._id}>{service.title}</option>)}</select></label>
            <label><span>Project Type</span><input value={proposalInput.projectType} onChange={(event) => setProposalInput({ ...proposalInput, projectType: event.target.value })} /></label>
            <label><span>Client Name</span><input value={proposalInput.clientName} onChange={(event) => setProposalInput({ ...proposalInput, clientName: event.target.value })} /></label>
          </div>
          <div className="editor-actions"><button onClick={generateProposal} disabled={loading === "proposal"}><Save size={18} /> Generate Proposal</button></div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-title-row"><div><p className="eyebrow">Saved AI output</p><h2>Generated Ideas & SEO</h2></div></div>
          <div className="mini-list">
            {!generations.length && <div className="empty-state">No AI generations yet.</div>}
            {generations.slice(0, 6).map((item) => (
              <div className="mini-row" key={item._id}>
                <div><strong>{item.type.replace("_", " ")}</strong><small>{renderResult(item.result).slice(0, 160)}</small></div>
                <button className="secondary compact" onClick={() => copy(renderResult(item.result))}><Copy size={15} /> Copy</button>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title-row"><div><p className="eyebrow">Proposal library</p><h2>Drafts & Sent</h2></div></div>
          <div className="mini-list">
            {!proposals.length && <div className="empty-state">No proposals generated yet.</div>}
            {proposals.slice(0, 6).map((proposal) => (
              <div className="mini-row" key={proposal._id}>
                <div><strong>{proposal.title}</strong><small>{proposal.clientName} · {proposal.status}</small></div>
                <div className="media-actions">
                  <button className="secondary compact" onClick={() => copy(renderResult(proposal.content))}><Copy size={15} /> Copy</button>
                  <button className="secondary compact" onClick={() => updateProposal(proposal, proposal.content)}><Save size={15} /> Save</button>
                  <button className="secondary compact" onClick={() => emailProposal(proposal)}><Mail size={15} /> Email</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
