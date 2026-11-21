import { createFileRoute } from "@tanstack/react-router";
import { Clock, MapPin } from "lucide-react";

import heroImg from "@/assets/barbearia-hero.jpg";
import fadeImg from "@/assets/corte-fade.jpg";
import barbaImg from "@/assets/corte-barba.jpg";
import classicoImg from "@/assets/corte-classico.jpg";
import { APP_NAME } from "@/components/app/brand";
import { PhotoCard } from "@/components/app/PhotoCard";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RED DO CORTE — Agende seu horário" },
      { name: "description", content: "Agende corte, barba e combo na RED DO CORTE e acompanhe seus horários." },
      { property: "og:title", content: "RED DO CORTE — Agende seu horário" },
      { property: "og:description", content: "Agende corte, barba e combo na RED DO CORTE e acompanhe seus horários." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, displayName, isAdmin } = useAuth();
  const firstName = displayName.split(" ")[0];

  return (
    <div className="px-5 pt-5">
      <section className="relative h-56 animate-rise overflow-hidden rounded-[2rem] border border-glass-border shadow-card">
        <img src={heroImg} alt="Interior da barbearia RED DO CORTE" className="absolute inset-0 size-full object-cover" />
        <span aria-hidden className="absolute inset-0 bg-photo-fade-up" />
        <div className="absolute inset-x-5 bottom-5">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-photo-accent">Barbearia</p>
          <h1 className="mt-1 font-display text-5xl leading-none tracking-wide text-photo">{APP_NAME}</h1>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-photo opacity-85">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5 text-photo-accent" /> Ter a Sáb · 9h às 19h
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 text-photo-accent" /> Atendimento com hora marcada
            </span>
          </div>
        </div>
      </section>

      <div className="mt-7 text-center">
        <h2 className="font-display text-4xl tracking-wide text-foreground">
          {user && firstName ? `Fala, ${firstName}!` : "O que você quer fazer?"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {user ? "Escolha uma opção para continuar" : "Escolha uma opção — vamos pedir seu login para agendar"}
        </p>
        <span aria-hidden className="mx-auto mt-4 block h-px w-16 bg-gradient-gold" />
      </div>

      <div className="mt-6 space-y-3">
        <PhotoCard to="/agendar" image={fadeImg} title="Agendar horário" description="Escolha serviço, barbeiro e hora" delay={60} />
        <PhotoCard to="/meus-agendamentos" image={barbaImg} title="Meus agendamentos" description="Veja e cancele seus horários" delay={120} />
        <PhotoCard to="/servicos" image={classicoImg} title="Serviços e preços" description="Corte, barba, combo e mais" delay={180} />
        {isAdmin && (
          <PhotoCard to="/admin" image={heroImg} title="Painel do barbeiro" description="Gerencie a agenda do dia" delay={240} />
        )}
      </div>
    </div>
  );
}
