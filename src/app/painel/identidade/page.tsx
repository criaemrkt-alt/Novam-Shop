import { redirect } from "next/navigation";
import Image from "next/image";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/server";

export default async function BrandingPage({ searchParams }: { searchParams: Promise<{ erro?: string; sucesso?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: store } = await supabase.from("stores").select("name, description, logo_path, banner_path").eq("owner_id", user.id).maybeSingle();
  if (!store) redirect("/painel?erro=Crie+sua+loja+antes+de+configurar+a+identidade.");
  const message = await searchParams;
  const assetUrl = (path: string | null) => path ? supabase.storage.from("store-assets").getPublicUrl(path).data.publicUrl : null;
  const logoUrl = assetUrl(store.logo_path); const bannerUrl = assetUrl(store.banner_path);
  return <div className="dashboard-content subpage-content">
    <div className="dashboard-topbar"><div><p>Etapa 02</p><h1>Identidade visual</h1></div><div className="store-status is-active"><span />Preview atualizado</div></div>
    <p className="dashboard-intro">Adicione os elementos que fazem sua loja ser reconhecida. Imagens nítidas e simples funcionam melhor.</p>
    <FormMessage error={message.erro} success={message.sucesso} />
    <div className="branding-grid">
      <form action="/api/store/branding" method="post" encType="multipart/form-data" className="feature-form">
        <div className="feature-form-heading"><span>Arquivos da marca</span><h2>Logo e banner</h2><p>JPG, PNG ou WebP, com até 5 MB por arquivo.</p></div>
        <label className="upload-field"><span>Logo da loja</span><input name="logo" type="file" accept="image/jpeg,image/png,image/webp" /><small>Prefira uma imagem quadrada, com fundo simples.</small></label>
        <label className="upload-field"><span>Banner principal</span><input name="banner" type="file" accept="image/jpeg,image/png,image/webp" /><small>Recomendação: imagem horizontal com boa área de respiro.</small></label>
        <SubmitButton pendingText="Enviando…">Salvar identidade visual</SubmitButton>
      </form>
      <aside className="brand-live-preview">
        <div className="preview-heading"><div><span>Preview da vitrine</span><strong>O que seu cliente verá</strong></div><i>Ao vivo</i></div>
        <div className="brand-preview-window">
          <div className="brand-preview-header">{logoUrl ? <Image src={logoUrl} alt="Logo atual da loja" width={30} height={30} /> : <i>{store.name.slice(0, 1)}</i>}<strong>{store.name}</strong><span>Menu</span></div>
          <div className="brand-preview-banner" style={bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : undefined}><div><small>NOVA COLEÇÃO</small><h2>{store.description || "Produtos escolhidos para fazer parte da sua história."}</h2><button>Explorar produtos</button></div></div>
          <div className="brand-preview-products"><i /><i /><i /></div>
        </div>
      </aside>
    </div>
  </div>;
}
