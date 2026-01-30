import { useMemo, useState } from "react";
import { z } from "zod";
import { useLocation, useNavigate } from "react-router-dom";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setAuthenticated } from "@/lib/auth";

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

    const isValid = parsed.data.usuario === "Felipe" && parsed.data.senha === "36597199";
    if (!isValid) {
      setError("Usuário ou senha inválidos");
      return;
    }

    setAuthenticated(true);
    navigate(redirectTo, { replace: true });
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Entre para acessar o dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="usuario">
                  Usuário
                </label>
                <Input
                  id="usuario"
                  autoComplete="username"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Felipe"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="senha">
                  Senha
                </label>
                <Input
                  id="senha"
                  type="password"
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button type="submit" className="w-full">
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
