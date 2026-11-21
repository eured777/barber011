import { createFileRoute } from "@tanstack/react-router";
import { Clock, Instagram, MapPin, MessageCircle } from "lucide-react";
import type { ReactNode } from "react";

import barbaImg from "@/assets/corte-barba.jpg";
import { SHOP_CONTACT } from "@/components/app/brand";
import { PageHeader } from "@/components/app/PageHeader";
import { goldButtonClass } from "@/components/app/ui-classes";

export const Route = createFileRoute("/fale-conosco")({
  head: () => ({
    meta: [
      { title: "Fale conosco — RED DO CORTE" },
      { name: "description", content: "Fale com o barbeiro da RED DO CORTE pelo WhatsApp e veja horário e endereço." },
      { property: "og:title", content: "Fale conosco — RED DO CORTE" },
      { property: "og:description", content: "Fale com o barbeiro da RED DO CORTE pelo WhatsApp e veja horário e endereço." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FaleConosco,
});

function FaleConosco() {
  const { whatsapp, whatsappLabel, instagram, address, hours } = SHOP_CONTACT;
  const waLink = whatsapp
    ? `https://wa.me/${whatsapp}?text=${encodeURIComponent("Olá! Vim pelo app da RED DO CORTE.")}`
    : null;

  return (
    <div className="px-5 pt-5">
      <PageHeader title="Fale conosco" subtitle="Tire dúvidas direto com o barbeiro" image={barbaImg} />

      <ul className="mt-6 space-y-3">
        <ContactRow icon={<MessageCircle className="size-5" />} label="WhatsApp" value={whatsapp ? whatsappLabel : null} href={waLink} />
        <ContactRow
          icon={<Instagram className="size-5" />}
          label="Instagram"
          value={instagram ? `@${instagram}` : null}
          href={instagram ? `https://instagram.com/${instagram}` : null}
        />
        <ContactRow
          icon={<MapPin className="size-5" />}
          label="Endereço"
          value={address}
          href={address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null}
        />
        <ContactRow icon={<Clock className="size-5" />} label="Horário" value={hours} href={null} />
      </ul>

      {waLink && (
        <a href={waLink} target="_blank" rel="noopener noreferrer" className={`${goldButtonClass} mt-6`}>
          <MessageCircle className="size-5" /> Chamar no WhatsApp
        </a>
      )}
    </div>
  );
}

function ContactRow({ icon, label, value, href }: { icon: ReactNode; label: string; value: string | null; href: string | null }) {
  const body = (
    <>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-gold text-primary-foreground shadow-gold">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className={`block truncate font-semibold ${value ? "text-foreground" : "text-muted-foreground"}`}>{value ?? "A definir"}</span>
      </span>
    </>
  );
  const cls = "flex items-center gap-4 rounded-3xl border border-border bg-card p-4";
  return (
    <li>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={`${cls} transition-all hover:border-primary/50 active:scale-[0.98]`}>
          {body}
        </a>
      ) : (
        <div className={cls}>{body}</div>
      )}
    </li>
  );
}
