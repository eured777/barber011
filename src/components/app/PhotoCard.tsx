import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

type PhotoCardProps = {
  to: "/agendar" | "/meus-agendamentos" | "/servicos" | "/admin";
  image: string;
  title: string;
  description: string;
  delay?: number;
};

// Botão-foto horizontal: foto do corte, gradiente preto e texto por cima.
export function PhotoCard({ to, image, title, description, delay = 0 }: PhotoCardProps) {
  return (
    <Link
      to={to}
      style={{ animationDelay: `${delay}ms` }}
      className="group relative block h-32 animate-rise overflow-hidden rounded-3xl border border-glass-border shadow-card outline-none transition-transform active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring"
    >
      <img
        src={image}
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover object-right transition-transform duration-700 group-hover:scale-105"
      />
      <span aria-hidden className="absolute inset-0 bg-photo-fade" />
      <span aria-hidden className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-gradient-gold" />
      <span className="relative flex h-full items-center justify-between gap-3 px-6">
        <span className="max-w-[70%]">
          <span className="block font-display text-[1.9rem] leading-none tracking-wide text-photo">{title}</span>
          <span className="mt-1.5 block text-sm text-photo opacity-80">{description}</span>
        </span>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-photo-accent/60 bg-photo-chip text-photo-accent backdrop-blur transition-transform group-hover:translate-x-1">
          <ChevronRight className="size-5" />
        </span>
      </span>
    </Link>
  );
}
