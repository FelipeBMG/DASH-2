import { useMemo, useState } from "react";
import { z } from "zod";
import { useLocation, useNavigate } from "react-router-dom";
import { Lock, User } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setAuthenticated } from "@/lib/auth";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  usuario: z
    .string()
    .trim()
    .min(1, "Informe o usuário")
    .max(64, "Usuário muito longo"),
  senha: z
    .string()
    .trim()
    .min(1, "Informe a senha")
    .max(64, "Senha muito longa"),
});

type LocationState = {
  from?: string;
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);

  const redirectTo = useMemo(() => {
    return typeof state.from === "string" && state.from.startsWith("/") ? state.from : "/";
  }, [state.from]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = loginSchema.safeParse({ usuario, senha });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    const isAdmin = parsed.data.usuario === "Felipe" && parsed.data.senha === "36597199";
    const isSeller = parsed.data.usuario === "vendedor" && parsed.data.senha === "36597199";
    const isValid = isAdmin || isSeller;
    if (!isValid) {
      setError("Usuário ou senha inválidos");
      return;
    }

    setAuthenticated(true);
    const destination = isSeller ? "/vendedor" : redirectTo;
    navigate(destination, { replace: true });
  };

  return (
    <main className="min-h-screen bg-background">
      <h1 className="sr-only">Login</h1>

      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 left-8 h-[360px] w-[360px] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/80" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10 sm:px-6">
        <div className="w-full">
          <Card className="glass-card w-full overflow-hidden">
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl">Entrar</CardTitle>
                <CardDescription>
                  Use suas credenciais para acessar o dashboard.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="usuario">Usuário</Label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="usuario"
                        autoComplete="username"
                        value={usuario}
                        onChange={(e) => setUsuario(e.target.value)}
                        placeholder="Felipe"
                        className="pl-9 bg-secondary border-border"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha</Label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="senha"
                        type="password"
                        autoComplete="current-password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        placeholder="••••••••"
                        className="pl-9 bg-secondary border-border"
                      />
                    </div>
                  </div>

                  {error ? <p className="text-sm text-destructive">{error}</p> : null}

                  <Button type="submit" className="w-full">
                    Entrar
                  </Button>
                </form>
              </CardContent>
            </Card>
        </div>
      </section>
    </main>
  );
}
