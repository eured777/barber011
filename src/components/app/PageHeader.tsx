import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

export function PageHeader({ title, subtitle, image }: { title: string; subtitle: string; image: string }) {
  return (
    <div className="relative h-40 overflow-hidden rounded-[2rem] border border-glass-border shadow-card">
      <img src={image} alt="" className="absolute inset-0 size-full object-cover object-right" />
      <span aria-hidden className="absolute inset-0 bg-photo-fade" />
      <div className="relative flex h-full flex-col justify-between p-5">
        <Link
          to="/"
          className="inline-flex w-fit items-center gap-1 rounded-full border border-glass-border bg-photo-chip px-3 py-1.5 text-sm font-semibold text-photo backdrop-blur transition-transform active:scale-95"
        >
          <ChevronLeft className="size-4" /> Voltar
        </Link>
        <div>
          <h2 className="font-display text-4xl leading-none tracking-wide text-photo">{title}</h2>
          <p className="mt-1 text-sm text-photo opacity-80">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card px-6 py-10 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-gradient-gold text-primary-foreground shadow-gold">{icon}</span>
      <p className="mt-4 font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      {children && <div className="mt-5 w-full">{children}</div>}
    </div>
  );
}
