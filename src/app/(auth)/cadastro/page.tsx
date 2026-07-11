import Link from "next/link";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { signup } from "../actions";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const message = await searchParams;
  return (
    <div className="w-full">
      <p className="eyebrow">Comece sua loja</p>
      <h1 className="auth-title">Sua vitrine<br /><em>começa aqui.</em></h1>
      <p className="auth-copy">Crie sua conta para configurar seu catálogo profissional.</p>
      <FormMessage error={message.erro} />
      <form action={signup} className="mt-8 space-y-5">
        <label className="field"><span>Seu nome</span><input name="name" autoComplete="name" required minLength={2} maxLength={100} placeholder="Como podemos chamar você?" /></label>
        <label className="field"><span>E-mail</span><input name="email" type="email" autoComplete="email" required placeholder="voce@exemplo.com" /></label>
        <label className="field"><span>Senha</span><input name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="Mínimo de 8 caracteres" /></label>
        <SubmitButton pendingText="Criando conta…">Criar minha conta</SubmitButton>
      </form>
      <p className="mt-7 text-center text-sm text-muted">Já tem uma conta? <Link className="font-semibold text-ink hover:underline" href="/login">Entrar</Link></p>
    </div>
  );
}
