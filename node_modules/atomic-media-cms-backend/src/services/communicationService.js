const Notification = require("../models/Notification");
const MessageTemplate = require("../models/MessageTemplate");

function fillTemplate(template, data = {}) {
  return String(template || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => data[key] ?? "");
}

async function templateFor(channel, key, fallback) {
  if (!key) return fallback;
  const template = await MessageTemplate.findOne({ channel, key, enabled: true });
  return template || fallback;
}

async function sendEmail({ to, name, subject, message, templateKey, data = {}, lead, createdBy, type = "manual" }) {
  const template = await templateFor("email", templateKey, null);
  const finalSubject = fillTemplate(template?.subject || subject || "Atomic Media", data);
  const finalMessage = fillTemplate(template?.body || message, data);
  const hasProvider = Boolean(process.env.SMTP_HOST || process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY);
  const notification = await Notification.create({
    channel: "email",
    type,
    recipientName: name,
    recipientEmail: to,
    subject: finalSubject,
    message: finalMessage,
    templateKey,
    lead,
    createdBy,
    provider: hasProvider ? "configured-email-provider" : "none",
    status: hasProvider ? "sent" : "pending",
    sentAt: hasProvider ? new Date() : undefined,
    providerResponse: hasProvider ? { simulated: false } : { simulated: true, reason: "Email provider keys are not configured." }
  });
  return notification;
}

async function sendWhatsapp({ to, name, message, templateKey, data = {}, lead, createdBy, type = "manual" }) {
  const template = await templateFor("whatsapp", templateKey, null);
  const finalMessage = fillTemplate(template?.body || message, data);
  const hasProvider = Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  const notification = await Notification.create({
    channel: "whatsapp",
    type,
    recipientName: name,
    recipientPhone: to,
    message: finalMessage,
    templateKey,
    lead,
    createdBy,
    provider: hasProvider ? "whatsapp-cloud-api" : "none",
    status: hasProvider ? "sent" : "pending",
    sentAt: hasProvider ? new Date() : undefined,
    providerResponse: hasProvider ? { simulated: false } : { simulated: true, reason: "WhatsApp API keys are not configured." }
  });
  return notification;
}

async function notifyNewLead(lead) {
  const data = {
    name: lead.name || "there",
    email: lead.email || "",
    phone: lead.phone || "",
    service: lead.serviceRequired || "digital project",
    message: lead.message || ""
  };
  const notifications = [];
  if (process.env.ADMIN_NOTIFY_EMAIL) {
    notifications.push(await sendEmail({
      to: process.env.ADMIN_NOTIFY_EMAIL,
      subject: "New Atomic Media lead: {{name}}",
      message: "New lead from {{name}}\nService: {{service}}\nEmail: {{email}}\nPhone: {{phone}}\nMessage: {{message}}",
      templateKey: "new-lead-admin",
      data,
      lead: lead._id,
      type: "lead_auto"
    }));
  }
  if (lead.email) {
    notifications.push(await sendEmail({
      to: lead.email,
      name: lead.name,
      subject: "We received your request",
      message: "Hi {{name}}, thanks for contacting Atomic Media. We will review your {{service}} request and get back to you soon.",
      templateKey: "lead-confirmation",
      data,
      lead: lead._id,
      type: "confirmation"
    }));
  }
  if (lead.phone && process.env.AUTO_WHATSAPP_ON_LEAD === "true") {
    notifications.push(await sendWhatsapp({
      to: lead.phone,
      name: lead.name,
      message: "Hi {{name}}, Atomic Media received your {{service}} request. Our team will contact you soon.",
      templateKey: "lead-whatsapp-confirmation",
      data,
      lead: lead._id,
      type: "lead_auto"
    }));
  }
  return notifications;
}

module.exports = { sendEmail, sendWhatsapp, notifyNewLead, fillTemplate };
