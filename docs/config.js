/*
 * RED DO CORTE — configuração do site.
 * Aqui ficam os dados da barbearia: serviços, barbeiros, horários e contato.
 * Para mudar um preço, um nome ou um horário, edite só este arquivo.
 */
window.RDC_CONFIG = {
  shopName: "RED DO CORTE",

  // Horário de atendimento (padrão da barbearia). Minutos desde 00:00.
  // weekdays: 0 = domingo, 1 = segunda ... 6 = sábado
  hours: {
    weekdays: [2, 3, 4, 5, 6], // terça a sábado
    openMin: 9 * 60, // 09:00
    closeMin: 19 * 60, // 19:00
    slotStepMin: 30, // um horário a cada 30 minutos
    daysAhead: 60, // dias que o cliente pode agendar a partir de hoje
    label: "Ter a Sáb · 9h às 19h",
  },

  services: [
    {
      id: "corte",
      name: "Corte",
      description: "Degradê, social ou tesoura, com acabamento na navalha.",
      durationMin: 30,
      priceCents: 4500,
    },
    {
      id: "barba",
      name: "Barba",
      description: "Toalha quente, navalha e hidratação.",
      durationMin: 30,
      priceCents: 3500,
    },
    {
      id: "combo",
      name: "Corte + Barba",
      description: "O pacote completo para sair na régua.",
      durationMin: 60,
      priceCents: 7000,
    },
    {
      id: "sobrancelha",
      name: "Sobrancelha",
      description: "Alinhamento na navalha.",
      durationMin: 30,
      priceCents: 1500,
    },
  ],

  barbers: [
    { id: "rafael", name: "Rafael" },
    { id: "diego", name: "Diego" },
  ],

  // Contato. Deixe null o que ainda não foi informado.
  contact: {
    whatsapp: "5591999266351", // só dígitos, com DDI 55
    whatsappLabel: "(91) 99926-6351",
    instagram: null,
    address: null,
  },

  // Fotos (opcional). Coloque os arquivos em docs/img/ e informe o caminho.
  // Sem foto, o site usa o gradiente dourado do tema.
  images: {
    hero: null, // ex.: "img/barbearia-hero.jpg"
    fade: null, // ex.: "img/corte-fade.jpg"
    barba: null, // ex.: "img/corte-barba.jpg"
    classico: null, // ex.: "img/corte-classico.jpg"
  },
};
