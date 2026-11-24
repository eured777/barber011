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

  // CONTAS DE TESTE (modo de teste, sem servidor). A senha fica visível no código:
  // não use estas contas para dados reais. Quando o Supabase for ligado, isso sai.
  // role "cliente" usa o agendamento; role "admin" também abre o Painel do barbeiro.
  testAccounts: [
    { email: "Redcorte@teste", password: "1234", role: "cliente", name: "Cliente Teste" },
    { email: "Redcorte@adm", password: "1234", role: "admin", name: "Administrador" },
  ],

  // Página "Sobre". Texto provisório: troque pela história real da barbearia.
  about: {
    story: [
      "A RED DO CORTE nasceu da vontade de juntar o corte clássico de barbearia com o estilo de hoje. Começou com uma cadeira, uma navalha e muitos clientes amigos que viraram família.",
      "Aqui cada atendimento é com hora marcada, sem fila e sem pressa: conversa boa, toalha quente e acabamento na navalha.",
      "Do degradê ao corte social, da barba desenhada à sobrancelha, o nosso compromisso é você sair daqui do jeito que imaginou — ou melhor.",
    ],
    highlights: [
      { icon: "scissors", title: "Feito à mão", text: "Tesoura, máquina e navalha com acabamento caprichado" },
      { icon: "clock", title: "Hora marcada", text: "Terça a sábado · 9h às 19h" },
      { icon: "award", title: "Atendimento de casa", text: "Ambiente tranquilo, do seu jeito" },
    ],
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
