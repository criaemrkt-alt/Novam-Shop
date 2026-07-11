import Link from "next/link";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const message = await searchParams;
  return (
    <div className="w-full">
      <p className="eyebrow">Recuperar acesso</p><h1 className="auth-title">Vamos criar<br /><em>uma nova senha.</em></h1>
      <p className="auth-copy">Informe seu e-mail e enviaremos as instruções.</p><FormMessage error={message.erro} />
      <form action="/auth/forgot-password" method="post" className="mt-8 space-y-5">
        <label className="field"><span>E-mail</span><input name="email" type="email" autoComplete="email" required placeholder="voce@exemplo.com" /></label>
        <SubmitButton pendingText="Enviando…">Enviar instruções</SubmitButton>
      </form>
      <Link className="mt-7 block text-center text-sm font-semibold hover:underline" href="/login">Voltar para o login</Link>
    </div>
  );
}
