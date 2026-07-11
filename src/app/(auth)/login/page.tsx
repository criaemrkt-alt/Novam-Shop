import Link from "next/link";
import { redirect } from "next/navigation";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/server";
import { login } from "../actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string; sucesso?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/painel");
  const message = await searchParams;
  return (
    <div className="w-full">
      <p className="eyebrow">Área do lojista</p>
      <h1 className="auth-title">Bem-vindo<br /><em>de volta.</em></h1>
      <p className="auth-copy">Entre para gerenciar sua loja e acompanhar seus pedidos.</p>
      <FormMessage error={message.erro} success={message.sucesso} />
      <form action={login} className="mt-8 space-y-5">
        <label className="field"><span>E-mail</span><input name="email" type="email" autoComplete="email" required placeholder="voce@exemplo.com" /></label>
        <label className="field"><span>Senha</span><input name="password" type="password" autoComplete="current-password" required placeholder="Sua senha" /></label>
        <div className="text-right"><Link className="text-sm text-petrol hover:underline" href="/recuperar-senha">Esqueci minha senha</Link></div>
        <SubmitButton pendingText="Entrando…">Entrar</SubmitButton>
      </form>
      <p className="mt-7 text-center text-sm text-muted">Ainda não tem uma conta? <Link className="font-semibold text-ink hover:underline" href="/cadastro">Criar conta</Link></p>
    </div>
  );
}
