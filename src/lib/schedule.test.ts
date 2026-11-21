import { describe, expect, it } from "vitest";

import { buildSlots, isOpenDay } from "./schedule";

// 2026-11-17 é terça, 2026-11-22 é domingo, 2026-11-23 é segunda.
const before = new Date("2026-11-01T12:00:00-03:00");

describe("horários da barbearia", () => {
  it("atende de terça a sábado", () => {
    expect(isOpenDay("2026-11-17")).toBe(true);
    expect(isOpenDay("2026-11-21")).toBe(true);
    expect(isOpenDay("2026-11-22")).toBe(false);
    expect(isOpenDay("2026-11-23")).toBe(false);
  });

  it("não gera horários em domingo", () => {
    expect(buildSlots({ date: "2026-11-22", durationMin: 30, barberId: "rafael", busy: [], now: before })).toEqual([]);
  });

  it("serviço de 30 min vai das 9h às 18h30", () => {
    const slots = buildSlots({ date: "2026-11-17", durationMin: 30, barberId: "rafael", busy: [], now: before });
    expect(slots[0]?.time).toBe("09:00");
    expect(slots.at(-1)?.time).toBe("18:30");
    expect(slots).toHaveLength(20);
  });

  it("serviço de 60 min termina até as 19h", () => {
    const slots = buildSlots({ date: "2026-11-17", durationMin: 60, barberId: "rafael", busy: [], now: before });
    expect(slots.at(-1)?.time).toBe("18:00");
  });

  it("bloqueia horário ocupado só para o mesmo barbeiro", () => {
    const busy = [{ barber_id: "rafael", starts_at: "2026-11-17T10:00:00-03:00", ends_at: "2026-11-17T11:00:00-03:00" }];
    const rafael = buildSlots({ date: "2026-11-17", durationMin: 30, barberId: "rafael", busy, now: before });
    const diego = buildSlots({ date: "2026-11-17", durationMin: 30, barberId: "diego", busy, now: before });
    expect(rafael.find((s) => s.time === "10:00")?.available).toBe(false);
    expect(rafael.find((s) => s.time === "10:30")?.available).toBe(false);
    expect(rafael.find((s) => s.time === "11:00")?.available).toBe(true);
    expect(diego.find((s) => s.time === "10:00")?.available).toBe(true);
  });

  it("combo de 60 min não cabe colado antes de um horário ocupado", () => {
    const busy = [{ barber_id: "rafael", starts_at: "2026-11-17T10:00:00-03:00", ends_at: "2026-11-17T10:30:00-03:00" }];
    const slots = buildSlots({ date: "2026-11-17", durationMin: 60, barberId: "rafael", busy, now: before });
    expect(slots.find((s) => s.time === "09:30")?.available).toBe(false);
    expect(slots.find((s) => s.time === "09:00")?.available).toBe(true);
  });

  it("horários que já passaram ficam indisponíveis", () => {
    const now = new Date("2026-11-17T14:10:00-03:00");
    const slots = buildSlots({ date: "2026-11-17", durationMin: 30, barberId: "rafael", busy: [], now });
    expect(slots.find((s) => s.time === "14:00")?.available).toBe(false);
    expect(slots.find((s) => s.time === "14:30")?.available).toBe(true);
  });
});
