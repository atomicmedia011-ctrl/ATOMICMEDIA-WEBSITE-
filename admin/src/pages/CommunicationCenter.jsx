import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Mail, MessageCircle, Plus, Save, Search, Trash2 } from "lucide-react";
import { api } from "../api/client";
import ConfirmModal from "../components/ConfirmModal";
import { useToast } from "../components/Toast";

const blankTemplate = { key: "", name: "", channel: "email", subject: "", body: "", enabled: true };
const blankMeeting = { title: "", clientName: "", email: "", phone: "", scheduledAt: "", durationMinutes: 30, meetingLink: "", status: "scheduled", notifyEmail: true, notifyWhatsapp: false };

export default function CommunicationCenter() {
  const [leads, setLeads] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [template, setTemplate] = useState(blankTemplate);
  const [meeting, setMeeting] = useState(blankMeeting);
  const [message, setMessage] = useState({ leadId: "", channel: "email", subject: "", body: "" });
  const [query, setQuery] = useState("");
  const [confirm, setConfirm] = useState(null);
  const notify = useToast();

  async function load() {
    const [leadData, notificationData, templateData, meetingData] = await Promise.all([
      api("/api/admin/leads"),
      api("/api/admin/communication/notifications"),
      api("/api/admin/communication/templates"),
      api("/api/admin/communication/meetings")
    ]);
    setLeads(leadData.items || []);
    setNotifications(notificationData.items || []);
    setTemplates(templateData.items || []);
    setMeetings(meetingData.items || []);
  }

  useEffect(() => { load().catch((error) => notify(error.message, "error")); }, []);

  const filteredNotifications = useMemo(() => {
    const needle = query.toLowerCase();
    return notifications.filter((item) => `${item.channel} ${item.status} ${item.recipientEmail} ${item.recipientPhone} ${item.message}`.toLowerCase().includes(needle));
  }, [notifications, query]);

  async function sendMessage() {
    const lead = leads.find((item) => item._id === message.leadId);
    if (!lead && !message.body) return notify("Select a lead or enter a message.", "error");
    const path = message.channel === "whatsapp" ? "/api/admin/communication/whatsapp/send" : "/api/admin/communication/email/send";
    await api(path, { method: "POST", body: { leadId: message.leadId, subject: message.subject, message: message.body } });
    notify(message.channel === "whatsapp" ? "WhatsApp notification queued" : "Email notification queued");
    setMessage({ leadId: "", channel: "email", subject: "", body: "" });
    await load();
  }

  async function saveTemplate() {
    if (!template.key || !template.name || !template.body) return notify("Template key, name, and body are required.", "error");
    const saved = await api(template._id ? `/api/admin/communication/templates/${template._id}` : "/api/admin/communication/templates", {
      method: template._id ? "PATCH" : "POST",
      body: template
    });
    setTemplate(saved);
    notify("Template saved");
    await load();
  }

  async function saveMeeting() {
    if (!meeting.title || !meeting.scheduledAt) return notify("Meeting title and date/time are required.", "error");
    const body = { ...meeting, scheduledAt: new Date(meeting.scheduledAt).toISOString() };
    const saved = await api(meeting._id ? `/api/admin/communication/meetings/${meeting._id}` : "/api/admin/communication/meetings", {
      method: meeting._id ? "PATCH" : "POST",
      body
    });
    setMeeting({ ...saved, scheduledAt: saved.scheduledAt?.slice(0, 16) || "" });
    notify("Meeting saved");
    await load();
  }

  async function remove() {
    await api(confirm.kind === "template" ? `/api/admin/communication/templates/${confirm.item._id}` : `/api/admin/communication/meetings/${confirm.item._id}`, { method: "DELETE" });
    setConfirm(null);
    notify("Deleted");
    await load();
  }

  return (
    <section className="workspace">
      <div className="section-head">
        <div>
          <p className="eyebrow">Communication API</p>
          <h1>Communication Center</h1>
          <p className="section-description">Manage WhatsApp, email, templates, meetings, OTP logs, and lead follow-ups from one place.</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-title-row"><div><p className="eyebrow">Manual follow-up</p><h2>Send Message</h2></div><MessageCircle size={20} /></div>
          <div className="project-form-grid">
            <label><span>Lead</span><select value={message.leadId} onChange={(event) => setMessage({ ...message, leadId: event.target.value })}><option value="">Select lead</option>{leads.map((lead) => <option value={lead._id} key={lead._id}>{lead.name || lead.email || lead.phone}</option>)}</select></label>
            <label><span>Channel</span><select value={message.channel} onChange={(event) => setMessage({ ...message, channel: event.target.value })}><option value="email">Email</option><option value="whatsapp">WhatsApp</option></select></label>
            <label><span>Subject</span><input value={message.subject} onChange={(event) => setMessage({ ...message, subject: event.target.value })} /></label>
            <label><span>Message</span><textarea rows={5} value={message.body} onChange={(event) => setMessage({ ...message, body: event.target.value })} /></label>
          </div>
          <div className="editor-actions"><button onClick={sendMessage}><Mail size={18} /> Send / Queue</button></div>
        </div>

        <div className="panel">
          <div className="panel-title-row"><div><p className="eyebrow">Meetings</p><h2>Schedule Meeting</h2></div><Calendar size={20} /></div>
          <div className="project-form-grid">
            <label><span>Title</span><input value={meeting.title || ""} onChange={(event) => setMeeting({ ...meeting, title: event.target.value })} /></label>
            <label><span>Date / Time</span><input type="datetime-local" value={meeting.scheduledAt || ""} onChange={(event) => setMeeting({ ...meeting, scheduledAt: event.target.value })} /></label>
            <label><span>Client Name</span><input value={meeting.clientName || ""} onChange={(event) => setMeeting({ ...meeting, clientName: event.target.value })} /></label>
            <label><span>Email</span><input value={meeting.email || ""} onChange={(event) => setMeeting({ ...meeting, email: event.target.value })} /></label>
            <label><span>Phone</span><input value={meeting.phone || ""} onChange={(event) => setMeeting({ ...meeting, phone: event.target.value })} /></label>
            <label><span>Meet / Zoom Link</span><input value={meeting.meetingLink || ""} onChange={(event) => setMeeting({ ...meeting, meetingLink: event.target.value })} /></label>
            <label><span>Status</span><select value={meeting.status || "scheduled"} onChange={(event) => setMeeting({ ...meeting, status: event.target.value })}><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label>
          </div>
          <div className="editor-actions"><button className="secondary" onClick={() => setMeeting(blankMeeting)}><Plus size={18} /> New</button><button onClick={saveMeeting}><Save size={18} /> Save Meeting</button></div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-title-row"><div><p className="eyebrow">Template manager</p><h2>Email / WhatsApp Templates</h2></div><Save size={20} /></div>
          <div className="project-form-grid">
            <label><span>Key</span><input value={template.key || ""} onChange={(event) => setTemplate({ ...template, key: event.target.value })} /></label>
            <label><span>Name</span><input value={template.name || ""} onChange={(event) => setTemplate({ ...template, name: event.target.value })} /></label>
            <label><span>Channel</span><select value={template.channel || "email"} onChange={(event) => setTemplate({ ...template, channel: event.target.value })}><option value="email">Email</option><option value="whatsapp">WhatsApp</option></select></label>
            <label><span>Subject</span><input value={template.subject || ""} onChange={(event) => setTemplate({ ...template, subject: event.target.value })} /></label>
            <label><span>Body</span><textarea rows={6} value={template.body || ""} onChange={(event) => setTemplate({ ...template, body: event.target.value })} /></label>
          </div>
          <div className="editor-actions"><button className="secondary" onClick={() => setTemplate(blankTemplate)}><Plus size={18} /> New</button><button onClick={saveTemplate}><Save size={18} /> Save Template</button></div>
        </div>

        <div className="panel">
          <div className="panel-title-row"><div><p className="eyebrow">Recent records</p><h2>Templates & Meetings</h2></div></div>
          <div className="mini-list">
            {templates.slice(0, 4).map((item) => <button className="quick-action" key={item._id} onClick={() => setTemplate(item)}><span>{item.name}</span><small>{item.channel}</small></button>)}
            {meetings.slice(0, 4).map((item) => <button className="quick-action" key={item._id} onClick={() => setMeeting({ ...item, scheduledAt: item.scheduledAt?.slice(0, 16) || "" })}><span>{item.title}</span><small>{item.status}</small></button>)}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title-row">
          <div><p className="eyebrow">Status tracking</p><h2>Notifications</h2></div>
          <div className="project-search"><Search size={18} /><input placeholder="Search notifications" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        </div>
        <div className="table">
          <div className="table-row table-head"><strong>Recipient</strong><span>Channel</span><span>Status</span><span>Created</span></div>
          {!filteredNotifications.length && <div className="empty-state">No notifications yet.</div>}
          {filteredNotifications.map((item) => (
            <div className="table-row" key={item._id}>
              <div><strong>{item.recipientName || item.recipientEmail || item.recipientPhone || "Recipient"}</strong><small>{item.subject || item.message}</small></div>
              <span>{item.channel}</span><span>{item.status}</span><small>{new Date(item.createdAt).toLocaleString()}</small>
            </div>
          ))}
        </div>
      </div>
      <ConfirmModal open={!!confirm} title="Delete record?" body="This removes the selected communication record." onCancel={() => setConfirm(null)} onConfirm={remove} />
    </section>
  );
}
