import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock } from "lucide-react";

import classicoImg from "@/assets/corte-classico.jpg";
import { PageHeader } from "@/components/app/PageHeader";
import { goldButtonClass } from "@/components/app/ui-classes";
import { catalogQuery } from "@/lib/queries";
import { formatBRL, formatDuration } from "@/lib/schedule";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços e preços — RED DO CORTE" },
      { name: "description", content: "Corte, barba, combo e sobrancelha: veja preços e duração na RED DO CORTE." },
      { property: "og:title", content: "Serviços e preços — RED DO CORTE" },
      { property: "og:description", content: "Corte, barba, combo e sobrancelha: veja preços e duração na RED DO CORTE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  component: Servicos,
});

function Servicos() {
  const { data } = useSuspenseQuery(catalogQuery);
  return (
    <div className="px-5 pt-5">
      <PageHeader title="Serviços" subtitle="Preços e duração de cada atendimento" image={classicoImg} />
      <ul className="mt-5 space-y-3">
        {data.services.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-card p-5">
            <div>
              <p className="font-display text-2xl tracking-wide">{s.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{s.description}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3.5 text-primary" /> {formatDuration(s.duration_min)}
              </p>
            </div>
            <span className="shrink-0 font-display text-2xl text-gradient-gold">{formatBRL(s.price_cents)}</span>
          </li>
        ))}
      </ul>
      <Link to="/agendar" className={`${goldButtonClass} mt-6`}>Agendar agora</Link>
    </div>
  );
}
