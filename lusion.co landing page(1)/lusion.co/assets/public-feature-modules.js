(function () {
  var apiBase = window.ATOMIC_CMS_API || "";
  var featureSlugs = [
    "whatsapp-notifications",
    "email-notifications",
    "meeting-scheduling",
    "otp-verification",
    "ai-chatbot",
    "content-idea-generator",
    "seo-keyword-suggestions",
    "automated-proposal-generation"
  ];
  var siteData = null;

  function fetchJson(url, options) {
    return fetch(apiBase + url, Object.assign({ headers: { "Content-Type": "application/json" } }, options || {}))
      .then(function (res) { return res.ok ? res.json() : res.json().then(function (data) { throw new Error(data.message || "Request failed"); }); });
  }

  function featureServices() {
    var services = siteData && Array.isArray(siteData.services) ? siteData.services : [];
    return services.filter(function (service) {
      return service.enabled !== false && (featureSlugs.indexOf(service.slug) >= 0 || /communication|ai-powered/i.test(service.category || ""));
    }).sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }

  function serviceUrl(service) {
    return "/services/" + service.slug;
  }

  function renderFeatureSection() {
    var servicesPageRoot = document.querySelector("[data-atomic-services-page]");
    if (!servicesPageRoot) return;
    var services = featureServices();
    if (!services.length || document.querySelector("#atomic-feature-services")) return;
    var section = document.createElement("section");
    section.id = "atomic-feature-services";
    section.className = "atomic-feature-section";
    section.innerHTML = '<div class="atomic-feature-shell"><div class="atomic-feature-kicker">Communication API + AI Automation</div><h2 class="atomic-feature-title">Premium systems that turn visitors into qualified leads</h2><p class="atomic-feature-copy">These public-facing services are managed from the Atomic Media admin panel. Update title, copy, visibility, and details in Services and the frontend refreshes automatically.</p><div class="atomic-feature-grid">' +
      services.map(function (service) {
        return '<a class="atomic-feature-card" href="' + serviceUrl(service) + '"><div><h3>' + service.title + '</h3><p>' + (service.summary || "Managed from the Atomic Media CMS.") + '</p></div><span>Explore service</span></a>';
      }).join("") +
      '</div><div class="atomic-cta-row"><button class="atomic-public-button" data-atomic-open-meeting>Schedule a Meeting</button><button class="atomic-public-button" data-atomic-open-lead>Start Verified Request</button></div></div>';
    servicesPageRoot.appendChild(section);
  }

  function addCtas() {
    var heroActions = document.querySelector(".hero-frame-actions");
    if (heroActions && !heroActions.querySelector("[data-atomic-open-meeting]")) {
      var btn = document.createElement("button");
      btn.className = "atomic-public-button";
      btn.type = "button";
      btn.textContent = "Schedule a Meeting";
      btn.setAttribute("data-atomic-open-meeting", "true");
      heroActions.appendChild(btn);
    }
    var footer = document.querySelector("#footer-middle-contact");
    if (footer && !footer.querySelector("[data-atomic-open-meeting]")) {
      var row = document.createElement("div");
      row.className = "atomic-cta-row";
      row.innerHTML = '<button class="atomic-public-button" data-atomic-open-meeting>Schedule a Meeting</button><button class="atomic-public-button" data-atomic-open-lead>Verified Contact</button>';
      footer.appendChild(row);
    }
  }

  function modalShell() {
    if (document.querySelector("#atomic-public-modal")) return;
    var modal = document.createElement("div");
    modal.id = "atomic-public-modal";
    modal.className = "atomic-modal-backdrop";
    modal.innerHTML = '<div class="atomic-modal"><header><div><div class="atomic-feature-kicker" data-modal-kicker>Atomic Media</div><h2 data-modal-title>Start</h2></div><button class="atomic-modal-close" type="button" data-atomic-close>×</button></header><div data-modal-body></div><div class="atomic-form-message" data-modal-message></div></div>';
    document.body.appendChild(modal);
    modal.addEventListener("click", function (event) {
      if (event.target === modal || event.target.matches("[data-atomic-close]")) modal.classList.remove("is-open");
    });
  }

  function openModal(title, body) {
    modalShell();
    var modal = document.querySelector("#atomic-public-modal");
    modal.querySelector("[data-modal-title]").textContent = title;
    modal.querySelector("[data-modal-body]").innerHTML = body;
    modal.querySelector("[data-modal-message]").textContent = "";
    modal.classList.add("is-open");
    return modal;
  }

  function meetingForm(serviceTitle) {
    var modal = openModal("Schedule a Meeting", '<form id="atomic-meeting-form" class="atomic-form-grid"><label>Name<input name="name" required></label><label>Email<input name="email" type="email" required></label><label>Phone<input name="phone" required></label><label>Service<select name="service">' + featureServices().map(function (service) { return '<option' + (service.title === serviceTitle ? " selected" : "") + '>' + service.title + '</option>'; }).join("") + '</select></label><label class="full">Preferred Date / Time<input name="scheduledAt" type="datetime-local" required></label><label class="full">Message<textarea name="message" rows="4"></textarea></label><button class="atomic-public-button full" type="submit">Send Meeting Request</button></form>');
    modal.querySelector("#atomic-meeting-form").addEventListener("submit", function (event) {
      event.preventDefault();
      var payload = Object.fromEntries(new FormData(event.currentTarget).entries());
      fetchJson("/api/public/meetings", { method: "POST", body: JSON.stringify(payload) })
        .then(function () { modal.querySelector("[data-modal-message]").textContent = "Meeting request saved. Atomic Media will confirm shortly."; event.currentTarget.reset(); })
        .catch(function (error) { modal.querySelector("[data-modal-message]").textContent = error.message; });
    });
  }

  function leadOtpForm(serviceTitle) {
    var otpId = "";
    var verified = false;
    var modal = openModal("Verified Contact", '<form id="atomic-lead-form" class="atomic-form-grid"><label>Name<input name="name" required></label><label>Email<input name="email" type="email" required></label><label>Phone<input name="phone"></label><label>Service<select name="serviceRequired">' + featureServices().map(function (service) { return '<option' + (service.title === serviceTitle ? " selected" : "") + '>' + service.title + '</option>'; }).join("") + '</select></label><label class="full">Message<textarea name="message" rows="4" required></textarea></label><label>OTP<input name="otp" placeholder="Enter OTP"></label><button class="atomic-public-button" type="button" data-send-otp>Send OTP</button><button class="atomic-public-button" type="button" data-verify-otp>Verify OTP</button><button class="atomic-public-button" type="submit">Submit Request</button></form>');
    var form = modal.querySelector("#atomic-lead-form");
    form.querySelector("[data-send-otp]").addEventListener("click", function () {
      var email = form.elements.email.value;
      if (!email) return modal.querySelector("[data-modal-message]").textContent = "Enter email first.";
      fetchJson("/api/public/otp/request", { method: "POST", body: JSON.stringify({ channel: "email", target: email, sourcePage: location.pathname }) })
        .then(function (data) { otpId = data.id; verified = false; modal.querySelector("[data-modal-message]").textContent = "OTP sent. It expires soon."; })
        .catch(function (error) { modal.querySelector("[data-modal-message]").textContent = error.message; });
    });
    form.querySelector("[data-verify-otp]").addEventListener("click", function () {
      if (!otpId) return modal.querySelector("[data-modal-message]").textContent = "Send OTP first.";
      fetchJson("/api/public/otp/verify", { method: "POST", body: JSON.stringify({ id: otpId, code: form.elements.otp.value }) })
        .then(function () { verified = true; modal.querySelector("[data-modal-message]").textContent = "OTP verified. You can submit now."; })
        .catch(function (error) { modal.querySelector("[data-modal-message]").textContent = error.message; });
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!verified) return modal.querySelector("[data-modal-message]").textContent = "Please verify OTP before submitting.";
      var payload = Object.fromEntries(new FormData(form).entries());
      payload.sourcePage = location.pathname;
      payload.verified = true;
      fetchJson("/api/public/leads", { method: "POST", body: JSON.stringify(payload) })
        .then(function () { modal.querySelector("[data-modal-message]").textContent = "Verified request sent."; form.reset(); verified = false; otpId = ""; })
        .catch(function (error) { modal.querySelector("[data-modal-message]").textContent = error.message; });
    });
  }

  function chatbot() {
    if (document.querySelector("#atomic-chatbot-toggle")) return;
    var button = document.createElement("button");
    button.id = "atomic-chatbot-toggle";
    button.className = "atomic-chatbot-toggle";
    button.type = "button";
    button.setAttribute("aria-label", "Open Atomic AI Assistant");
    button.innerHTML = '<span class="atomic-chatbot-toggle-label">Atomic AI</span><span class="atomic-chatbot-toggle-inner">AI</span>';
    var panel = document.createElement("div");
    panel.className = "atomic-chatbot-panel";
    panel.innerHTML = '<div class="atomic-chatbot-header"><div class="atomic-chatbot-identity"><div class="atomic-chatbot-avatar">AM</div><div><h2 class="atomic-chatbot-title">Atomic AI Assistant</h2><div class="atomic-chatbot-status"><span></span>Online &bull; Replies instantly</div></div></div><div class="atomic-chatbot-actions"><button class="atomic-chatbot-icon-button" type="button" data-chat-minimize aria-label="Minimize chat">-</button><button class="atomic-chatbot-icon-button" type="button" data-chat-close aria-label="Close chat">x</button></div></div><div class="atomic-chatbot-log"></div><div class="atomic-chatbot-suggestions"></div><form class="atomic-chatbot-form" id="atomic-chatbot-form"><input name="message" autocomplete="off" placeholder="Type your reply..." required><button type="submit">Send</button></form>';
    document.body.appendChild(button);
    document.body.appendChild(panel);
    var log = panel.querySelector(".atomic-chatbot-log");
    var form = panel.querySelector("form");
    var input = form.elements.message;
    var suggestions = panel.querySelector(".atomic-chatbot-suggestions");
    var conversationId = "";
    var step = 0;
    var fields = ["name", "business", "serviceNeed", "budget", "timeline", "email", "phone"];
    var steps = [
      { prompt: "May I know your name?", placeholder: "Your name" },
      { prompt: "What type of business are you building or growing?", placeholder: "Example: real estate, clinic, SaaS, retail" },
      { prompt: "Which solution are you most interested in?", placeholder: "Choose or type a service", suggestions: ["Website development", "Branding", "Social media marketing", "SEO", "Paid ads", "AI automation", "WhatsApp/email automation"] },
      { prompt: "What budget range are you considering?", placeholder: "Example: 50k-1L, 1L-3L, premium", suggestions: ["Under 50k", "50k-1L", "1L-3L", "3L+", "Not sure yet"] },
      { prompt: "What timeline are you working with?", placeholder: "Example: ASAP, this month, next quarter", suggestions: ["ASAP", "This month", "1-3 months", "Flexible"] },
      { prompt: "What email should our strategy team use?", placeholder: "you@company.com" },
      { prompt: "And your phone or WhatsApp number?", placeholder: "Phone / WhatsApp number" }
    ];
    var answers = {};
    var finished = false;

    function add(role, text, extraHtml) {
      var row = document.createElement("div");
      row.className = "atomic-chatbot-msg-row " + role;
      var bubble = document.createElement("div");
      bubble.className = "atomic-chatbot-msg " + role;
      bubble.textContent = text;
      if (extraHtml) bubble.insertAdjacentHTML("beforeend", extraHtml);
      if (role === "bot") row.innerHTML = '<div class="atomic-chatbot-mini-avatar">AI</div>';
      row.appendChild(bubble);
      log.appendChild(row);
      log.scrollTop = log.scrollHeight;
      return row;
    }

    function typing(callback) {
      var row = add("bot", "");
      var bubble = row.querySelector(".atomic-chatbot-msg");
      bubble.innerHTML = '<span class="atomic-chatbot-typing"><i></i><i></i><i></i></span>';
      window.setTimeout(function () {
        row.remove();
        callback();
      }, 520);
    }

    function setSuggestions(items) {
      suggestions.innerHTML = "";
      (items || []).forEach(function (item) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "atomic-chatbot-chip";
        chip.textContent = item;
        chip.addEventListener("click", function () {
          input.value = item;
          input.focus();
        });
        suggestions.appendChild(chip);
      });
    }

    function askCurrent() {
      var current = steps[step];
      input.placeholder = current.placeholder || "Type your reply...";
      setSuggestions(current.suggestions);
      typing(function () { add("bot", current.prompt); });
    }

    function scoreLabel(score) {
      var value = String(score || "warm").toLowerCase();
      if (value === "hot") return "Hot Lead";
      if (value === "cold") return "Cold Lead";
      return "Warm Lead";
    }

    function start() {
      if (conversationId) return;
      fetchJson("/api/public/chatbot/conversation", { method: "POST", body: JSON.stringify({ visitorId: "visitor-" + Date.now() }) })
        .then(function (data) {
          conversationId = data._id;
          add("bot", "Hi, I'm Atomic AI. I can help you choose the right digital solution for your business.");
          window.setTimeout(askCurrent, 420);
        })
        .catch(function () {
          add("bot", "Hi, I'm Atomic AI. I can still collect your details and send them to the Atomic Media team.");
          window.setTimeout(askCurrent, 420);
        });
    }

    function closePanel() {
      panel.classList.remove("is-open");
    }

    button.addEventListener("click", function () {
      panel.classList.toggle("is-open");
      start();
      window.setTimeout(function () { input.focus(); }, 260);
    });
    panel.querySelector("[data-chat-minimize]").addEventListener("click", closePanel);
    panel.querySelector("[data-chat-close]").addEventListener("click", closePanel);

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (finished) return;
      var value = form.elements.message.value.trim();
      if (!value) return;
      add("visitor", value);
      answers[fields[step]] = value;
      form.reset();
      setSuggestions([]);
      var payload = Object.assign({ message: value }, answers);
      var request = conversationId ? fetchJson("/api/public/chatbot/conversation/" + conversationId + "/message", { method: "POST", body: JSON.stringify(payload) }) : Promise.resolve({ leadScore: "warm" });
      request
        .then(function (data) {
          step += 1;
          if (step < steps.length) {
            askCurrent();
            return null;
          }
          finished = true;
          var label = scoreLabel(data.leadScore);
          return fetchJson("/api/public/chatbot/conversation/" + conversationId + "/qualify", { method: "POST" })
            .then(function () {
              typing(function () {
                add("bot", "Thanks. Your details are saved with Atomic Media.", '<div class="atomic-chatbot-lead-score">' + label + '</div>');
                window.setTimeout(function () {
                  add("bot", "A strategist can now review your business, service interest, budget, timeline, and contact details in the admin panel.");
                }, 420);
              });
            });
        })
        .catch(function (error) {
          typing(function () { add("bot", error.message || "Something went wrong. Please try again."); });
        });
    });
  }

  function serviceDetailPage() {
    var root = document.querySelector("[data-atomic-service-detail]");
    if (!root) return;
    var slug = root.getAttribute("data-service-slug") || location.pathname.split("/").filter(Boolean).pop();
    var services = featureServices();
    var service = services.find(function (item) { return item.slug === slug; }) || services[0];
    if (!service) {
      root.innerHTML = '<section class="atomic-service-hero"><div><div class="atomic-feature-kicker">Atomic Media</div><h1>Service Not Found</h1></div></section>';
      return;
    }
    document.title = service.title + " | Atomic Media";
    var body = service.body || service.summary || "This service is managed from the Atomic Media admin panel.";
    var benefits = body.split(/\n|\. /).map(function (item) { return item.trim(); }).filter(Boolean).slice(0, 5);
    if (!benefits.length) benefits = ["Improve lead response time", "Automate repetitive follow-ups", "Create measurable customer journeys"];
    root.innerHTML = '<main class="atomic-service-page"><section class="atomic-service-hero"><div><div class="atomic-feature-kicker">' + (service.category || "Atomic Media Service") + '</div><h1>' + service.title + '</h1><div class="atomic-cta-row"><button class="atomic-public-button" data-atomic-open-meeting>Schedule a Meeting</button><button class="atomic-public-button" data-atomic-open-lead>Start Verified Request</button></div></div></section><section class="atomic-service-content"><div class="atomic-service-panel"><h2>Feature Explanation</h2><p>' + body + '</p></div><div class="atomic-service-panel"><h2>Benefits</h2><ul>' + benefits.map(function (item) { return "<li>" + item + "</li>"; }).join("") + '</ul><h2>Use Cases</h2><ul><li>Lead generation and qualification</li><li>Client follow-up and support</li><li>Campaign automation and growth systems</li></ul></div></section><section class="atomic-feature-section"><div class="atomic-feature-shell"><div class="atomic-feature-kicker">Start now</div><h2 class="atomic-feature-title">Build this into your growth system</h2><p class="atomic-feature-copy">Use the verified contact form or schedule a meeting. Both save into the Atomic Media admin panel.</p><div class="atomic-cta-row"><button class="atomic-public-button" data-atomic-open-meeting>Schedule a Meeting</button><button class="atomic-public-button" data-atomic-open-lead>Contact Atomic Media</button></div></div></section></main>';
  }

  function bindGlobalClicks() {
    document.addEventListener("click", function (event) {
      var meeting = event.target.closest("[data-atomic-open-meeting]");
      var lead = event.target.closest("[data-atomic-open-lead]");
      if (meeting) {
        event.preventDefault();
        meetingForm(meeting.getAttribute("data-service-title"));
      }
      if (lead) {
        event.preventDefault();
        leadOtpForm(lead.getAttribute("data-service-title"));
      }
    });
  }

  function boot() {
    fetchJson("/api/public/site")
      .then(function (data) {
        siteData = data;
        serviceDetailPage();
        renderFeatureSection();
        addCtas();
        chatbot();
        bindGlobalClicks();
      })
      .catch(function () {
        chatbot();
        bindGlobalClicks();
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
