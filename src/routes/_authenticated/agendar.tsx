import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import fadeImg from "@/assets/corte-fade.jpg";
import { BookingCalendar } from "@/components/app/BookingCalendar";
import { PageHeader } from "@/components/app/PageHeader";
import { chipClass, fieldClass, goldButtonClass, sectionTitleClass } from "@/components/app/ui-classes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { catalogQuery } from "@/lib/queries";
import { formatPhone, isValidWhatsApp, phoneDigits } from "@/lib/phone";
import { addDays, buildSlots, dayLabels, formatBRL, formatDuration, isOpenDay, shopToday } from "@/lib/schedule";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/agendar")({
  head: () => ({
    meta: [
      { title: "Agendar horário — RED DO CORTE" },
      { name: "description", content: "Escolha serviço, barbeiro, dia e horário na RED DO CORTE." },
      { property: "og:title", content: "Agendar horário — RED DO CORTE" },
      { property: "og:description", content: "Escolha serviço, barbeiro, dia e horário na RED DO CORTE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(catalogQuery),
  component: Agendar,
});

function Agendar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, displayName } = useAuth();
  const { data: catalog } = useSuspenseQuery(catalogQuery);
  // Agenda aberta até 60 dias à frente.
  const { minDate, maxDate } = useMemo(() => {
    const today = shopToday();
    return { minDate: today, maxDate: addDays(today, 60) };
  }, []);
  const [serviceId, setServiceId] = useState(catalog.services[0]?.id ?? "");
  const [barberId, setBarberId] = useState(catalog.barbers[0]?.id ?? "");
  const [date, setDate] = useState(() => {
    let d = minDate;
    while (!isOpenDay(d)) d = addDays(d, 1);
    return d;
  });
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nickname, setNickname] = useState("");
  const [saving, setSaving] = useState(false);

  const service = catalog.services.find((s) => s.id === serviceId);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("full_name, phone, nickname").eq("id", user!.id).maybeSingle()).data,
  });
  useEffect(() => {
    if (profile) {
      setName((n) => n || profile.full_name || displayName);
      setPhone((p) => p || formatPhone(profile.phone ?? ""));
      setNickname((n) => n || profile.nickname || "");
    }
  }, [profile, displayName]);

  const { data: busy = [], isLoading } = useQuery({
    queryKey: ["busy", date],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_busy_slots", { _day: date });
      if (error) throw error;
      return data;
    },
  });

  const slots = service ? buildSlots({ date, durationMin: service.duration_min, barberId, busy }) : [];
  const freeSlots = slots.filter((s) => s.available);
  useEffect(() => setTime(null), [serviceId, barberId, date]);

  async function confirm() {
    if (!user || !service || !time) return;
    const slot = slots.find((s) => s.time === time);
    if (!slot) return;
    if (!name.trim()) {
      toast.error("Informe seu nome");
      return;
    }
    if (!isValidWhatsApp(phone)) {
      toast.error("Informe seu WhatsApp com DDD");
      return;
    }
    setSaving(true);
    // Guarda os dados no perfil para já virem preenchidos no próximo agendamento.
    await supabase
      .from("profiles")
      .update({ full_name: name.trim(), phone: phoneDigits(phone), nickname: nickname.trim() || null })
      .eq("id", user.id);
    const { error } = await supabase.from("bookings").insert({
      user_id: user.id,
      client_name: name.trim(),
      client_phone: phoneDigits(phone),
      client_nickname: nickname.trim() || null,
      service_id: service.id,
      barber_id: barberId,
      starts_at: slot.startsAt,
      ends_at: slot.endsAt,
    });
    setSaving(false);
    if (error) {
      queryClient.invalidateQueries({ queryKey: ["busy", date] });
      toast.error(error.code === "23P01" ? "Esse horário acabou de ser reservado. Escolha outro." : error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    toast.success("Horário agendado!", { description: `${dayLabels(date).long} às ${time}` });
    navigate({ to: "/meus-agendamentos" });
  }

  return (
    <div className="px-5 pt-5">
      <PageHeader title="Agendar" subtitle="Monte seu horário em poucos toques" image={fadeImg} />

      <h3 className={cn(sectionTitleClass, "mt-6")}>Serviço</h3>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {catalog.services.map((s) => (
          <button key={s.id} type="button" onClick={() => setServiceId(s.id)} className={cn("p-3 text-left transition-all", chipClass(s.id === serviceId))}>
            <span className="block font-semibold">{s.name}</span>
            <span className="text-xs opacity-75">{formatBRL(s.price_cents)} · {formatDuration(s.duration_min)}</span>
          </button>
        ))}
      </div>

      <h3 className={cn(sectionTitleClass, "mt-6")}>Barbeiro</h3>
      <div className="mt-3 flex gap-2">
        {catalog.barbers.map((b) => (
          <button key={b.id} type="button" onClick={() => setBarberId(b.id)} className={cn("flex-1 px-4 py-3 font-semibold transition-all", chipClass(b.id === barberId))}>
            {b.name}
          </button>
        ))}
      </div>

      <h3 className={cn(sectionTitleClass, "mt-6")}>Dia</h3>
      <div className="mt-3">
        <BookingCalendar value={date} onChange={setDate} minDate={minDate} maxDate={maxDate} />
      </div>

      <div className="mt-6 flex items-baseline justify-between gap-3">
        <h3 className={sectionTitleClass}>Horário</h3>
        <span className="text-xs text-muted-foreground first-letter:uppercase">{dayLabels(date).long}</span>
      </div>
      <div className="mt-3">
        {isLoading && <p className="text-sm text-muted-foreground">Carregando horários...</p>}
        {!isLoading && freeSlots.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-5 text-center text-sm text-muted-foreground">
            Nenhum horário livre neste dia. Escolha outro dia no calendário.
          </p>
        )}
        {!isLoading && freeSlots.length > 0 && (
          <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]" role="listbox" aria-label="Horários livres">
            {freeSlots.map((s) => (
              <button
                key={s.time}
                type="button"
                role="option"
                aria-selected={time === s.time}
                onClick={() => setTime(s.time)}
                className={cn("flex w-[4.5rem] shrink-0 flex-col items-center py-3 transition-all", chipClass(time === s.time))}
              >
                <span className="font-display text-2xl leading-none">{s.time}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <h3 className={cn(sectionTitleClass, "mt-6")}>Seus dados</h3>
      <div className="mt-3 space-y-3">
        <input className={fieldClass} placeholder="Seu nome" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        <div>
          <input className={fieldClass} placeholder="Apelido (opcional)" autoComplete="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
          <p className="mt-1 px-2 text-xs text-muted-foreground">Como o barbeiro te conhece, se for diferente do nome.</p>
        </div>
        <input
          className={fieldClass}
          placeholder="WhatsApp com DDD"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          required
          aria-invalid={phone.length > 0 && !isValidWhatsApp(phone)}
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
        />
      </div>

      <button type="button" disabled={!time || saving} onClick={confirm} className={cn(goldButtonClass, "mt-6")}>
        {saving ? "Agendando..." : time && service ? `Confirmar · ${time} · ${formatBRL(service.price_cents)}` : "Escolha um horário"}
      </button>
    </div>
  );
}
