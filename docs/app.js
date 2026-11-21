/*
 * RED DO CORTE — versão estática (HTML/CSS/JS).
 * Sem backend ainda: perfil e agendamentos ficam no localStorage deste navegador.
 * As regras de horário seguem src/lib/schedule.ts do projeto Lovable.
 */

// ---------- dados da barbearia (espelham o banco do projeto) ----------
const OPEN_WEEKDAYS = [2, 3, 4, 5, 6]; // terça a sábado
const OPEN_MIN = 9 * 60;
const CLOSE_MIN = 19 * 60;
const SLOT_STEP = 30;
const DAYS_AHEAD = 60;

const SERVICES = [
  { id: "corte", name: "Corte", description: "Degradê, social ou tesoura, com acabamento na navalha.", duration_min: 30, price_cents: 4500 },
  { id: "barba", name: "Barba", description: "Toalha quente, navalha e hidratação.", duration_min: 30, price_cents: 3500 },
  { id: "combo", name: "Corte + Barba", description: "O pacote completo para sair na régua.", duration_min: 60, price_cents: 7000 },
  { id: "sobrancelha", name: "Sobrancelha", description: "Alinhamento na navalha.", duration_min: 30, price_cents: 1500 },
];
const BARBERS = [
  { id: "rafael", name: "Rafael" },
  { id: "diego", name: "Diego" },
];
const SHOP_WHATSAPP = "5591999266351";

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
const isOpenDay = (s) => OPEN_WEEKDAYS.includes(fromKey(s).getDay());
const brl = (cents) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const durLabel = (m) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)}h${pad(m % 60)}` : `${m / 60}h`);
const minToTime = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const fmtLong = (d) => new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long" }).format(d);
const fmtTime = (iso) => new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const digits = (s) => String(s).replace(/\D/g, "");
const isValidWhatsApp = (s) => [10, 11].includes(digits(s).length);
function formatPhone(s) {
  const d = digits(s).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

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

// ---------- regras de horário ----------
function buildSlots({ date, durationMin, barberId }) {
  if (!isOpenDay(date)) return [];
  const [y, m, d] = date.split("-").map(Number);
  const now = Date.now();
  const bookings = getBookings().filter((b) => b.status === "confirmado");
  const slots = [];
  for (let min = OPEN_MIN; min + durationMin <= CLOSE_MIN; min += SLOT_STEP) {
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
  for (let i = 0; i <= DAYS_AHEAD; i++) {
    const k = addDaysKey(today, i);
    if (isOpenDay(k)) days.push(k);
  }
  return days;
}

// ---------- páginas ----------
function renderHome() {
  const profile = getProfile();
  const first = profile?.name?.split(" ")[0];
  document.getElementById("login-link").textContent = profile ? first : "Entrar";
  app.innerHTML = `
    <section class="hero">
      <div class="hero-text">
        <p class="hero-kicker">Barbearia</p>
        <h1 class="hero-title">RED DO CORTE</h1>
        <div class="hero-meta">
          <span>🕘 Ter a Sáb · 9h às 19h</span>
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
      <a class="menu-card" href="#/agendar" style="animation-delay:60ms">
        <div><strong>Agendar horário</strong><span class="desc">Escolha serviço, barbeiro e hora</span></div>
        <span class="arrow-circle">›</span>
      </a>
      <a class="menu-card mirrored" href="#/meus-agendamentos" style="animation-delay:120ms">
        <div><strong>Meus agendamentos</strong><span class="desc">Veja e cancele seus horários</span></div>
        <span class="arrow-circle">›</span>
      </a>
      <a class="menu-card" href="#/servicos" style="animation-delay:180ms">
        <div><strong>Serviços e preços</strong><span class="desc">Corte, barba, combo e mais</span></div>
        <span class="arrow-circle">›</span>
      </a>
    </div>
  `;
}

function renderServicos() {
  app.innerHTML = `
    <section class="page-head">
      <a class="back" href="#/">‹ Voltar</a>
      <h1 class="page-title">Serviços</h1>
      <p class="subtitle">Preços e duração de cada atendimento</p>
    </section>
    <ul class="list" style="margin-top:1.25rem">
      ${SERVICES.map(
        (s) => `
        <li class="card service-row">
          <div>
            <h3>${esc(s.name)}</h3>
            <p>${esc(s.description)}</p>
            <p>⏱ ${durLabel(s.duration_min)}</p>
          </div>
          <span class="price">${brl(s.price_cents)}</span>
        </li>`,
      ).join("")}
    </ul>
    <a class="btn-gold" href="#/agendar">Agendar agora</a>
  `;
}

// Estado da tela de agendamento (fica na memória enquanto a página está aberta)
const booking = {
  serviceId: SERVICES[0].id,
  barberId: BARBERS[0].id,
  date: openDays()[0],
  time: null,
};

function renderAgendar() {
  const profile = getProfile();
  const days = openDays();
  if (!days.includes(booking.date)) booking.date = days[0];

  const service = SERVICES.find((s) => s.id === booking.serviceId);
  const slots = buildSlots({ date: booking.date, durationMin: service.duration_min, barberId: booking.barberId });
  const free = slots.filter((s) => s.available);
  if (booking.time && !free.some((s) => s.time === booking.time)) booking.time = null;

  app.innerHTML = `
    <section class="page-head">
      <a class="back" href="#/">‹ Voltar</a>
      <h1 class="page-title">Agendar</h1>
      <p class="subtitle">Monte seu horário em poucos toques</p>
    </section>

    <h3 class="section-title">Serviço</h3>
    <div class="chips">
      ${SERVICES.map(
        (s) => `
        <button class="chip ${s.id === booking.serviceId ? "on" : ""}" data-service="${s.id}">
          ${esc(s.name)}
          <small>${brl(s.price_cents)} · ${durLabel(s.duration_min)}</small>
        </button>`,
      ).join("")}
    </div>

    <h3 class="section-title">Barbeiro</h3>
    <div class="chip-row">
      ${BARBERS.map((b) => `<button class="chip ${b.id === booking.barberId ? "on" : ""}" data-barber="${b.id}">${esc(b.name)}</button>`).join("")}
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
            <div class="dn">${String(d.getDate()).padStart(2, "0")}</div>
            <div class="mo">${esc(mo)}</div>
          </button>`;
        })
        .join("")}
    </div>

    <h3 class="section-title">Horário · <span style="text-transform:none;letter-spacing:0;color:var(--foreground)">${esc(fmtLong(fromKey(booking.date)))}</span></h3>
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
      ${booking.time ? `Confirmar · ${booking.time} · ${brl(service.price_cents)}` : "Escolha um horário"}
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
  const barber = BARBERS.find((b) => b.id === booking.barberId);
  setBookings([
    ...getBookings(),
    {
      id: crypto?.randomUUID?.() ?? String(Date.now()),
      client_name: name,
      client_nickname: nickname || null,
      client_phone: digits(phone),
      service_id: service.id,
      service_name: service.name,
      price_cents: service.price_cents,
      duration_min: service.duration_min,
      barber_id: barber.id,
      barber_name: barber.name,
      starts_at: slot.startsAt,
      ends_at: slot.endsAt,
      status: "confirmado",
    },
  ]);
  booking.time = null;
  toast("Horário agendado!");
  location.hash = "#/meus-agendamentos";
}

function renderMeus() {
  const now = Date.now();
  const all = getBookings().sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  const upcoming = all.filter((b) => b.status === "confirmado" && new Date(b.starts_at).getTime() > now);
  const history = all.filter((b) => !upcoming.includes(b)).reverse();

  app.innerHTML = `
    <section class="page-head">
      <a class="back" href="#/">‹ Voltar</a>
      <h1 class="page-title">Meus agendamentos</h1>
      <p class="subtitle">Seus próximos horários e histórico</p>
    </section>

    <h3 class="section-title">Próximos</h3>
    ${
      upcoming.length === 0
        ? `<div class="empty">Nenhum horário marcado. <br /><a class="back" style="margin-top:.75rem" href="#/agendar">Agendar horário</a></div>`
        : upcoming
            .map(
              (b) => `
        <article class="card booking">
          <div class="when">${esc(fmtLong(new Date(b.starts_at)))}</div>
          <p class="time">${fmtTime(b.starts_at)}</p>
          <p class="info">${esc(b.service_name)} com ${esc(b.barber_name)} · <span style="color:var(--primary)">${brl(b.price_cents)}</span></p>
          <button class="btn-soft" data-cancel="${esc(b.id)}">Cancelar horário</button>
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
      if (!confirm("Cancelar este horário?")) return;
      setBookings(getBookings().map((b) => (b.id === el.dataset.cancel ? { ...b, status: "cancelado" } : b)));
      toast("Agendamento cancelado");
      renderMeus();
    }),
  );
}

// ---------- roteamento por hash (funciona no GitHub Pages sem configuração extra) ----------
const routes = {
  "": renderHome,
  agendar: renderAgendar,
  "meus-agendamentos": renderMeus,
  servicos: renderServicos,
};

function route() {
  const path = location.hash.replace(/^#\/?/, "");
  const render = routes[path] ?? renderHome;
  document.querySelectorAll(".bottom-nav a").forEach((a) => {
    a.classList.toggle("active", a.dataset.route === (routes[path] ? path : ""));
  });
  render();
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", route);
route();
