import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { Mail, User } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";

const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome").max(80, "Nome muito longo"),
    email: z.string().trim().email("Email inválido").max(255, "Email muito longo"),
    password: z.string().trim().min(6, "Senha muito curta").max(64, "Senha muito longa"),
  })
  .strict();

async function isSignupOpen(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const supabase = getSupabase();

  // Prefer server-side decision (recommended). If function doesn't exist yet,
  // we fallback to "open" to allow first-user bootstrap.
  const { data, error } = await supabase.rpc("is_signup_open");
  if (error) return true;
  return Boolean(data);
}

export default function Signup() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return name.trim().length >= 2 && email.trim().length > 0 && password.trim().length >= 6;
  }, [email, name, password]);

  useEffect(() => {
    let alive = true;
    setChecking(true);
    void isSignupOpen()
      .then((value) => {
        if (!alive) return;
        setOpen(value);
        if (!value) navigate("/login", { replace: true });
      })
      .finally(() => {
        if (!alive) return;
        setChecking(false);
      });
    return () => {
      alive = false;
    };
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isSupabaseConfigured) {
      setError("Backend não configurado");
      return;
    }

    const parsed = signupSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = getSupabase();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // If session is immediately available (email confirmations off), create profile now.
      const userId = data.user?.id;
      if (userId) {
        await supabase.from("user_profiles").upsert({ user_id: userId, name: parsed.data.name });
      }

      // Login flow continues via /login (role assignment is handled after you promote to admin).
      navigate("/login", { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) return null;
  if (!open) return null;

  return (
    <main className="min-h-screen bg-background">
      <h1 className="sr-only">Criar conta</h1>

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 left-8 h-[360px] w-[360px] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/80" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10 sm:px-6">
        <div className="w-full">
          <Card className="glass-card w-full overflow-hidden">
            <CardHeader className="space-y-2">
              <CardTitle className="text-2xl">Criar conta</CardTitle>
              <CardDescription>Crie seu acesso inicial. Depois você pode desativar o cadastro aberto.</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className="pl-9 bg-secondary border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seuemail@dominio.com"
                      className="pl-9 bg-secondary border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="mínimo 6 caracteres"
                    className="bg-secondary border-border"
                  />
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <Button type="submit" className="w-full" disabled={!canSubmit || submitting}>
                  {submitting ? "Criando..." : "Criar conta"}
                </Button>

                <p className="text-sm text-muted-foreground">
                  Já tem conta?{" "}
                  <Link to="/login" className="underline underline-offset-4">
                    Entrar
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
