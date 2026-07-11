import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";

export default async function NewPasswordPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const message = await searchParams;
  return (
    <div className="w-full">
      <p className="eyebrow">Nova senha</p><h1 className="auth-title">Escolha uma<br /><em>senha segura.</em></h1>
      <p className="auth-copy">Use pelo menos oito caracteres.</p><FormMessage error={message.erro} />
      <form action="/auth/update-password" method="post" className="mt-8 space-y-5">
        <label className="field"><span>Nova senha</span><input name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="Mínimo de 8 caracteres" /></label>
        <SubmitButton pendingText="Salvando…">Salvar nova senha</SubmitButton>
      </form>
    </div>
  );
}
