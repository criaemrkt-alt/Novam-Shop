import { redirect } from "next/navigation";
import Link from "next/link";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/server";

type Store = { name: string; description: string | null; slug: string; whatsapp: string; is_active: boolean; logo_path:string|null; banner_path:string|null };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ erro?: string; sucesso?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("stores").select("name, description, slug, whatsapp, is_active, logo_path, banner_path").eq("owner_id", user.id).maybeSingle();
  const store = data as Store | null;
  const message = await searchParams;

  return (
    <div className="dashboard-content">
      <div className="dashboard-topbar">
        <div><p>Configuração da loja</p><h1>{store ? "Sua loja" : "Vamos criar sua loja"}</h1></div>
        {store && <div className={store.is_active ? "store-status is-active" : "store-status"}><span />{store.is_active ? "Loja ativa" : "Loja inativa"}</div>}
      </div>
      <p className="dashboard-intro">Construa sua presença passo a passo. Comece pelas informações essenciais que apresentam sua marca aos clientes.</p>
      <FormMessage error={message.erro} success={message.sucesso} />

      <div className="store-builder-grid">
      <form action="/api/store" method="post" className="store-settings-form">
        <section className="settings-section">
          <div className="settings-copy"><span>01</span><div><h2>Informações principais</h2><p>Nome e descrição que representam sua marca no catálogo.</p></div></div>
          <div className="settings-fields">
            <label className="field"><span>Nome da loja</span><input name="name" required minLength={2} maxLength={100} defaultValue={store?.name ?? ""} placeholder="Ex.: Atelier N." /></label>
            <label className="field"><span>Descrição <small>Opcional</small></span><textarea name="description" rows={5} maxLength={1000} defaultValue={store?.description ?? ""} placeholder="Conte brevemente o que sua loja oferece." /></label>
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-copy"><span>02</span><div><h2>Contato e endereço</h2><p>Defina como o cliente encontra e entra em contato com sua loja.</p></div></div>
          <div className="settings-fields grid gap-5 lg:grid-cols-2">
            <label className="field"><span>WhatsApp</span><input name="whatsapp" type="tel" required defaultValue={store?.whatsapp ?? ""} placeholder="(11) 99999-9999" /><small>Inclua o DDD. O +55 é adicionado automaticamente.</small></label>
            <label className="field"><span>Endereço da loja</span><div className="slug-field"><span>novamshop.com/</span><input name="slug" required minLength={3} maxLength={60} defaultValue={store?.slug ?? ""} placeholder="minha-loja" /></div><small>Use um nome curto e fácil de compartilhar.</small></label>
          </div>
        </section>

        <section className="settings-section settings-section-last">
          <div className="settings-copy"><span>03</span><div><h2>Disponibilidade</h2><p>Controle quando sua loja pode ser encontrada pelos clientes.</p></div></div>
          <div className="settings-fields"><label className="availability-toggle"><input name="is_active" type="checkbox" defaultChecked={store?.is_active ?? true} /><span className="toggle-track"><span /></span><span><strong>Loja ativa</strong><small>Desative para ocultar temporariamente seu catálogo.</small></span></label></div>
        </section>

        <div className="settings-actions"><p>As alterações ficam disponíveis imediatamente.</p><div><SubmitButton pendingText="Salvando…">{store ? "Salvar alterações" : "Criar minha loja"}</SubmitButton></div></div>
      </form>
      <aside className="store-preview-column">
        <div className="preview-heading"><div><span>Preview da loja</span><strong>Como sua marca começa a aparecer</strong></div><i>Ao vivo</i></div>
        <div className="store-mini-preview">
          <div className="mini-store-header"><div className="mini-logo">{(store?.name ?? "N").slice(0, 1).toUpperCase()}</div><strong>{store?.name || "Nome da sua loja"}</strong><span>Bolsa · 0</span></div>
          <div className="mini-store-hero"><span>NOVA COLEÇÃO</span><h3>{store?.description || "Sua marca, seus produtos, sua história."}</h3><button>Ver produtos</button></div>
          <div className="mini-products"><div><span /></div><div><span /></div><div><span /></div></div>
          <div className="mini-store-footer"><span>Novidades</span><span>Mais vendidos</span><span>Sobre</span></div>
        </div>
        <div className="public-address"><span>Endereço público</span><strong>novamshop.com/loja/{store?.slug || "sua-loja"}</strong><small>No desenvolvimento, a loja abre nesta mesma porta do Codespaces.</small>{store&&<Link className="public-store-button" href={`/loja/${store.slug}`} target="_blank">Ver minha loja <b>↗</b></Link>}</div>
      </aside>
      </div>
    </div>
  );
}
