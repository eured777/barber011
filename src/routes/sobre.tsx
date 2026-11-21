import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Clock, Scissors } from "lucide-react";

import heroImg from "@/assets/barbearia-hero.jpg";
import { APP_NAME, SHOP_CONTACT } from "@/components/app/brand";
import { PageHeader } from "@/components/app/PageHeader";
import { goldButtonClass, sectionTitleClass } from "@/components/app/ui-classes";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — RED DO CORTE" },
      { name: "description", content: "Conheça a história da barbearia RED DO CORTE e o nosso jeito de cuidar do seu visual." },
      { property: "og:title", content: "Sobre — RED DO CORTE" },
      { property: "og:description", content: "Conheça a história da barbearia RED DO CORTE e o nosso jeito de cuidar do seu visual." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Sobre,
});

// Texto provisório: será trocado pela história real da barbearia.
const STORY = [
  `A ${APP_NAME} nasceu da vontade de juntar o corte clássico de barbearia com o estilo de hoje. Começou com uma cadeira, uma navalha e muitos clientes amigos que viraram família.`,
  "Aqui cada atendimento é com hora marcada, sem fila e sem pressa: conversa boa, toalha quente e acabamento na navalha.",
  "Do degradê ao corte social, da barba desenhada à sobrancelha, o nosso compromisso é você sair daqui do jeito que imaginou — ou melhor.",
];

const HIGHLIGHTS = [
  { icon: Scissors, title: "Feito à mão", text: "Tesoura, máquina e navalha com acabamento caprichado" },
  { icon: Clock, title: "Hora marcada", text: SHOP_CONTACT.hours },
  { icon: Award, title: "Atendimento de casa", text: "Ambiente tranquilo, do seu jeito" },
];

function Sobre() {
  return (
    <div className="px-5 pt-5">
      <PageHeader title="Sobre" subtitle="A nossa história" image={heroImg} />

      <h3 className={`${sectionTitleClass} mt-7`}>Quem somos</h3>
      <span aria-hidden className="mt-2 block h-px w-12 bg-gradient-gold" />
      <div className="mt-4 space-y-3 text-[0.95rem] leading-relaxed text-foreground/85">
        {STORY.map((p) => (
          <p key={p.slice(0, 20)}>{p}</p>
        ))}
      </div>

      <ul className="mt-6 space-y-3">
        {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-center gap-4 rounded-3xl border border-border bg-card p-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-primary/40 text-primary">
              <Icon className="size-5" />
            </span>
            <span>
              <span className="block font-semibold text-foreground">{title}</span>
              <span className="block text-sm text-muted-foreground">{text}</span>
            </span>
          </li>
        ))}
      </ul>

      <Link to="/agendar" className={`${goldButtonClass} mt-6`}>Agendar meu horário</Link>
    </div>
  );
}
