import { redirect } from "next/navigation";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/server";

type Store = { name: string; description: string | null; slug: string; whatsapp: string; is_active: boolean };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ erro?: string; sucesso?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("stores").select("name, description, slug, whatsapp, is_active").eq("owner_id", user.id).maybeSingle();
  const store = data as Store | null;
  const message = await searchParams;

  return (
    <div className="max-w-3xl">
      <p className="eyebrow">Configuração</p>
      <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><h1 className="font-editorial text-4xl tracking-[-0.03em] md:text-5xl">{store ? "Minha loja" : "Crie sua loja"}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-muted">Estas informações formam a identidade básica do seu catálogo.</p></div>
        {store && <span className={store.is_active ? "status-badge status-active" : "status-badge"}>{store.is_active ? "Loja ativa" : "Loja inativa"}</span>}
      </div>
      <FormMessage error={message.erro} success={message.sucesso} />

      <form action="/api/store" method="post" className="mt-8 border border-line bg-white p-5 md:p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="field sm:col-span-2"><span>Nome da loja</span><input name="name" required minLength={2} maxLength={100} defaultValue={store?.name ?? ""} placeholder="Ex.: Atelier N." /></label>
          <label className="field sm:col-span-2"><span>Descrição <small>Opcional</small></span><textarea name="description" rows={4} maxLength={1000} defaultValue={store?.description ?? ""} placeholder="Conte brevemente o que sua loja oferece." /></label>
          <label className="field"><span>WhatsApp</span><input name="whatsapp" type="tel" required defaultValue={store?.whatsapp ?? ""} placeholder="(11) 99999-9999" /><small>O código do Brasil (+55) é adicionado automaticamente.</small></label>
          <label className="field"><span>Endereço da loja</span><div className="slug-field"><span>novamshop.com/</span><input name="slug" required minLength={3} maxLength={60} defaultValue={store?.slug ?? ""} placeholder="minha-loja" /></div><small>Use um nome curto e fácil de compartilhar.</small></label>
        </div>
        <label className="mt-7 flex items-start gap-3 border-t border-line pt-6"><input className="mt-1 size-4 accent-petrol" name="is_active" type="checkbox" defaultChecked={store?.is_active ?? true} /><span><strong className="block text-sm">Loja ativa</strong><small className="mt-1 block text-xs leading-5 text-muted">Quando desativada, a loja não aparecerá para os clientes.</small></span></label>
        <div className="mt-8 max-w-52"><SubmitButton pendingText="Salvando…">{store ? "Salvar alterações" : "Criar minha loja"}</SubmitButton></div>
      </form>
    </div>
  );
}
