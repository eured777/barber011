import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, CalendarPlus, Home, Info, LogOut, Menu, MessageCircle, Scissors, Settings, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { initialsOf, useAuth } from "@/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { APP_NAME } from "./brand";

const itemClass = "rounded-xl py-2.5 focus:bg-accent";

export function TopBar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAdmin, displayName, loading } = useAuth();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="glass sticky top-0 z-40 border-b border-glass-border">
      <div className="relative mx-auto flex h-14 max-w-md items-center justify-between px-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Menu"
            className="flex size-10 items-center justify-center rounded-full text-foreground transition-all hover:bg-secondary active:scale-90 data-[state=open]:bg-secondary"
          >
            <Menu className="size-6" strokeWidth={1.8} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={8} className="w-60 rounded-2xl border-border p-1.5 shadow-bubble">
            <DropdownMenuLabel className="text-xs font-medium uppercase tracking-wider text-primary">{APP_NAME}</DropdownMenuLabel>
            <DropdownMenuItem className={itemClass} onSelect={() => navigate({ to: "/" })}>
              <Home /> Início
            </DropdownMenuItem>
            <DropdownMenuItem className={itemClass} onSelect={() => navigate({ to: "/agendar" })}>
              <CalendarPlus /> Agendar horário
            </DropdownMenuItem>
            <DropdownMenuItem className={itemClass} onSelect={() => navigate({ to: "/meus-agendamentos" })}>
              <CalendarCheck /> Meus agendamentos
            </DropdownMenuItem>
            <DropdownMenuItem className={itemClass} onSelect={() => navigate({ to: "/servicos" })}>
              <Scissors /> Serviços e preços
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className={itemClass} onSelect={() => navigate({ to: "/sobre" })}>
              <Info /> Sobre
            </DropdownMenuItem>
            <DropdownMenuItem className={itemClass} onSelect={() => navigate({ to: "/fale-conosco" })}>
              <MessageCircle /> Fale conosco
            </DropdownMenuItem>
            <DropdownMenuItem className={itemClass} onSelect={() => navigate({ to: "/configuracoes" })}>
              <Settings /> Configurações
            </DropdownMenuItem>
            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className={itemClass} onSelect={() => navigate({ to: "/admin" })}>
                  <ShieldCheck /> Painel do barbeiro
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <Link
          to="/"
          className="absolute left-1/2 -translate-x-1/2 font-display text-2xl leading-none tracking-[0.12em] text-gradient-gold"
        >
          {APP_NAME}
        </Link>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger aria-label="Minha conta" className="flex size-10 items-center justify-center rounded-full active:scale-90">
              <span className="rounded-full bg-gradient-gold p-[2px]">
                <span className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-card text-xs font-bold text-primary">
                  {initialsOf(displayName)}
                </span>
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-60 rounded-2xl border-border p-1.5 shadow-bubble">
              <DropdownMenuLabel className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-muted-foreground">{isAdmin ? "Barbeiro (admin)" : "Minha conta"}</span>
                <span className="truncate text-sm font-semibold text-foreground">{displayName}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className={itemClass} onSelect={() => navigate({ to: "/meus-agendamentos" })}>
                <CalendarCheck /> Meus agendamentos
              </DropdownMenuItem>
              <DropdownMenuItem className={`${itemClass} text-destructive focus:text-destructive`} onSelect={signOut}>
                <LogOut /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            to="/auth"
            className={`rounded-full border border-primary/60 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary transition-all hover:bg-primary/10 ${loading ? "invisible" : ""}`}
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
