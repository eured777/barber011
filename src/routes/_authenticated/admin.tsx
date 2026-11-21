import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { CalendarX, MessageCircle, Phone } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import heroImg from "@/assets/barbearia-hero.jpg";
import { DayPicker } from "@/components/app/DayPicker";
import { EmptyState, PageHeader } from "@/components/app/PageHeader";
import { StatusBadge, type BookingStatus } from "@/components/app/StatusBadge";
import { softButtonClass } from "@/components/app/ui-classes";
import { supabase } from "@/integrations/supabase/client";
import { formatPhone, whatsAppLink } from "@/lib/phone";
import { addDays, dayRange, formatBRL, formatTime, shopToday } from "@/lib/schedule";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data } = await supabase.rpc("has_role", { _user_id: context.user.id, _role: "admin" });
    if (data !== true) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Painel do barbeiro — RED DO CORTE" },
      { name: "description", content: "Agenda do dia, clientes e status dos atendimentos da RED DO CORTE." },
      { property: "og:title", content: "Painel do barbeiro — RED DO CORTE" },
      { property: "og:description", content: "Agenda do dia, clientes e status dos atendimentos da RED DO CORTE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const queryClient = useQueryClient();
  const days = useMemo(() => Array.from({ length: 21 }, (_, i) => addDays(shopToday(), i - 3)), []);
  const [date, setDate] = useState(shopToday());

  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-bookings", date],
    queryFn: async () => {
      const { from, to } = dayRange(date);
      const { data, error } = await supabase
        .from("bookings")
        .select("*, barbers(name)")
        .gte("starts_at", from)
        .lt("starts_at", to)
        .order("starts_at");
      if (error) throw error;
      return data;
    },
  });

  const active = data.filter((b) => b.status !== "cancelado");
  const revenue = active.filter((b) => b.status !== "faltou").reduce((sum, b) => sum + b.price_cents, 0);

  async function setStatus(id: string, status: BookingStatus) {
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Agendamento atualizado");
    queryClient.invalidateQueries({ queryKey: ["admin-bookings", date] });
  }

  return (
    <div className="px-5 pt-5">
      <PageHeader title="Painel do barbeiro" subtitle="Gerencie a agenda da barbearia" image={heroImg} />

      <div className="mt-5">
        <DayPicker days={days} value={date} onChange={setDate} allowClosed />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Agendamentos</p>
          <p className="font-display text-3xl">{active.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Previsto</p>
          <p className="font-display text-3xl text-gradient-gold">{formatBRL(revenue)}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
        {!isLoading && data.length === 0 && (
          <EmptyState icon={<CalendarX className="size-6" />} title="Agenda livre" description="Nenhum agendamento neste dia." />
        )}
        {data.map((b) => (
          <article key={b.id} className={cn("rounded-3xl border bg-card p-4", b.status === "confirmado" ? "border-primary/30" : "border-border opacity-80")}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-3xl leading-none">{formatTime(b.starts_at)}</p>
                <p className="mt-1 text-sm font-semibold">
                  {b.client_nickname ? (
                    <>
                      <span className="text-primary">{b.client_nickname}</span>
                      <span className="font-normal text-muted-foreground"> · {b.client_name}</span>
                    </>
                  ) : (
                    b.client_name
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {b.service_name} · {b.barbers?.name ?? b.barber_id} · {formatBRL(b.price_cents)}
                </p>
                {b.client_phone && (
                  <div className="mt-1.5 flex flex-wrap gap-3 text-xs">
                    <a href={whatsAppLink(b.client_phone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary">
                      <MessageCircle className="size-3.5" /> {formatPhone(b.client_phone)}
                    </a>
                    <a href={`tel:${b.client_phone}`} aria-label="Ligar" className="inline-flex items-center gap-1 text-muted-foreground hover:text-primary">
                      <Phone className="size-3.5" /> Ligar
                    </a>
                  </div>
                )}
              </div>
              <StatusBadge status={b.status} />
            </div>
            {b.status === "confirmado" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={softButtonClass} onClick={() => setStatus(b.id, "concluido")}>Concluído</button>
                <button type="button" className={softButtonClass} onClick={() => setStatus(b.id, "faltou")}>Faltou</button>
                <button type="button" className={softButtonClass} onClick={() => setStatus(b.id, "cancelado")}>Cancelar</button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
