import { createFileRoute } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";

import heroImg from "@/assets/barbearia-hero.jpg";
import { PageHeader } from "@/components/app/PageHeader";
import { sectionTitleClass } from "@/components/app/ui-classes";
import { Switch } from "@/components/ui/switch";
import { setTheme, useTheme } from "@/lib/theme";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — RED DO CORTE" },
      { name: "description", content: "Escolha o tema preto ou branco do app RED DO CORTE." },
      { property: "og:title", content: "Configurações — RED DO CORTE" },
      { property: "og:description", content: "Escolha o tema preto ou branco do app RED DO CORTE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Configuracoes,
});

function Configuracoes() {
  const theme = useTheme();
  const dark = theme === "dark";

  return (
    <div className="px-5 pt-5">
      <PageHeader title="Configurações" subtitle="Deixe o app do seu jeito" image={heroImg} />

      <h3 className={`${sectionTitleClass} mt-7`}>Aparência</h3>
      <label
        htmlFor="tema-escuro"
        className="mt-3 flex cursor-pointer items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-card"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-gold text-primary-foreground shadow-gold">
          {dark ? <Moon className="size-6" /> : <Sun className="size-6" />}
        </span>
        <span className="flex-1">
          <span className="block font-semibold text-foreground">Tema {dark ? "preto" : "branco"}</span>
          <span className="mt-0.5 block text-sm text-muted-foreground">
            {dark ? "Desligue para usar o tema branco" : "Ligue para voltar ao tema preto"}
          </span>
        </span>
        <Switch
          id="tema-escuro"
          checked={dark}
          onCheckedChange={(on) => setTheme(on ? "dark" : "light")}
          aria-label="Tema preto"
          className="h-7 w-12 [&>span]:size-6 [&>span]:data-[state=checked]:translate-x-5"
        />
      </label>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <ThemeOption label="Preto" active={dark} onClick={() => setTheme("dark")} swatch="bg-swatch-dark" />
        <ThemeOption label="Branco" active={!dark} onClick={() => setTheme("light")} swatch="bg-swatch-light" />
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">Sua escolha fica salva neste aparelho.</p>
    </div>
  );
}

function ThemeOption({ label, active, onClick, swatch }: { label: string; active: boolean; onClick: () => void; swatch: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col items-center gap-2 rounded-3xl border p-3 transition-all active:scale-[0.98] ${
        active ? "border-primary bg-primary/10 shadow-gold" : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <span className={`relative h-16 w-full overflow-hidden rounded-2xl border border-border ${swatch}`}>
        <span className="absolute inset-x-3 top-3 h-2 rounded-full bg-gradient-gold" />
        <span className="absolute inset-x-3 top-7 h-2 w-1/2 rounded-full bg-gradient-gold opacity-50" />
      </span>
      <span className={`text-sm font-semibold ${active ? "text-primary" : "text-foreground"}`}>{label}</span>
    </button>
  );
}
