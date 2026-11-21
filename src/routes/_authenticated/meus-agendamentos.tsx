import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarX } from "lucide-react";
import { toast } from "sonner";

import barbaImg from "@/assets/corte-barba.jpg";
import { EmptyState, PageHeader } from "@/components/app/PageHeader";
import { StatusBadge } from "@/components/app/StatusBadge";
import { goldButtonClass, sectionTitleClass, softButtonClass } from "@/components/app/ui-classes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { formatBRL, formatDateLong, formatTime } from "@/lib/schedule";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/meus-agendamentos")({
  head: () => ({
    meta: [
      { title: "Meus agendamentos — RED DO CORTE" },
      { name: "description", content: "Veja seus próximos horários na RED DO CORTE e cancele se precisar." },
      { property: "og:title", content: "Meus agendamentos — RED DO CORTE" },
      { property: "og:description", content: "Veja seus próximos horários na RED DO CORTE e cancele se precisar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MeusAgendamentos,
});

function MeusAgendamentos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["my-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, barbers(name)")
        .eq("user_id", user!.id)
        .order("starts_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const now = Date.now();
  const upcoming = data.filter((b) => b.status === "confirmado" && new Date(b.starts_at).getTime() > now).reverse();
  const history = data.filter((b) => !upcoming.includes(b));

  async function cancel(id: string) {
    const { error } = await supabase.from("bookings").update({ status: "cancelado" }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Agendamento cancelado");
    queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
  }

  return (
    <div className="px-5 pt-5">
      <PageHeader title="Meus agendamentos" subtitle="Seus próximos horários e histórico" image={barbaImg} />

      {isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <>
          <h3 className={cn(sectionTitleClass, "mt-6")}>Próximos</h3>
          <div className="mt-3 space-y-3">
            {upcoming.length === 0 && (
              <EmptyState icon={<CalendarX className="size-6" />} title="Nenhum horário marcado" description="Que tal deixar o visual na régua?">
                <Link to="/agendar" className={goldButtonClass}>Agendar horário</Link>
              </EmptyState>
            )}
            {upcoming.map((b) => (
              <article key={b.id} className="rounded-3xl border border-primary/30 bg-card p-5 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">{formatDateLong(b.starts_at)}</p>
                    <p className="mt-1 font-display text-4xl leading-none">{formatTime(b.starts_at)}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <p className="mt-3 text-sm text-foreground">
                  {b.service_name} com {b.barbers?.name ?? b.barber_id} · <span className="text-primary">{formatBRL(b.price_cents)}</span>
                </p>
                <AlertDialog>
                  <AlertDialogTrigger className={cn(softButtonClass, "mt-4")}>Cancelar horário</AlertDialogTrigger>
                  <AlertDialogContent className="rounded-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar este horário?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {b.service_name} em {formatDateLong(b.starts_at)} às {formatTime(b.starts_at)}.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Manter</AlertDialogCancel>
                      <AlertDialogAction onClick={() => cancel(b.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Cancelar horário
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </article>
            ))}
          </div>

          {history.length > 0 && (
            <>
              <h3 className={cn(sectionTitleClass, "mt-8")}>Histórico</h3>
              <ul className="mt-3 space-y-2">
                {history.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold">{b.service_name}</p>
                      <p className="text-xs text-muted-foreground">{formatDateLong(b.starts_at)} · {formatTime(b.starts_at)}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
