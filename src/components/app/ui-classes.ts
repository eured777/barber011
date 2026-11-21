// Classes compartilhadas no estilo RED DO CORTE.
export const fieldClass =
  "h-12 w-full rounded-2xl border border-input bg-secondary px-4 text-base text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/40";
export const goldButtonClass =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-gold text-base font-bold uppercase tracking-wider text-primary-foreground shadow-gold transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-none disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none";
export const outlineButtonClass =
  "inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-primary/50 bg-transparent text-base font-semibold text-foreground transition-all hover:bg-primary/10 active:scale-[0.98] disabled:opacity-50";
export const softButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-all hover:border-primary/50 hover:text-primary active:scale-95";
export const chipClass = (active: boolean) =>
  active
    ? "rounded-2xl border border-primary bg-primary/15 text-primary shadow-gold"
    : "rounded-2xl border border-border bg-card text-foreground hover:border-primary/40";
export const sectionTitleClass = "font-display text-2xl tracking-wide text-foreground";
