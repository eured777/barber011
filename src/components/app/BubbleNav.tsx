import { Link } from "@tanstack/react-router";
import { CalendarCheck, CalendarPlus, Home, Scissors, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

type NavItem = {
  to: "/" | "/agendar" | "/meus-agendamentos" | "/servicos" | "/admin";
  label: string;
  icon: LucideIcon;
};

const baseItems: NavItem[] = [
  { to: "/", label: "Início", icon: Home },
  { to: "/agendar", label: "Agendar", icon: CalendarPlus },
  { to: "/meus-agendamentos", label: "Meus agendamentos", icon: CalendarCheck },
  { to: "/servicos", label: "Serviços", icon: Scissors },
];

// Barra fixa de largura total: fundo opaco, então o conteúdo nunca aparece por cima nem por baixo.
export function BubbleNav() {
  const { isAdmin } = useAuth();
  const items = isAdmin
    ? [...baseItems, { to: "/admin", label: "Painel do barbeiro", icon: ShieldCheck } as NavItem]
    : baseItems;

  return (
    <nav
      aria-label="Menu principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-glass-border bg-background shadow-bar pb-safe"
    >
      <ul className="mx-auto flex w-full max-w-md items-center justify-center gap-1 px-4 py-2">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              aria-label={label}
              title={label}
              activeOptions={{ exact: to === "/" }}
              className="group relative mx-auto flex size-12 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span aria-hidden className="absolute inset-0 animate-bubble-pop rounded-full bg-gradient-gold shadow-gold" />
                  )}
                  <Icon
                    strokeWidth={isActive ? 2.3 : 1.8}
                    className={cn(
                      "relative size-6 transition-all duration-200 group-active:scale-90",
                      isActive ? "text-primary-foreground" : "text-foreground/70 group-hover:text-primary",
                    )}
                  />
                </>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
