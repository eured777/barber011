import { cn } from "@/lib/utils";

export type BookingStatus = "confirmado" | "concluido" | "cancelado" | "faltou";

const styles: Record<BookingStatus, string> = {
  confirmado: "border-primary/50 bg-primary/10 text-primary",
  concluido: "border-success/50 bg-success/10 text-success",
  cancelado: "border-destructive/50 bg-destructive/10 text-destructive",
  faltou: "border-border bg-muted text-muted-foreground",
};

const labels: Record<BookingStatus, string> = {
  confirmado: "Confirmado",
  concluido: "Concluído",
  cancelado: "Cancelado",
  faltou: "Faltou",
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={cn("rounded-full border px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider", styles[status])}>
      {labels[status]}
    </span>
  );
}
