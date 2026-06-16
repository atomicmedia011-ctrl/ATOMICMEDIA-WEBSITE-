(function () {
  var apiBase = window.ATOMIC_CMS_API || "";

  function pageKey() {
    var path = window.location.pathname.replace(/^\/|\/$/g, "");
    if (!path) return "home";
    if (path.indexOf("projects") === 0) return "projects";
    if (path.indexOf("about") === 0) return "about";
    return path.replace(/\W+/g, "-") || "home";
  }

  function mediaUrl(value) {
    var url = value && value.url ? value.url : value;
    if (!url) return "";
    if (/^https?:\/\//.test(url)) return url;
    return url;
  }

  function text(selector, value) {
    if (value === undefined || value === null || value === "") return;
    var el = document.querySelector(selector);
    if (el) el.textContent = value;
  }

  function html(selector, value) {
    if (value === undefined || value === null || value === "") return;
    var el = document.querySelector(selector);
    if (el) el.innerHTML = String(value).replace(/\n/g, "<br>");
  }

  function setHref(selector, value) {
    if (!value) return;
    document.querySelectorAll(selector).forEach(function (el) {
      if (el.tagName === "A") el.setAttribute("href", value);
      else {
        var link = el.querySelector("a");
        if (link) link.setAttribute("href", value);
      }
    });
  }

  function setMedia(el, value, type) {
    var url = mediaUrl(value);
    if (!url || !el) return;
    if (type === "image") {
      if (el.tagName === "IMG") el.src = url;
      else el.style.backgroundImage = "url(" + url + ")";
    }
    if (type === "video") {
      if (el.tagName === "VIDEO") {
        el.src = url;
        el.load();
      } else {
        var video = el.querySelector("video");
        if (video) {
          video.src = url;
          video.load();
        }
      }
    }
  }

  function applyField(field) {
    if (!field || field.enabled === false || !field.selector) return;
    var nodes = document.querySelectorAll(field.selector);
    nodes.forEach(function (el) {
      var value = field.media && field.media.url ? field.media.url : field.value;
      if (value === undefined || value === null) return;

      if (field.type === "html") el.innerHTML = value;
      else if (field.type === "attr" || field.type === "link") el.setAttribute(field.attr || "href", value);
      else if (field.type === "styleBackground") el.style.backgroundImage = "url(" + mediaUrl(value) + ")";
      else if (field.type === "image" || field.type === "video") setMedia(el, value, field.type);
      else if (field.type === "toggle") el.hidden = !value;
      else el.textContent = value;
    });
  }

  function applySeo(page, settings) {
    var seo = page && page.seo ? page.seo : settings && settings.seo ? settings.seo : null;
    if (!seo) return;
    if (seo.metaTitle) document.title = seo.metaTitle;
    if (seo.metaDescription) {
      var meta = document.querySelector("meta[name='description']") || document.createElement("meta");
      meta.setAttribute("name", "description");
      meta.setAttribute("content", seo.metaDescription);
      if (!meta.parentNode) document.head.appendChild(meta);
    }
    if (seo.canonicalUrl) {
      var link = document.querySelector("link[rel='canonical']") || document.createElement("link");
      link.setAttribute("rel", "canonical");
      link.setAttribute("href", seo.canonicalUrl);
      if (!link.parentNode) document.head.appendChild(link);
    }
  }

  function applySettings(settings) {
    if (!settings) return;
    text("#home-hero-title", settings.heroHeading);
    text(".hero-frame-copy strong", settings.heroHeading);
    text(".hero-frame-copy small", settings.heroSubheading);
    text("#home-reel-cta-text", settings.heroCtaText);
    setHref("#home-reel-cta, .hero-frame-actions a", settings.heroCtaLink);
    setHref("#header-right-talk-btn, #header-menu-talk", settings.heroCtaLink);
    setMedia(document.querySelector(".hero-frame-fallback"), settings.heroBackgroundImage, "image");

    if (settings.logo && settings.logo.url) {
      var headerLogo = document.querySelector("#header-logo");
      if (headerLogo) {
        headerLogo.innerHTML = '<img src="' + mediaUrl(settings.logo) + '" alt="' + (settings.companyName || "Atomic Media") + '">';
      }
    }

    if (settings.contact) {
      setHref("#footer-email, a[href^='mailto:']", settings.contact.email ? "mailto:" + settings.contact.email : "");
      if (settings.contact.address) {
        var lines = String(settings.contact.address).split(/\n|,/).map(function (line) { return line.trim(); }).filter(Boolean);
        var address = document.querySelector("#footer-contact-address");
        if (address) address.innerHTML = lines.map(function (line) { return '<div class="footer-address-line">' + line + '</div>'; }).join("");
      }
    }

    if (settings.footer) {
      text("#end-section-title-link, #footer-title", settings.footer.headline);
      text("#end-section-subtitle-text", settings.footer.body);
      var footerLines = document.querySelectorAll(".footer-address-line");
      if (settings.companyName && footerLines[0]) footerLines[0].textContent = settings.companyName;
      if (settings.footer.body && footerLines[1]) footerLines[1].textContent = settings.footer.body;
    }

    if (settings.socialLinks) {
      var socialMap = [
        ["instagram", "Instagram"],
        ["linkedin", "Linkedin"],
        ["x", "Twitter / X"],
        ["youtube", "Youtube"],
        ["dribbble", "Dribbble"]
      ];
      socialMap.forEach(function (item) {
        var key = item[0];
        var label = item[1];
        if (!settings.socialLinks[key]) return;
        document.querySelectorAll(".footer-socials-line").forEach(function (link) {
          if (link.textContent.toLowerCase().indexOf(label.toLowerCase()) >= 0) link.href = settings.socialLinks[key];
        });
      });
    }
  }

  function projectHref(project) {
    return "/projects/" + String(project.mediaFolder || project.slug || project.title || "")
      .split("/")
      .filter(Boolean)
      .pop()
      .replace(/-/g, "_");
  }

  function projectCard(project, index) {
    var colors = ["#1a1411", "#111a13", "#121414", "#261c46", "#1F2022", "#28262B"];
    var title = project.title || "Untitled Project";
    var categories = Array.isArray(project.categories) ? project.categories.join(" / ") : project.projectType || "Project";
    var id = String(project.mediaFolder || project.slug || title).split("/").filter(Boolean).pop().replace(/-/g, "_");
    var image = mediaUrl(project.coverImage || project.images && project.images[0]);
    return '<a class="project-item project-type-website" href="' + projectHref(project) + '" data-id="' + id + '" data-color-bg="' + (colors[index % colors.length]) + '" data-color-text="#ffffff" data-color-shadow="0.9">' +
      '<div class="project-item-main"><div class="project-item-image"' + (image ? ' style="background-image:url(' + image + ')"' : "") + '></div></div>' +
      '<div class="project-item-footer"><div class="project-item-line-1">' + categories + '</div><div class="project-item-line-2"><div class="project-item-line-2-icon"></div><div class="project-item-line-2-inner">' + title + '</div></div></div>' +
      '</a>';
  }

  function renderProjects(projects) {
    if (!Array.isArray(projects) || !projects.length) return;
    document.querySelectorAll(".project-list").forEach(function (list) {
      list.innerHTML = projects.filter(function (project) { return project.enabled !== false; }).map(projectCard).join("");
    });
  }

  function renderServices(services) {
    if (!Array.isArray(services) || !services.length) return;
    var enabled = services.filter(function (service) { return service.enabled !== false; });
    var cards = document.querySelectorAll(".about-capability-card");
    if (cards.length && enabled.length > cards.length) {
      var parent = cards[0].parentNode;
      var template = cards[cards.length - 1];
      while (document.querySelectorAll(".about-capability-card").length < enabled.length) {
        parent.appendChild(template.cloneNode(true));
      }
      cards = document.querySelectorAll(".about-capability-card");
    }
    enabled.forEach(function (service, index) {
      var card = cards[index];
      if (!card) return;
      card.querySelectorAll(".about-capability-card-header-text").forEach(function (el) { el.textContent = service.title || ""; });
      card.querySelectorAll(".about-capability-card-header-letter").forEach(function (el) { el.textContent = String(service.title || "A").charAt(0).toLowerCase(); });
      var list = card.querySelector(".about-capability-list");
      if (list) {
        var items = Array.isArray(service.categories) ? service.categories : String(service.category || service.summary || "").split(",");
        items = items.map(function (item) { return item.trim(); }).filter(Boolean);
        if (items.length) list.innerHTML = items.map(function (item) { return '<li class="about-capability-list-item">' + item + '</li>'; }).join("");
      }
    });
  }

  function textInside(root, selector, value) {
    if (!root || !value) return;
    var el = root.querySelector(selector);
    if (el) el.textContent = value;
  }

  function initials(name) {
    return String(name || "AM").split(/\s+/).filter(Boolean).slice(0, 2).map(function (part) { return part.charAt(0).toUpperCase(); }).join("") || "AM";
  }

  function renderTeam(team) {
    if (!Array.isArray(team) || !team.length) return;
    var enabled = team.filter(function (member) { return member.enabled !== false; });
    var core = enabled.filter(function (member) { return member.isCore; });
    var featured = core[0] || enabled[0];
    if (featured) {
      text("#about-who-team-name-text", featured.name);
      html("#about-who-team-job-text", featured.position || "");
      html("#about-who-team-desc-text", featured.bio || "");
      setMedia(document.querySelector("#about-who-team-photo"), featured.profilePicture, "image");
    }

    var grid = document.querySelector("#about-team-all-grid");
    if (!grid) return;
    var groups = {};
    enabled.forEach(function (member) {
      var group = member.department || member.category || member.team || "Atomic Media Team";
      if (!groups[group]) groups[group] = [];
      groups[group].push(member);
    });
    grid.innerHTML = Object.keys(groups).map(function (group) {
      var members = groups[group];
      return '<details class="about-team-member"><summary class="about-team-member-summary"><div class="about-team-member-avatar">' + initials(group) + '</div><div class="about-team-member-info"><h3>' + group + '</h3><p>' + members.length + ' team member' + (members.length === 1 ? "" : "s") + '</p></div></summary><div class="about-team-member-list">' +
        members.map(function (member) {
          return '<div class="about-team-person-card"><div class="about-team-person-avatar">' + initials(member.name) + '</div><div><h4>' + (member.name || "Team Member") + '</h4><span>' + (member.position || "") + '</span><p>' + (member.bio || "") + '</p></div></div>';
        }).join("") +
      '</div></details>';
    }).join("");
  }

  function renderTestimonials(testimonials) {
    if (!Array.isArray(testimonials) || !testimonials.length) return;
    var enabled = testimonials.filter(function (item) { return item.enabled !== false; });
    document.querySelectorAll("[data-cms-list='testimonials']").forEach(function (root) {
      root.innerHTML = enabled.map(function (item) {
        return '<article class="testimonial-card"><p>' + (item.quote || "") + '</p><strong>' + (item.clientName || "") + '</strong><span>' + [item.designation, item.company].filter(Boolean).join(", ") + '</span></article>';
      }).join("");
    });
  }

  function renderBlogs(blogs) {
    if (!Array.isArray(blogs) || !blogs.length) return;
    document.querySelectorAll("[data-cms-list='blogs']").forEach(function (root) {
      root.innerHTML = blogs.filter(function (post) { return post.status === "published"; }).map(function (post) {
        return '<article class="blog-card"><h3>' + (post.title || "") + '</h3><p>' + (post.excerpt || "") + '</p></article>';
      }).join("");
    });
  }

  function wireForms() {
    document.querySelectorAll("form").forEach(function (form) {
      if (form.dataset.cmsLeadWired) return;
      form.dataset.cmsLeadWired = "true";
      form.addEventListener("submit", function (event) {
        var formData = new FormData(form);
        var payload = { sourcePage: window.location.pathname };
        formData.forEach(function (value, key) { payload[key] = value; });
        if (!payload.email && !payload.message) return;
        event.preventDefault();
        fetch(apiBase + "/api/public/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).then(function () { form.reset(); });
      });
    });
  }

  function boot() {
    fetch(apiBase + "/api/public/site")
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (site) {
        if (!site) return;
        var key = pageKey();
        var page = (site.pages || []).find(function (item) { return item.page === key; });
        if (!page && key === "projects") page = (site.pages || []).find(function (item) { return item.page === "projects"; });
        if (!page) page = (site.pages || []).find(function (item) { return item.page === "home"; });
        applySettings(site.settings);
        if (page) {
          applySeo(page, site.settings);
          (page.sections || []).filter(function (section) { return section.enabled !== false; })
            .sort(function (a, b) { return (a.order || 0) - (b.order || 0); })
            .forEach(function (section) { (section.fields || []).forEach(applyField); });
        } else {
          applySeo(null, site.settings);
        }
        renderProjects(site.projects || []);
        renderServices(site.services || []);
        renderTeam(site.team || []);
        renderTestimonials(site.testimonials || []);
        renderBlogs(site.blogs || []);
        wireForms();
      })
      .catch(function () {
        wireForms();
      });

    fetch(apiBase + "/api/public/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: window.location.pathname, referrer: document.referrer })
    }).catch(function () {});
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
