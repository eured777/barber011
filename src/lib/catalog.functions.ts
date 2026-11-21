import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";

export type Service = Database["public"]["Tables"]["services"]["Row"];
export type Barber = Database["public"]["Tables"]["barbers"]["Row"];

// Leitura pública de serviços e barbeiros (sem login).
export const listCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const client = createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
  const [services, barbers] = await Promise.all([
    client.from("services").select("*").eq("active", true).order("sort_order"),
    client.from("barbers").select("*").eq("active", true).order("sort_order"),
  ]);
  if (services.error) throw new Error(services.error.message);
  if (barbers.error) throw new Error(barbers.error.message);
  return { services: services.data, barbers: barbers.data };
});
