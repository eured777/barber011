/*
 * RED DO CORTE — lógica do site (HTML/CSS/JS puros).
 * Os dados da barbearia ficam em config.js (window.RDC_CONFIG).
 * Sem backend por enquanto: perfil e agendamentos ficam no localStorage deste navegador.
 */
(function () {
  "use strict";

  const CFG = window.RDC_CONFIG;
  const H = CFG.hours;
  const KEY_PROFILE = "rdc-profile";
  const KEY_BOOKINGS = "rdc-bookings";

  // ---------- utilidades ----------
  const app = document.getElementById("app");
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
  const isOpenDay = (s) => H.weekdays.includes(fromKey(s).getDay());
  const brl = (cents) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const durLabel = (m) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)}h${pad(m % 60)}` : `${m / 60}h`);
  const minToTime = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const fmtLong = (d) => new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(d);
  const fmtTime = (iso) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
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
  // Foto de fundo opcional (config.images). Sem foto, o gradiente do tema aparece.
  const photo = (key) => {
    const src = CFG.images?.[key];
    return src ? `<span class="photo-bg" style="background-image:url('${esc(src)}')"></span>` : `<span class="photo-bg"></span>`;
  };

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
  const getProfile = () => load(KEY_PROFILE, null);
  const getBookings = () => load(KEY_BOOKINGS, []);
  const setBookings = (list) => save(KEY_BOOKINGS, list);

  let toastTimer;
  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  // ---------- regras de horário (mesmas regras do schedule.ts do projeto Lovable) ----------
  function buildSlots({ date, durationMin, barberId }) {
    if (!isOpenDay(date)) return [];
    const [y, m, d] = date.split("-").map(Number);
    const now = Date.now();
    const bookings = getBookings().filter((b) => b.status === "confirmado");
    const slots = [];
    for (let min = H.openMin; min + durationMin <= H.closeMin; min += H.slotStepMin) {
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

  function openDays() {
    const today = toKey(new Date());
    const days = [];
    for (let i = 0; i <= H.daysAhead; i++) {
      const k = addDaysKey(today, i);
      if (isOpenDay(k)) days.push(k);
    }
    return days;
  }

  // ---------- topo ----------
  function renderAccount() {
    const profile = getProfile();
    const acc = document.getElementById("account");
    if (profile?.name) {
      acc.className = "avatar";
      acc.innerHTML = `<span>${esc(initials(profile.name))}</span>`;
      acc.setAttribute("aria-label", `Minha conta: ${profile.name}`);
      acc.href = "#/meus-agendamentos";
    } else {
      acc.className = "pill";
      acc.textContent = "Entrar";
      acc.setAttribute("aria-label", "Entrar");
      acc.href = "#/agendar";
    }
    const wa = document.getElementById("menu-contact");
    wa.href = CFG.contact.whatsapp ? `https://wa.me/${CFG.contact.whatsapp}` : "#";
  }

  // ---------- páginas ----------
  function renderHome() {
    const profile = getProfile();
    const first = profile?.name?.split(" ")[0];
    app.innerHTML = `
      <section class="hero">
        ${photo("hero")}
        <div class="hero-text">
          <p class="hero-kicker">Barbearia</p>
          <h1 class="hero-title">${esc(CFG.shopName)}</h1>
          <div class="hero-meta">
            <span>🕘 ${esc(H.label)}</span>
            <span>📍 Atendimento com hora marcada</span>
          </div>
        </div>
      </section>

      <div class="home-heading">
        <h2>${first ? `Fala, ${esc(first)}!` : "O que você quer fazer?"}</h2>
        <p class="subtitle">${first ? "Escolha uma opção para continuar" : "Escolha uma opção — vamos pedir seu WhatsApp para agendar"}</p>
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
        ${CFG.services
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
    date: openDays()[0],
    time: null,
  };

  function renderAgendar() {
    const profile = getProfile();
    const days = openDays();
    if (!days.includes(booking.date)) booking.date = days[0];

    const service = CFG.services.find((s) => s.id === booking.serviceId);
    const slots = buildSlots({ date: booking.date, durationMin: service.durationMin, barberId: booking.barberId });
    const free = slots.filter((s) => s.available);
    if (booking.time && !free.some((s) => s.time === booking.time)) booking.time = null;

    app.innerHTML = `
      ${pageHead("Agendar", "Monte seu horário em poucos toques", "fade")}

      <h3 class="section-title">Serviço</h3>
      <div class="chips">
        ${CFG.services
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
      <div class="scroller">
        ${days
          .map((k) => {
            const d = fromKey(k);
            const wd = new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(d).replace(".", "");
            const mo = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(d).replace(".", "");
            return `
            <button class="chip day-chip ${k === booking.date ? "on" : ""}" data-day="${k}">
              <div class="wd">${esc(wd)}</div>
              <div class="dn">${pad(d.getDate())}</div>
              <div class="mo">${esc(mo)}</div>
            </button>`;
          })
          .join("")}
      </div>

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
    app.querySelectorAll("[data-day]").forEach((el) =>
      el.addEventListener("click", () => {
        booking.date = el.dataset.day;
        booking.time = null;
        renderAgendar();
      }),
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
    const name = document.getElementById("f-name").value.trim();
    const nickname = document.getElementById("f-nick").value.trim();
    const phone = document.getElementById("f-phone").value;

    if (!name) return toast("Informe seu nome");
    if (!isValidWhatsApp(phone)) return toast("Informe seu WhatsApp com DDD");

    const slot = slots.find((s) => s.time === booking.time);
    if (!slot) return toast("Esse horário não está mais disponível");
    if (getBookings().some((b) => b.status === "confirmado" && b.barber_id === booking.barberId && b.starts_at === slot.startsAt)) {
      return toast("Esse horário acabou de ser reservado. Escolha outro.");
    }

    save(KEY_PROFILE, { name, nickname, phone: digits(phone) });
    const barber = CFG.barbers.find((b) => b.id === booking.barberId);
    setBookings([
      ...getBookings(),
      {
        id: (crypto && crypto.randomUUID && crypto.randomUUID()) || String(Date.now()),
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
    const now = Date.now();
    const all = getBookings().sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
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
    if (e.target.tagName === "A" && e.target.getAttribute("href") !== "#") setMenu(false);
  });

  // ---------- roteamento por hash (funciona no GitHub Pages sem configuração extra) ----------
  const routes = {
    "": renderHome,
    agendar: renderAgendar,
    "meus-agendamentos": renderMeus,
    servicos: renderServicos,
  };

  function route() {
    const path = location.hash.replace(/^#\/?/, "");
    const key = routes[path] ? path : "";
    document.querySelectorAll(".bottom-nav a").forEach((a) => {
      const on = a.dataset.route === key;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
    setMenu(false);
    routes[key]();
    renderAccount();
    window.scrollTo(0, 0);
  }

  window.addEventListener("hashchange", route);
  route();
})();
