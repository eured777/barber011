/*
 * RED DO CORTE — lógica do site (HTML/CSS/JS puros).
 * Dados base ficam em config.js (window.RDC_CONFIG).
 * MODO DE TESTE: sem servidor. Login, agendamentos, avisos e ajustes do barbeiro
 * (dias, horários, dias fechados e valores) ficam no localStorage DESTE navegador.
 */
(function () {
  "use strict";

  const CFG = window.RDC_CONFIG;
  const KEYS = {
    session: "rdc-session",
    profile: "rdc-profile",
    bookings: "rdc-bookings",
    notifs: "rdc-notifications",
    theme: "rdc-theme",
    config: "rdc-config",
  };
  const WEEKDAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const THEME_COLOR = { dark: "#141210", light: "#f8f5ef" };

  const app = document.getElementById("app");

  // ---------- utilidades ----------
  const pad = (n) => String(n).padStart(2, "0");
  const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const fromKey = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const addDaysKey = (s, n) => {
    const d = fromKey(s);
    d.setDate(d.getDate() + n);
    return toKey(d);
  };
  const monthOf = (k) => k.slice(0, 7);
  function shiftMonth(ym, n) {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y, m - 1 + n, 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  }
  function monthTitle(ym) {
    const [y, m] = ym.split("-").map(Number);
    const s = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1));
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  const brl = (cents) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const centsToInput = (c) => (c / 100).toFixed(2).replace(".", ",");
  const durLabel = (m) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)}h${pad(m % 60)}` : `${m / 60}h`);
  const minToTime = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const hourLabel = (m) => (m % 60 ? `${Math.floor(m / 60)}h${pad(m % 60)}` : `${m / 60}h`);
  const fmtLong = (d) => new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(d);
  const fmtTime = (iso) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  const fmtWhen = (iso) =>
    new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const digits = (s) => String(s).replace(/\D/g, "");
  const isValidWhatsApp = (s) => [10, 11].includes(digits(s).length);
  const initials = (name) => {
    const p = String(name).trim().split(/\s+/).filter(Boolean);
    return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase() || "?";
  };
  function formatPhone(s) {
    const d = digits(s).slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  const photo = (key) => {
    const src = CFG.images?.[key];
    return src ? `<span class="photo-bg" style="background-image:url('${esc(src)}')"></span>` : `<span class="photo-bg"></span>`;
  };
  const ICONS = {
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.5 8.5L20 20M8.5 15.5L20 4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    award: '<circle cx="12" cy="9" r="6"/><path d="M8.5 14.5L7 22l5-3 5 3-1.5-7.5"/>',
    message: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.5A8 8 0 1 1 21 12z"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.8"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    calendarX: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9.5 14.5l5 5M14.5 14.5l-5 5"/>',
    calendarClock: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M12 13v3l2 1.5"/>',
    pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    panel: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  };
  const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] ?? ""}</svg>`;

  // localStorage protegido: navegador privado ou bloqueado não quebra o site
  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }
  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* sem persistência neste navegador */
    }
  }
  const getProfile = () => load(KEYS.profile, null);
  const getSession = () => load(KEYS.session, null);
  const getBookings = () => load(KEYS.bookings, []);
  const setBookings = (list) => save(KEYS.bookings, list);
  const getAllNotifs = () => load(KEYS.notifs, []);
  const setAllNotifs = (list) => save(KEYS.notifs, list);
  const myNotifs = () => {
    const s = getSession();
    return s ? getAllNotifs().filter((n) => n.to === s.email) : [];
  };
  const isAdmin = () => getSession()?.role === "admin";
  const uid = () => (crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()));

  // ---------- ajustes do barbeiro (sobrepõem config.js) ----------
  const ovr = () => load(KEYS.config, {});
  const saveOvr = (patch) => save(KEYS.config, { ...ovr(), ...patch });

  function hours() {
    const o = ovr().hours || {};
    return {
      weekdays: o.weekdays ?? CFG.hours.weekdays,
      openMin: o.openMin ?? CFG.hours.openMin,
      closeMin: o.closeMin ?? CFG.hours.closeMin,
      slotStepMin: CFG.hours.slotStepMin,
      daysAhead: CFG.hours.daysAhead,
    };
  }
  function labelFrom(h) {
    const days = [...h.weekdays].sort((a, b) => a - b).map((d) => WEEKDAY_NAMES[d]);
    return `${days.join(", ") || "Fechado"} · ${hourLabel(h.openMin)} às ${hourLabel(h.closeMin)}`;
  }
  const hoursLabel = () => labelFrom(hours());
  const closedDates = () => ovr().closedDates ?? [];

  // Lista de serviços: a salva pelo admin substitui a do config.js
  function services() {
    const base = ovr().services ?? CFG.services;
    const p = ovr().prices ?? {};
    return base.map((s) => ({ ...s, priceCents: p[s.id] ?? s.priceCents }));
  }
  const slugId = (name) =>
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 6);
  const serviceById = (id) => services().find((s) => s.id === id);

  const isWeekdayOn = (key) => hours().weekdays.includes(fromKey(key).getDay());
  const isDayOpen = (key) => isWeekdayOn(key) && !closedDates().includes(key);

  // ---------- toast e tema ----------
  let toastTimer;
  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
  }

  function currentTheme() {
    return document.documentElement.classList.contains("light") ? "light" : "dark";
  }
  function setTheme(theme) {
    document.documentElement.classList.toggle("light", theme === "light");
    const m = document.querySelector('meta[name="theme-color"]');
    if (m) m.setAttribute("content", THEME_COLOR[theme]);
    try {
      localStorage.setItem(KEYS.theme, theme);
    } catch {
      /* tema vale só nesta visita */
    }
  }

  // ---------- sessão (modo de teste) ----------
  function login(email, password) {
    const e = String(email).trim().toLowerCase();
    const acc = CFG.testAccounts.find((a) => a.email.toLowerCase() === e && a.password === password);
    if (!acc) return false;
    save(KEYS.session, { email: acc.email, role: acc.role, name: acc.name });
    if (!getProfile()) save(KEYS.profile, { name: acc.name, nickname: "", phone: "" });
    return true;
  }
  function logout() {
    try {
      localStorage.removeItem(KEYS.session);
    } catch {
      /* ignora */
    }
    location.hash = "#/";
    route();
    toast("Você saiu da conta");
  }

  // ---------- horários e calendário ----------
  function buildSlots({ date, durationMin, barberId }) {
    if (!isDayOpen(date)) return [];
    const h = hours();
    const [y, m, d] = date.split("-").map(Number);
    const now = Date.now();
    const bookings = getBookings().filter((b) => b.status === "confirmado");
    const slots = [];
    for (let min = h.openMin; min + durationMin <= h.closeMin; min += h.slotStepMin) {
      const start = new Date(y, m - 1, d, Math.floor(min / 60), min % 60);
      const end = new Date(start.getTime() + durationMin * 60000);
      const taken = bookings.some(
        (b) =>
          b.barber_id === barberId &&
          new Date(b.starts_at).getTime() < end.getTime() &&
          new Date(b.ends_at).getTime() > start.getTime(),
      );
      slots.push({
        time: minToTime(min),
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        available: !taken && start.getTime() > now,
      });
    }
    return slots;
  }

  // Monta um calendário mensal. cell(k) devolve {cls, disabled, dot}.
  function calendarHtml({ month, selected, nav, cell }) {
    const [y, m] = month.split("-").map(Number);
    const first = new Date(y, m - 1, 1).getDay();
    const total = new Date(y, m, 0).getDate();
    let cells = "";
    for (let i = 0; i < first; i++) cells += "<span></span>";
    for (let d = 1; d <= total; d++) {
      const k = `${y}-${pad(m)}-${pad(d)}`;
      const c = cell(k);
      cells += `<button type="button" class="cal-day ${c.cls || ""} ${k === selected ? "sel" : ""}" data-cal="${k}" ${
        c.disabled ? "disabled" : ""
      } aria-label="${k}" ${k === selected ? 'aria-pressed="true"' : ""}>${d}${c.dot ? '<span class="dot"></span>' : ""}</button>`;
    }
    return `
      <div class="cal">
        <div class="cal-top">
          <button type="button" class="cal-nav" data-calnav="-1" aria-label="Mês anterior" ${nav.prevDisabled ? "disabled" : ""}>‹</button>
          <strong>${esc(monthTitle(month))}</strong>
          <button type="button" class="cal-nav" data-calnav="1" aria-label="Próximo mês" ${nav.nextDisabled ? "disabled" : ""}>›</button>
        </div>
        <div class="cal-week">${WEEKDAY_NAMES.map((w) => `<span>${w.charAt(0)}</span>`).join("")}</div>
        <div class="cal-grid">${cells}</div>
      </div>`;
  }
  function bindCal(onPick, onNav) {
    app.querySelectorAll("[data-cal]").forEach((el) => el.addEventListener("click", () => onPick(el.dataset.cal)));
    app.querySelectorAll("[data-calnav]").forEach((el) => el.addEventListener("click", () => onNav(Number(el.dataset.calnav))));
  }

  // ---------- topo e menu ----------
  function renderAccount() {
    const s = getSession();
    const acc = document.getElementById("account");
    if (s) {
      acc.className = "avatar";
      acc.innerHTML = `<span>${esc(initials(s.name))}</span>`;
      acc.setAttribute("aria-label", `Minha conta: ${s.name}`);
      acc.href = "#/meus-agendamentos";
    } else {
      acc.className = "pill";
      acc.textContent = "Entrar";
      acc.setAttribute("aria-label", "Entrar");
      acc.href = "#/entrar";
    }
    document.getElementById("menu-logout").hidden = !s;
    document.getElementById("menu-login").hidden = !!s;
    const navAdmin = document.getElementById("nav-admin");
    navAdmin.hidden = !isAdmin();
    navAdmin.style.display = isAdmin() ? "" : "none";
  }

  function renderBadges() {
    const unread = myNotifs().filter((n) => !n.read_at).length;
    const badge = document.getElementById("menu-badge");
    const dot = document.getElementById("menu-dot");
    badge.hidden = unread === 0;
    badge.textContent = unread;
    dot.hidden = unread === 0;
    document.getElementById("menu-btn").setAttribute(
      "aria-label",
      unread > 0 ? `Menu, ${unread} notificação(ões) nova(s)` : "Menu",
    );
  }

  // ---------- páginas do cliente ----------
  function renderHome() {
    const s = getSession();
    const first = s?.name?.split(" ")[0];
    const smallIcon = (name) =>
      icon(name).replace("<svg", '<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"');
    app.innerHTML = `
      <section class="hero">
        ${photo("hero")}
        <div class="hero-text">
          <p class="hero-kicker">Barbearia</p>
          <h1 class="hero-title">${esc(CFG.shopName)}</h1>
          <div class="hero-meta">
            <span>${smallIcon("clock")} ${esc(hoursLabel())}</span>
            <span>${smallIcon("pin")} Atendimento com hora marcada</span>
          </div>
        </div>
      </section>

      <div class="home-heading">
        <h2>${first ? `Fala, ${esc(first)}!` : "O que você quer fazer?"}</h2>
        <p class="subtitle">${first ? "Escolha uma opção para continuar" : "Escolha uma opção — você precisa entrar para agendar"}</p>
        <span class="gold-rule"></span>
      </div>

      <div class="menu-cards">
        <a class="photo-card" href="#/agendar" style="animation-delay:60ms">
          ${photo("fade")}
          <span class="content">
            <span><strong>Agendar horário</strong><span class="desc">Escolha serviço, barbeiro e hora</span></span>
            <span class="arrow-circle">›</span>
          </span>
        </a>
        <a class="photo-card mirrored" href="#/meus-agendamentos" style="animation-delay:120ms">
          ${photo("barba")}
          <span class="content">
            <span><strong>Meus agendamentos</strong><span class="desc">Veja e cancele seus horários</span></span>
            <span class="arrow-circle">›</span>
          </span>
        </a>
        <a class="photo-card" href="#/servicos" style="animation-delay:180ms">
          ${photo("classico")}
          <span class="content">
            <span><strong>Serviços e preços</strong><span class="desc">Corte, barba, combo e mais</span></span>
            <span class="arrow-circle">›</span>
          </span>
        </a>
      </div>
    `;
  }

  function pageHead(title, subtitle, imageKey) {
    return `
      <section class="photo-head">
        ${photo(imageKey)}
        <div class="content">
          <a class="back-chip" href="#/">‹ Voltar</a>
          <div>
            <h1>${esc(title)}</h1>
            <p>${esc(subtitle)}</p>
          </div>
        </div>
      </section>`;
  }

  function renderServicos() {
    app.innerHTML = `
      ${pageHead("Serviços", "Preços e duração de cada atendimento", "classico")}
      <ul class="list" style="margin-top:1.25rem">
        ${services()
          .map(
            (s) => `
          <li class="card service-row">
            <div>
              <h3>${esc(s.name)}</h3>
              <p>${esc(s.description)}</p>
              <p>⏱ ${durLabel(s.durationMin)}</p>
            </div>
            <span class="price">${brl(s.priceCents)}</span>
          </li>`,
          )
          .join("")}
      </ul>
      <a class="btn-gold" href="#/agendar">Agendar agora</a>
    `;
  }

  // Estado da tela de agendamento (fica na memória enquanto a página está aberta)
  const booking = {
    serviceId: CFG.services[0].id,
    barberId: CFG.barbers[0].id,
    date: null,
    month: null,
    time: null,
  };

  function firstBookableDay() {
    const today = toKey(new Date());
    for (let i = 0; i <= hours().daysAhead; i++) {
      const k = addDaysKey(today, i);
      if (isDayOpen(k)) return k;
    }
    return today;
  }

  function renderAgendar() {
    const profile = getProfile();
    const today = toKey(new Date());
    const end = addDaysKey(today, hours().daysAhead);
    if (!booking.date || booking.date < today || booking.date > end || !isDayOpen(booking.date)) {
      booking.date = firstBookableDay();
      booking.time = null;
      booking.month = monthOf(booking.date);
    }
    const minMonth = monthOf(today);
    const maxMonth = monthOf(end);
    if (!booking.month || booking.month < minMonth) booking.month = minMonth;

    const service = serviceById(booking.serviceId);
    const slots = buildSlots({ date: booking.date, durationMin: service.durationMin, barberId: booking.barberId });
    const free = slots.filter((s) => s.available);
    if (booking.time && !free.some((s) => s.time === booking.time)) booking.time = null;

    app.innerHTML = `
      ${pageHead("Agendar", "Monte seu horário em poucos toques", "fade")}

      <h3 class="section-title">Serviço</h3>
      <div class="chips">
        ${services()
          .map(
            (s) => `
          <button class="chip ${s.id === booking.serviceId ? "on" : ""}" data-service="${esc(s.id)}">
            ${esc(s.name)}
            <small>${brl(s.priceCents)} · ${durLabel(s.durationMin)}</small>
          </button>`,
          )
          .join("")}
      </div>

      <h3 class="section-title">Barbeiro</h3>
      <div class="chip-row">
        ${CFG.barbers
          .map((b) => `<button class="chip ${b.id === booking.barberId ? "on" : ""}" data-barber="${esc(b.id)}">${esc(b.name)}</button>`)
          .join("")}
      </div>

      <h3 class="section-title">Dia</h3>
      ${calendarHtml({
        month: booking.month,
        selected: booking.date,
        nav: { prevDisabled: booking.month <= minMonth, nextDisabled: booking.month >= maxMonth },
        cell: (k) => {
          if (k < today || k > end) return { disabled: true, cls: "out" };
          if (!isDayOpen(k)) return { disabled: true, cls: "off" };
          return { cls: k === today ? "today" : "" };
        },
      })}
      <p class="cal-legend"><span><i class="lg lg-open"></i>Aberto</span><span><i class="lg lg-off"></i>Fechado</span></p>

      <h3 class="section-title">Horário <span class="sub">${esc(fmtLong(fromKey(booking.date)))}</span></h3>
      ${
        free.length === 0
          ? `<p class="empty">Nenhum horário livre neste dia. Escolha outro dia.</p>`
          : `<div class="scroller" role="listbox" aria-label="Horários livres">
              ${free
                .map(
                  (s) => `
                <button class="chip time-chip ${s.time === booking.time ? "on" : ""}" data-time="${s.time}" role="option" aria-selected="${s.time === booking.time}">
                  ${s.time}
                </button>`,
                )
                .join("")}
            </div>`
      }

      <h3 class="section-title">Seus dados</h3>
      <input class="field" id="f-name" placeholder="Seu nome" autocomplete="name" value="${esc(profile?.name ?? "")}" />
      <input class="field" id="f-nick" placeholder="Apelido (opcional)" autocomplete="nickname" value="${esc(profile?.nickname ?? "")}" />
      <p class="hint">Como o barbeiro te conhece, se for diferente do nome.</p>
      <input class="field" id="f-phone" placeholder="WhatsApp com DDD" type="tel" inputmode="numeric" autocomplete="tel" value="${esc(profile?.phone ? formatPhone(profile.phone) : "")}" />

      <button class="btn-gold" id="confirm" ${booking.time ? "" : "disabled"}>
        ${booking.time ? `Confirmar · ${booking.time} · ${brl(service.priceCents)}` : "Escolha um horário"}
      </button>
    `;

    app.querySelectorAll("[data-service]").forEach((el) =>
      el.addEventListener("click", () => {
        booking.serviceId = el.dataset.service;
        booking.time = null;
        renderAgendar();
      }),
    );
    app.querySelectorAll("[data-barber]").forEach((el) =>
      el.addEventListener("click", () => {
        booking.barberId = el.dataset.barber;
        booking.time = null;
        renderAgendar();
      }),
    );
    bindCal(
      (k) => {
        booking.date = k;
        booking.month = monthOf(k);
        booking.time = null;
        renderAgendar();
      },
      (n) => {
        booking.month = shiftMonth(booking.month, n);
        renderAgendar();
      },
    );
    app.querySelectorAll("[data-time]").forEach((el) =>
      el.addEventListener("click", () => {
        booking.time = el.dataset.time;
        renderAgendar();
      }),
    );

    const phoneInput = document.getElementById("f-phone");
    phoneInput.addEventListener("input", () => {
      phoneInput.value = formatPhone(phoneInput.value);
      phoneInput.setAttribute("aria-invalid", phoneInput.value.length > 0 && !isValidWhatsApp(phoneInput.value));
    });
    document.getElementById("confirm").addEventListener("click", () => confirmBooking(service, slots));
  }

  function confirmBooking(service, slots) {
    const session = getSession();
    const name = document.getElementById("f-name").value.trim();
    const nickname = document.getElementById("f-nick").value.trim();
    const phone = document.getElementById("f-phone").value;

    if (!name) return toast("Informe seu nome");
    if (!isValidWhatsApp(phone)) return toast("Informe seu WhatsApp com DDD");
    if (!isDayOpen(booking.date)) return toast("Este dia não está mais aberto para agendamento");

    const slot = slots.find((s) => s.time === booking.time);
    if (!slot) return toast("Esse horário não está mais disponível");
    if (getBookings().some((b) => b.status === "confirmado" && b.barber_id === booking.barberId && b.starts_at === slot.startsAt)) {
      return toast("Esse horário acabou de ser reservado. Escolha outro.");
    }

    save(KEYS.profile, { name, nickname, phone: digits(phone) });
    const barber = CFG.barbers.find((b) => b.id === booking.barberId);
    setBookings([
      ...getBookings(),
      {
        id: uid(),
        client_email: session.email,
        client_name: name,
        client_nickname: nickname || null,
        client_phone: digits(phone),
        service_id: service.id,
        service_name: service.name,
        price_cents: service.priceCents,
        duration_min: service.durationMin,
        barber_id: barber.id,
        barber_name: barber.name,
        starts_at: slot.startsAt,
        ends_at: slot.endsAt,
        status: "confirmado",
      },
    ]);
    booking.time = null;
    renderAccount();
    toast("Horário agendado!");
    location.hash = "#/meus-agendamentos";
  }

  function renderMeus() {
    const session = getSession();
    const now = Date.now();
    const all = getBookings()
      .filter((b) => b.client_email === session.email)
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    const upcoming = all.filter((b) => b.status === "confirmado" && new Date(b.starts_at).getTime() > now);
    const history = all.filter((b) => !upcoming.includes(b)).reverse();

    app.innerHTML = `
      ${pageHead("Meus agendamentos", "Seus próximos horários e histórico", "barba")}

      <h3 class="section-title">Próximos</h3>
      ${
        upcoming.length === 0
          ? `<div class="empty">Nenhum horário marcado.<br /><a class="btn-soft" href="#/agendar">Agendar horário</a></div>`
          : upcoming
              .map(
                (b) => `
          <article class="card booking">
            <div class="when">${esc(fmtLong(new Date(b.starts_at)))}</div>
            <p class="time">${fmtTime(b.starts_at)}</p>
            <p class="info">${esc(b.service_name)} com ${esc(b.barber_name)} · <span class="info-gold">${brl(b.price_cents)}</span></p>
            <button class="btn-soft danger" data-cancel="${esc(b.id)}">Cancelar horário</button>
          </article>`,
              )
              .join("")
      }

      ${
        history.length
          ? `<h3 class="section-title">Histórico</h3>
             <ul class="list">
               ${history
                 .map(
                   (b) => `
                 <li class="card service-row" style="padding:1rem 1.25rem">
                   <div>
                     <p style="margin:0;color:var(--foreground);font-weight:700">${esc(b.service_name)}</p>
                     <p>${esc(fmtLong(new Date(b.starts_at)))} · ${fmtTime(b.starts_at)}</p>
                   </div>
                   <span class="badge ${b.status === "cancelado" ? "off" : "ok"}">${esc(b.status)}</span>
                 </li>`,
                 )
                 .join("")}
             </ul>`
          : ""
      }
    `;

    app.querySelectorAll("[data-cancel]").forEach((el) =>
      el.addEventListener("click", () => {
        if (!window.confirm("Cancelar este horário?")) return;
        setBookings(getBookings().map((b) => (b.id === el.dataset.cancel ? { ...b, status: "cancelado" } : b)));
        toast("Agendamento cancelado");
        renderMeus();
      }),
    );
  }

  function renderNotificacoes() {
    const list = myNotifs().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    app.innerHTML = `
      ${pageHead("Notificações", "Avisos da barbearia sobre seus horários", "hero")}

      <div style="margin-top:1.25rem;display:grid;gap:0.75rem">
        ${
          list.length === 0
            ? `<div class="empty" style="padding:2rem 1.5rem">
                 <p style="margin:0;color:var(--foreground);font-weight:700">Nenhum aviso</p>
                 <p style="margin:0.4rem 0 0">Se a barbearia cancelar ou mudar seu horário, você fica sabendo aqui.</p>
               </div>`
            : list
                .map(
                  (n) => `
            <article class="notice ${n.read_at ? "" : "unread"}">
              <span class="notice-icon ${n.kind === "cancelado" ? "cancel" : ""}">${icon(n.kind === "cancelado" ? "calendarX" : "calendarClock")}</span>
              <div style="flex:1;min-width:0">
                <h4>${esc(n.title)}</h4>
                <p>${esc(n.body)}</p>
                <time>${esc(fmtWhen(n.created_at))}</time>
              </div>
              <button class="x" aria-label="Apagar aviso" data-del="${esc(n.id)}">✕</button>
            </article>`,
                )
                .join("")
        }
      </div>
    `;

    const now = new Date().toISOString();
    const session = getSession();
    const all = getAllNotifs();
    if (all.some((n) => n.to === session.email && !n.read_at)) {
      setAllNotifs(all.map((n) => (n.to === session.email && !n.read_at ? { ...n, read_at: now } : n)));
    }
    renderBadges();

    app.querySelectorAll("[data-del]").forEach((el) =>
      el.addEventListener("click", () => {
        setAllNotifs(getAllNotifs().filter((n) => n.id !== el.dataset.del));
        renderNotificacoes();
      }),
    );
  }

  // ---------- Painel do barbeiro (só conta admin) ----------
  const painel = {
    tab: "agenda",
    date: toKey(new Date()),
    month: monthOf(toKey(new Date())),
    draft: null, // horários em edição, antes de salvar
    editing: null, // serviço em edição: id, "new" ou null
  };

  const activeCount = (k) =>
    getBookings().filter((b) => b.status === "confirmado" && toKey(new Date(b.starts_at)) === k).length;

  function painelAgenda() {
    const day = painel.date;
    const dayBookings = getBookings()
      .filter((b) => toKey(new Date(b.starts_at)) === day)
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    const active = dayBookings.filter((b) => b.status !== "cancelado");
    const revenue = active.filter((b) => b.status !== "faltou").reduce((sum, b) => sum + b.price_cents, 0);
    const closed = closedDates().includes(day);
    const weekOn = isWeekdayOn(day);

    let action;
    if (!weekOn) {
      action = `<p class="hint">Este dia da semana está fora do horário de atendimento. Para abrir, marque o dia em Horários.</p>`;
    } else if (closed) {
      action = `<button class="btn-gold" id="day-toggle">Abrir este dia para agendamento</button>`;
    } else {
      action = `<button class="btn-soft danger" id="day-toggle">Fechar este dia para agendamento</button>
                <p class="hint">Fechar não cancela os horários já marcados. Cancele-os na lista abaixo se precisar.</p>`;
    }

    return `
      ${calendarHtml({
        month: painel.month,
        selected: day,
        nav: { prevDisabled: false, nextDisabled: false },
        cell: (k) => {
          const isClosed = closedDates().includes(k);
          const off = !isWeekdayOn(k);
          return { cls: isClosed ? "closed" : off ? "off" : "", dot: activeCount(k) > 0 };
        },
      })}
      <p class="cal-legend"><span><i class="lg lg-open"></i>Aberto</span><span><i class="lg lg-off"></i>Fechado</span><span><i class="lg lg-closed"></i>Fechado por você</span></p>

      <h3 class="section-title">${esc(fmtLong(fromKey(day)))} ${closed ? '<span class="sub">· fechado</span>' : ""}</h3>
      <div class="chip-row">
        <div class="card" style="padding:0.9rem;text-align:center">
          <p style="margin:0;font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted-foreground)">Agendamentos</p>
          <p class="price" style="margin-top:0.25rem">${active.length}</p>
        </div>
        <div class="card" style="padding:0.9rem;text-align:center">
          <p style="margin:0;font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted-foreground)">Previsto</p>
          <p class="price" style="margin-top:0.25rem">${brl(revenue)}</p>
        </div>
      </div>
      <div style="margin-top:0.9rem">${action}</div>

      <h3 class="section-title">Atendimentos</h3>
      ${
        dayBookings.length === 0
          ? `<p class="empty">Agenda livre neste dia.</p>`
          : `<ul class="list">
              ${dayBookings
                .map((b) => {
                  const who = b.client_nickname
                    ? `${esc(b.client_nickname)} <span class="muted">· ${esc(b.client_name)}</span>`
                    : esc(b.client_name);
                  const open = b.status === "confirmado";
                  return `
                  <li class="card booking" style="${open ? "" : "opacity:0.75"}">
                    <div class="when">${fmtTime(b.starts_at)} · ${esc(b.barber_name)}</div>
                    <p class="info" style="margin-top:0.35rem;color:var(--foreground);font-weight:700">${who}</p>
                    <p class="info">${esc(b.service_name)} · ${brl(b.price_cents)}${b.client_phone ? ` · ${esc(formatPhone(b.client_phone))}` : ""}</p>
                    <p style="margin:0.5rem 0 0"><span class="badge ${b.status === "cancelado" ? "off" : "ok"}">${esc(b.status)}</span></p>
                    ${
                      open
                        ? `<div style="display:flex;flex-wrap:wrap;gap:0.5rem">
                            <button class="btn-soft" data-status="concluido" data-id="${esc(b.id)}">Concluído</button>
                            <button class="btn-soft" data-status="faltou" data-id="${esc(b.id)}">Faltou</button>
                            <button class="btn-soft danger" data-status="cancelado" data-id="${esc(b.id)}">Cancelar</button>
                           </div>`
                        : ""
                    }
                  </li>`;
                })
                .join("")}
            </ul>`
      }
    `;
  }

  function painelHorarios() {
    const d = painel.draft ?? { weekdays: [...hours().weekdays], openMin: hours().openMin, closeMin: hours().closeMin };
    painel.draft = d;
    const times = [];
    for (let m = 360; m <= 1320; m += 30) times.push(m);
    const opts = (sel) => times.map((m) => `<option value="${m}" ${m === sel ? "selected" : ""}>${minToTime(m)}</option>`).join("");
    return `
      <h3 class="section-title">Dias de atendimento</h3>
      <div class="chip-row">
        ${WEEKDAY_NAMES.map(
          (n, i) =>
            `<button type="button" class="chip ${d.weekdays.includes(i) ? "on" : ""}" data-wd="${i}" aria-pressed="${d.weekdays.includes(i)}">${n}</button>`,
        ).join("")}
      </div>

      <h3 class="section-title">Horário</h3>
      <div class="chip-row">
        <label class="hint" style="display:grid;gap:0.35rem">Abre às
          <select class="field" id="h-open">${opts(d.openMin)}</select>
        </label>
        <label class="hint" style="display:grid;gap:0.35rem">Fecha às
          <select class="field" id="h-close">${opts(d.closeMin)}</select>
        </label>
      </div>

      <p class="hint">Prévia para o cliente: ${esc(labelFrom(d))}</p>
      <button class="btn-gold" id="save-hours">Salvar horários</button>
      <p class="hint">Vale para o agendamento dos clientes. Os horários já marcados não mudam. Para fechar um dia específico, use a Agenda.</p>
    `;
  }

  function serviceForm(s) {
    return `
      <form class="card" id="svc-form" novalidate style="display:grid;gap:0.6rem;margin-top:0.75rem">
        <p class="hint" style="margin:0">${s ? `Editando ${esc(s.name)}` : "Novo serviço"}</p>
        <input class="field" id="sv-name" placeholder="Nome do serviço" value="${esc(s?.name ?? "")}" />
        <input class="field" id="sv-desc" placeholder="Descrição (opcional)" value="${esc(s?.description ?? "")}" />
        <div class="chip-row">
          <label class="hint" style="display:grid;gap:0.35rem">Tempo (min)
            <input class="field" id="sv-dur" inputmode="numeric" value="${esc(s?.durationMin ?? 30)}" />
          </label>
          <label class="hint" style="display:grid;gap:0.35rem">Preço (R$)
            <input class="field" id="sv-price" inputmode="decimal" value="${esc(s ? centsToInput(s.priceCents) : "")}" />
          </label>
        </div>
        <div style="display:flex;gap:0.5rem">
          <button type="button" class="btn-gold" id="sv-save" style="flex:1">Salvar</button>
          <button type="button" class="btn-soft" id="sv-cancel">Cancelar</button>
        </div>
      </form>`;
  }

  function painelServicos() {
    const list = services();
    const editing = painel.editing;
    return `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:0.75rem;margin-top:0.5rem">
        <h3 class="section-title" style="margin:0">Serviços</h3>
        <button class="btn-soft" id="svc-add">+ Adicionar serviço</button>
      </div>
      <p class="hint">Estes são os serviços e valores que o cliente vê. Toque no lápis para alterar.</p>
      ${editing === "new" ? serviceForm(null) : ""}
      <ul class="list">
        ${list
          .map(
            (s) => `
          <li class="card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.75rem">
              <div style="min-width:0">
                <h3 style="display:flex;align-items:center;gap:0.4rem;margin:0">${esc(s.name)}
                  <button class="pencil" data-edit="${esc(s.id)}" aria-label="Alterar nome de ${esc(s.name)}" title="Alterar nome">${icon("pencil")}</button>
                </h3>
                ${s.description ? `<p class="hint" style="margin:0.25rem 0 0">${esc(s.description)}</p>` : ""}
                <p style="margin:0.35rem 0 0;display:flex;align-items:center;gap:0.4rem">⏱ ${durLabel(s.durationMin)}
                  <button class="pencil" data-edit="${esc(s.id)}" aria-label="Alterar tempo de ${esc(s.name)}" title="Alterar tempo">${icon("pencil")}</button>
                </p>
              </div>
              <span class="price">${brl(s.priceCents)}</span>
            </div>
            ${editing === s.id ? serviceForm(s) : ""}
          </li>`,
          )
          .join("")}
      </ul>`;
  }

  function renderPainel() {
    const tabs = [
      ["agenda", "Agenda"],
      ["horarios", "Horários"],
      ["servicos", "Serviços"],
    ];
    const body = painel.tab === "horarios" ? painelHorarios() : painel.tab === "servicos" ? painelServicos() : painelAgenda();
    app.innerHTML = `
      ${pageHead("Painel do barbeiro", "Agenda, dias e horários, e valores dos serviços", "hero")}
      <div class="tabs" role="tablist" style="margin-top:1.25rem">
        ${tabs
          .map(([k, l]) => `<button role="tab" aria-selected="${painel.tab === k}" class="${painel.tab === k ? "on" : ""}" data-ptab="${k}">${l}</button>`)
          .join("")}
      </div>
      <div style="margin-top:0.5rem">${body}</div>
    `;
    bindPainel();
  }

  function bindPainel() {
    app.querySelectorAll("[data-ptab]").forEach((el) =>
      el.addEventListener("click", () => {
        painel.tab = el.dataset.ptab;
        painel.draft = null;
        renderPainel();
      }),
    );

    bindCal(
      (k) => {
        painel.date = k;
        painel.month = monthOf(k);
        renderPainel();
      },
      (n) => {
        painel.month = shiftMonth(painel.month, n);
        renderPainel();
      },
    );

    const dayToggle = document.getElementById("day-toggle");
    if (dayToggle) {
      dayToggle.addEventListener("click", () => {
        const list = closedDates();
        const closing = !list.includes(painel.date);
        saveOvr({ closedDates: closing ? [...list, painel.date] : list.filter((x) => x !== painel.date) });
        toast(closing ? "Dia fechado para agendamento" : "Dia aberto para agendamento");
        renderPainel();
      });
    }

    app.querySelectorAll("[data-status]").forEach((el) =>
      el.addEventListener("click", () => {
        const status = el.dataset.status;
        const id = el.dataset.id;
        if (status === "cancelado" && !window.confirm("Cancelar este agendamento? O cliente recebe um aviso.")) return;
        const b = getBookings().find((x) => x.id === id);
        if (!b) return;
        setBookings(getBookings().map((x) => (x.id === id ? { ...x, status } : x)));
        if (status === "cancelado") {
          setAllNotifs([
            ...getAllNotifs(),
            {
              id: uid(),
              to: b.client_email,
              kind: "cancelado",
              title: "Seu horário foi cancelado",
              body: `${b.service_name} com ${b.barber_name} em ${fmtWhen(b.starts_at)} foi cancelado pela barbearia. Agende um novo horário quando quiser.`,
              created_at: new Date().toISOString(),
              read_at: null,
            },
          ]);
          toast("Agendamento cancelado. O cliente foi avisado em Notificações.");
        } else {
          toast(status === "concluido" ? "Marcado como concluído" : "Marcado como falta");
        }
        renderPainel();
      }),
    );

    // Horários: edição em rascunho até "Salvar"
    app.querySelectorAll("[data-wd]").forEach((el) =>
      el.addEventListener("click", () => {
        const i = Number(el.dataset.wd);
        const d = painel.draft;
        d.weekdays = d.weekdays.includes(i) ? d.weekdays.filter((x) => x !== i) : [...d.weekdays, i].sort((a, b) => a - b);
        renderPainel();
      }),
    );
    const openSel = document.getElementById("h-open");
    const closeSel = document.getElementById("h-close");
    if (openSel) openSel.addEventListener("change", () => (painel.draft.openMin = Number(openSel.value)) && renderPainel());
    if (closeSel) closeSel.addEventListener("change", () => (painel.draft.closeMin = Number(closeSel.value)) && renderPainel());

    const saveHours = document.getElementById("save-hours");
    if (saveHours) {
      saveHours.addEventListener("click", () => {
        const d = painel.draft;
        if (d.weekdays.length === 0) return toast("Escolha pelo menos um dia de atendimento");
        if (d.closeMin - d.openMin < 60) return toast("O fechamento precisa ser pelo menos 1 hora depois da abertura");
        saveOvr({ hours: { weekdays: d.weekdays, openMin: d.openMin, closeMin: d.closeMin } });
        painel.draft = null;
        toast("Horários salvos");
        renderPainel();
      });
    }

    // Serviços: lápis (nome ou tempo) abre a mesma edição; "+ Adicionar" abre um serviço novo
    app.querySelectorAll("[data-edit]").forEach((el) =>
      el.addEventListener("click", () => {
        painel.editing = el.dataset.edit;
        renderPainel();
      }),
    );
    const svcAdd = document.getElementById("svc-add");
    if (svcAdd) {
      svcAdd.addEventListener("click", () => {
        painel.editing = "new";
        renderPainel();
      });
    }
    const svcCancel = document.getElementById("sv-cancel");
    if (svcCancel) {
      svcCancel.addEventListener("click", () => {
        painel.editing = null;
        renderPainel();
      });
    }
    const svcSave = document.getElementById("sv-save");
    if (svcSave) {
      svcSave.addEventListener("click", () => {
        const name = document.getElementById("sv-name").value.trim();
        const description = document.getElementById("sv-desc").value.trim();
        const dur = Number(document.getElementById("sv-dur").value);
        const raw = document.getElementById("sv-price").value.trim();
        // Aceita "45,00" (reais com vírgula) ou "45.00"
        const price = raw.includes(",") ? Number(raw.replace(/\./g, "").replace(",", ".")) : Number(raw);
        if (!name) return toast("Informe o nome do serviço");
        if (!Number.isInteger(dur) || dur < 10 || dur > 240) return toast("O tempo precisa ser entre 10 e 240 minutos");
        if (!Number.isFinite(price) || price < 0) return toast("Informe um preço válido");

        const cents = Math.round(price * 100);
        const list = services();
        const next =
          painel.editing === "new"
            ? [...list, { id: slugId(name), name, description, durationMin: dur, priceCents: cents }]
            : list.map((s) => (s.id === painel.editing ? { ...s, name, description, durationMin: dur, priceCents: cents } : s));
        // prices: {} zera o mapa antigo, para o valor novo não ser sobreposto
        saveOvr({ services: next, prices: {} });
        painel.editing = null;
        toast("Serviço salvo. O cliente já vê a alteração.");
        renderPainel();
      });
    }
  }

  function renderAcessoNegado() {
    app.innerHTML = `
      ${pageHead("Acesso restrito", "Esta área é só do barbeiro", "hero")}
      <div class="empty" style="margin-top:1.5rem;padding:2rem 1.5rem">
        <p style="margin:0;color:var(--foreground);font-weight:700">Você não tem acesso ao painel.</p>
        <p style="margin:0.4rem 0 0">Entre com a conta do barbeiro para ver a agenda.</p>
        <a class="btn-soft" href="#/entrar">Trocar de conta</a>
      </div>`;
  }

  // ---------- entrar / criar conta (modo de teste) ----------
  const authMode = { value: "entrar" };
  function renderEntrar() {
    const creating = authMode.value === "cadastrar";
    app.innerHTML = `
      <section class="photo-head" style="height:11rem">
        ${photo("fade")}
        <div class="content" style="justify-content:flex-end">
          <div>
            <h1 style="font-size:2.4rem;white-space:nowrap">${esc(CFG.shopName)}</h1>
            <p style="text-transform:uppercase;letter-spacing:0.25em;font-size:0.7rem;font-weight:800;color:var(--photo-accent);opacity:1">Agende na régua</p>
          </div>
        </div>
      </section>

      <div class="tabs" role="tablist" style="margin-top:1.5rem">
        <button role="tab" aria-selected="${!creating}" class="${creating ? "" : "on"}" data-mode="entrar">Entrar</button>
        <button role="tab" aria-selected="${creating}" class="${creating ? "on" : ""}" data-mode="cadastrar">Criar conta</button>
      </div>

      <form class="auth-form" id="auth-form" novalidate style="margin-top:1.25rem">
        ${
          creating
            ? `<input class="field" id="a-name" placeholder="Seu nome" autocomplete="name" />
               <input class="field" id="a-nick" placeholder="Apelido (opcional)" autocomplete="nickname" />
               <input class="field" id="a-phone" placeholder="WhatsApp com DDD" type="tel" inputmode="numeric" autocomplete="tel" />`
            : ""
        }
        <input class="field" id="a-email" placeholder="E-mail" autocomplete="username" />
        <input class="field" id="a-pass" placeholder="Senha" type="password" autocomplete="${creating ? "new-password" : "current-password"}" />
        <button class="btn-gold" type="submit">${creating ? "Criar conta" : "Entrar"}</button>
      </form>

      <div class="divider" style="margin:1.25rem 0"><span></span>ou<span></span></div>

      <button class="btn-google" id="btn-google" type="button">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
        Continuar com Google
      </button>

      <p class="notice-soft">Modo de teste: use <b>Redcorte@teste</b> (cliente) ou <b>Redcorte@adm</b> (barbeiro), senha <b>1234</b>. Os dados ficam só neste navegador. Criar conta e entrar com Google ainda não estão ligados.</p>
    `;

    app.querySelectorAll("[data-mode]").forEach((el) =>
      el.addEventListener("click", () => {
        authMode.value = el.dataset.mode;
        renderEntrar();
      }),
    );
    const phone = document.getElementById("a-phone");
    if (phone) phone.addEventListener("input", () => (phone.value = formatPhone(phone.value)));
    document.getElementById("auth-form").addEventListener("submit", (e) => {
      e.preventDefault();
      if (authMode.value === "cadastrar") return toast("Criar conta ainda não está ligado. Use as contas de teste.");
      const email = document.getElementById("a-email").value;
      const pass = document.getElementById("a-pass").value;
      if (!login(email, pass)) return toast("E-mail ou senha incorretos");
      const after = sessionStorage.getItem("after-login");
      sessionStorage.removeItem("after-login");
      renderAccount();
      renderBadges();
      toast(`Bem-vindo, ${getSession().name}!`);
      location.hash = after && after !== "#/entrar" ? after : "#/";
    });
    document.getElementById("btn-google").addEventListener("click", () => toast("Entrar com Google ainda não está ligado"));
  }

  function renderNotFound() {
    app.innerHTML = `
      <div class="not-found">
        <h1>404</h1>
        <h2>Página não encontrada</h2>
        <p>Essa página não existe ou foi movida.</p>
        <a class="btn-gold" href="#/" style="max-width:16rem;margin-left:auto;margin-right:auto">Voltar ao início</a>
      </div>`;
  }

  // ---------- Configurações, Sobre e Fale conosco ----------
  function renderConfiguracoes() {
    const dark = currentTheme() === "dark";
    app.innerHTML = `
      ${pageHead("Configurações", "Deixe o app do seu jeito", "hero")}

      <h3 class="section-title">Aparência</h3>
      <label class="setting" for="tema-escuro">
        <span class="ico">${icon(dark ? "moon" : "sun")}</span>
        <span class="txt">
          <strong>Tema ${dark ? "preto" : "branco"}</strong>
          <span>${dark ? "Desligue para usar o tema branco" : "Ligue para voltar ao tema preto"}</span>
        </span>
        <span class="switch">
          <input type="checkbox" id="tema-escuro" aria-label="Tema preto" ${dark ? "checked" : ""} />
          <span class="track"></span>
        </span>
      </label>

      <div class="theme-options">
        <button class="theme-option ${dark ? "on" : ""}" data-theme="dark" aria-pressed="${dark}">
          <span class="swatch dark"></span><b>Preto</b>
        </button>
        <button class="theme-option ${!dark ? "on" : ""}" data-theme="light" aria-pressed="${!dark}">
          <span class="swatch light"></span><b>Branco</b>
        </button>
      </div>
      <p class="small-note">Sua escolha fica salva neste aparelho.</p>
    `;

    const toggle = document.getElementById("tema-escuro");
    const apply = (theme) => {
      setTheme(theme);
      renderConfiguracoes();
    };
    toggle.addEventListener("change", () => apply(toggle.checked ? "dark" : "light"));
    app.querySelectorAll("[data-theme]").forEach((el) => el.addEventListener("click", () => apply(el.dataset.theme)));
  }

  function renderSobre() {
    const about = CFG.about;
    app.innerHTML = `
      ${pageHead("Sobre", "A nossa história", "hero")}

      <h3 class="section-title">Quem somos</h3>
      <span class="rule"></span>
      <div class="story">
        ${about.story.map((p) => `<p style="margin:0">${esc(p)}</p>`).join("")}
      </div>

      <ul class="list" style="margin-top:1.5rem">
        ${about.highlights
          .map((h) => {
            const text = h.icon === "clock" ? hoursLabel() : h.text;
            return `
          <li class="highlight">
            <span class="ico">${icon(h.icon)}</span>
            <span><strong>${esc(h.title)}</strong><span>${esc(text)}</span></span>
          </li>`;
          })
          .join("")}
      </ul>

      <a class="btn-gold" href="#/agendar">Agendar meu horário</a>
    `;
  }

  function renderFaleConosco() {
    const c = CFG.contact;
    const waLink = c.whatsapp
      ? `https://wa.me/${c.whatsapp}?text=${encodeURIComponent("Olá! Vim pelo app da RED DO CORTE.")}`
      : null;
    const row = (ic, label, value, href) => {
      const body = `
        <span class="ico">${icon(ic)}</span>
        <span style="min-width:0">
          <small>${esc(label)}</small>
          <strong class="${value ? "" : "todo"}">${esc(value ?? "A definir")}</strong>
        </span>`;
      return href
        ? `<li><a class="contact-row" href="${esc(href)}" target="_blank" rel="noopener noreferrer">${body}</a></li>`
        : `<li><div class="contact-row">${body}</div></li>`;
    };
    app.innerHTML = `
      ${pageHead("Fale conosco", "Tire dúvidas direto com o barbeiro", "barba")}

      <ul class="list" style="margin-top:1.5rem">
        ${row("message", "WhatsApp", waLink ? c.whatsappLabel : null, waLink)}
        ${row("instagram", "Instagram", c.instagram ? `@${c.instagram}` : null, c.instagram ? `https://instagram.com/${c.instagram}` : null)}
        ${row("pin", "Endereço", c.address, c.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}` : null)}
        ${row("clock", "Horário", hoursLabel(), null)}
      </ul>

      ${waLink ? `<a class="btn-gold" href="${esc(waLink)}" target="_blank" rel="noopener noreferrer">${icon("message").replace("<svg", '<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"')} Chamar no WhatsApp</a>` : ""}
    `;
  }

  // ---------- menu do topo ----------
  const menuBtn = document.getElementById("menu-btn");
  const menuPanel = document.getElementById("menu-panel");
  function setMenu(open) {
    menuPanel.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
  }
  menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    setMenu(menuPanel.hidden);
  });
  document.addEventListener("click", (e) => {
    if (!menuPanel.hidden && !menuPanel.contains(e.target)) setMenu(false);
  });
  menuPanel.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    if (a.id === "menu-logout") {
      e.preventDefault();
      setMenu(false);
      logout();
      return;
    }
    setMenu(false);
  });

  // ---------- roteamento por hash ----------
  const routes = {
    "": renderHome,
    agendar: renderAgendar,
    "meus-agendamentos": renderMeus,
    servicos: renderServicos,
    notificacoes: renderNotificacoes,
    configuracoes: renderConfiguracoes,
    sobre: renderSobre,
    "fale-conosco": renderFaleConosco,
    entrar: renderEntrar,
    painel: renderPainel,
  };
  const NEEDS_LOGIN = ["agendar", "meus-agendamentos", "notificacoes", "painel"];

  function route() {
    const path = location.hash.replace(/^#\/?/, "");
    const known = Object.prototype.hasOwnProperty.call(routes, path);
    const key = known ? path : "";
    const session = getSession();

    if (known && NEEDS_LOGIN.includes(key) && !session) {
      sessionStorage.setItem("after-login", `#/${key}`);
      toast("Entre na sua conta para continuar");
      location.hash = "#/entrar";
      return;
    }

    document.querySelectorAll(".bottom-nav a").forEach((a) => {
      const on = a.dataset.route === key;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    setMenu(false);

    if (!known) renderNotFound();
    else if (key === "painel" && !isAdmin()) renderAcessoNegado();
    else routes[key]();

    renderAccount();
    renderBadges();
    window.scrollTo(0, 0);
  }

  try {
    const saved = localStorage.getItem(KEYS.theme);
    if (saved) setTheme(saved);
  } catch {
    /* ignora */
  }

  window.addEventListener("hashchange", route);
  route();
})();
