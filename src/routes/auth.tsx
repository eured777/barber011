import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import heroImg from "@/assets/corte-fade.jpg";
import { APP_NAME } from "@/components/app/brand";
import { fieldClass, goldButtonClass } from "@/components/app/ui-classes";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { formatPhone, isValidWhatsApp, phoneDigits } from "@/lib/phone";

type Search = { redirect?: string | undefined };

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    redirect: typeof s["redirect"] === "string" ? s["redirect"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar — RED DO CORTE" },
      { name: "description", content: "Entre ou crie sua conta na RED DO CORTE para agendar seu horário." },
      { property: "og:title", content: "Entrar — RED DO CORTE" },
      { property: "og:description", content: "Entre ou crie sua conta na RED DO CORTE para agendar seu horário." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function safePath(p?: string) {
  return p && p.startsWith("/") && !p.startsWith("//") && !p.startsWith("/auth") ? p : "/";
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const target = safePath(redirect);
  const { user } = useAuth();
  const [mode, setMode] = useState<"entrar" | "cadastrar">("entrar");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate({ to: target, replace: true });
  }, [user, target, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) {
          toast.error(error.message.includes("Invalid") ? "E-mail ou senha incorretos" : error.message);
          return;
        }
        navigate({ to: target, replace: true });
      } else {
        if (!name.trim()) {
          toast.error("Informe seu nome");
          return;
        }
        if (!isValidWhatsApp(phone)) {
          toast.error("Informe seu WhatsApp com DDD");
          return;
        }
        if (password.length < 6) {
          toast.error("A senha precisa ter pelo menos 6 caracteres");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin + target,
            data: { full_name: name.trim(), phone: phoneDigits(phone), nickname: nickname.trim() },
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        if (data.session) navigate({ to: target, replace: true });
        else setSentTo(email.trim());
      }
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (target !== "/") sessionStorage.setItem("after-login", target);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Não foi possível entrar com o Google");
  }

  return (
    <div className="px-5 py-6">
      <div className="relative h-44 overflow-hidden rounded-[2rem] border border-glass-border shadow-card">
        <img src={heroImg} alt="" className="absolute inset-0 size-full object-cover object-right" />
        <span aria-hidden className="absolute inset-0 bg-photo-fade" />
        <div className="absolute inset-x-5 bottom-5">
          <p className="font-display text-4xl tracking-wide text-photo">{APP_NAME}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.25em] text-photo-accent">Agende na régua</p>
        </div>
      </div>

      {sentTo ? (
        <div className="mt-8 rounded-3xl border border-border bg-card p-6 text-center">
          <h2 className="font-display text-3xl tracking-wide">Confirme seu e-mail</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enviamos um link para <span className="font-semibold text-foreground">{sentTo}</span>. Abra o e-mail e toque no link para ativar sua conta.
          </p>
          <button type="button" onClick={() => { setSentTo(null); setMode("entrar"); }} className="mt-5 text-sm font-semibold text-primary">
            Já confirmei, quero entrar
          </button>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 rounded-2xl border border-border bg-card p-1">
            {(["entrar", "cadastrar"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "h-10 rounded-xl text-sm font-bold uppercase tracking-wider transition-all",
                  mode === m ? "bg-gradient-gold text-primary-foreground shadow-gold" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "entrar" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          <form className="mt-5 space-y-3" onSubmit={submit}>
            {mode === "cadastrar" && (
              <>
                <input className={fieldClass} placeholder="Seu nome" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
                <input className={fieldClass} placeholder="Apelido (opcional)" autoComplete="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
                <input className={fieldClass} placeholder="WhatsApp com DDD" type="tel" inputMode="numeric" autoComplete="tel" required value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} />
              </>
            )}
            <input className={fieldClass} placeholder="E-mail" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <input
              className={fieldClass}
              placeholder="Senha"
              type="password"
              autoComplete={mode === "entrar" ? "current-password" : "new-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit" disabled={busy} className={cn(goldButtonClass, "mt-2")}>
              {busy ? "Aguarde..." : mode === "entrar" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={google}
            className="btn-google flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border text-sm font-medium transition-transform active:scale-[0.98]"
          >
            <GoogleIcon />
            Continuar com Google
          </button>
        </>
      )}
    </div>
  );
}
