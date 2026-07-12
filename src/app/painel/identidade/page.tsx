import { redirect } from "next/navigation";
import Image from "next/image";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { createClient } from "@/lib/supabase/server";

const palettes = [
  { id:"novam", name:"Novam", colors:["#083D40","#1F4D4F","#FAF9F6","#111111"] },
  { id:"terracota", name:"Terracota", colors:["#6F3528","#B4674F","#FBF7F2","#211815"] },
  { id:"rose", name:"Rose", colors:["#542F36","#A46B77","#FFF8F7","#211719"] },
  { id:"olive", name:"Oliva", colors:["#344236","#75836C","#FAF8F0","#171B17"] },
];

export default async function BrandingPage({ searchParams }: { searchParams: Promise<{ erro?: string; sucesso?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: store } = await supabase.from("stores").select("id, name, hero_title, subtitle, show_hero_content, logo_path, theme_preset, theme_primary, theme_accent, theme_background, theme_text").eq("owner_id", user.id).maybeSingle();
  if (!store) redirect("/painel?erro=Crie+sua+loja+antes+de+configurar+a+identidade.");
  const {data:banners}=await supabase.from("store_banners").select("id, desktop_path, mobile_path, position").eq("store_id",store.id).order("position");
  const message = await searchParams;
  const assetUrl = (path: string | null) => path ? supabase.storage.from("store-assets").getPublicUrl(path).data.publicUrl : null;
  const logoUrl = assetUrl(store.logo_path); const firstBanner=banners?.[0]; const bannerUrl=assetUrl(firstBanner?.desktop_path??null);
  return <div className="dashboard-content subpage-content">
    <div className="dashboard-topbar"><div><p>Etapa 02</p><h1>Identidade visual</h1></div><div className="store-status is-active"><span />Preview atualizado</div></div>
    <p className="dashboard-intro">Adicione os elementos que fazem sua loja ser reconhecida. Imagens nítidas e simples funcionam melhor.</p>
    <FormMessage error={message.erro} success={message.sucesso} />
    <div className="branding-grid">
      <form action="/api/store/branding" method="post" encType="multipart/form-data" className="feature-form">
        <div className="feature-form-heading"><span>Arquivos da marca</span><h2>Logo e banner</h2><p>JPG, PNG ou WebP, com até 5 MB por arquivo.</p></div>
        <label className="upload-field"><span>Logo da loja</span><input name="logo" type="file" accept="image/jpeg,image/png,image/webp" /><small>Prefira uma imagem quadrada, com fundo simples.</small></label>
        <div className="banner-manager"><div className="feature-form-heading"><span>Vitrine responsiva</span><h2>Banners da loja</h2><p>Adicione até 5 banners. A versão mobile é opcional e melhora o enquadramento em telas verticais.</p></div>{Array.from({length:5},(_,position)=>{const banner=banners?.find(item=>item.position===position);return <section className="banner-slot" key={position}><div className="banner-slot-heading"><div><span>{String(position+1).padStart(2,"0")}</span><strong>{banner?"Banner ativo":"Espaço disponível"}</strong></div>{banner&&<label><input type="checkbox" name={`remove_banner_${position}`}/> Remover banner</label>}</div>{banner&&<div className="banner-current"><div>{assetUrl(banner.desktop_path)&&<Image src={assetUrl(banner.desktop_path)!} alt={`Banner ${position+1} desktop`} width={640} height={254} sizes="300px"/>}<small>Desktop</small></div><div>{banner.mobile_path&&assetUrl(banner.mobile_path)?<Image src={assetUrl(banner.mobile_path)!} alt={`Banner ${position+1} mobile`} width={240} height={320} sizes="100px"/>:<span>Usando desktop</span>}<small>Mobile</small></div></div>}<div className="banner-upload-grid"><label className="upload-field"><span>{banner?"Trocar desktop":"Imagem desktop"}</span><input name={`banner_desktop_${position}`} type="file" accept="image/jpeg,image/png,image/webp"/><small>Horizontal, recomendado 1920 × 760 px.</small></label><label className="upload-field"><span>{banner?.mobile_path?"Trocar mobile":"Versão mobile"} <i>Opcional</i></span><input name={`banner_mobile_${position}`} type="file" accept="image/jpeg,image/png,image/webp"/><small>Vertical, recomendado 900 × 1200 px.</small></label></div>{banner?.mobile_path&&<label className="remove-mobile"><input type="checkbox" name={`remove_mobile_${position}`}/> Remover somente a versão mobile</label>}</section>})}</div>
        <div className="storefront-copy-fields"><div className="feature-form-heading"><span>Mensagem da vitrine</span><h2>Chamada e subtítulo</h2><p>Textos curtos deixam o banner mais forte e apresentam a proposta da sua loja sem esconder a imagem.</p></div><label className="hero-visibility-toggle"><input name="show_hero_content" type="checkbox" defaultChecked={store.show_hero_content}/><span className="toggle-track"><span /></span><span><strong>Exibir chamada sobre o banner</strong><small>Desative para usar somente a imagem, sem texto, botão ou camada escura.</small></span></label><label className="field"><span>Chamada do banner <small>Até 100 caracteres</small></span><input name="hero_title" maxLength={100} defaultValue={store.hero_title??""} placeholder="Peças feitas para momentos inesquecíveis." /></label><label className="field"><span>Subtítulo <small>Até 180 caracteres</small></span><textarea name="subtitle" rows={3} maxLength={180} defaultValue={store.subtitle??""} placeholder="Personalização cuidadosa para presentes, celebrações e histórias únicas." /></label></div>
        <div className="palette-field"><span>Paleta da loja</span><p>Escolha uma base pronta ou marque “Personalizada” para ajustar cada cor.</p><div className="palette-presets">{palettes.map(palette=><label key={palette.id}><input type="radio" name="theme_preset" value={palette.id} defaultChecked={store.theme_preset===palette.id}/><span className="palette-swatch">{palette.colors.map(color=><i key={color} style={{background:color}}/>)}</span><strong>{palette.name}</strong></label>)}<label><input type="radio" name="theme_preset" value="custom" defaultChecked={store.theme_preset==="custom"}/><span className="palette-custom-icon">+</span><strong>Personalizada</strong></label></div></div>
        <div className="custom-colors"><label><span>Principal</span><input type="color" name="theme_primary" defaultValue={store.theme_primary}/><small>{store.theme_primary}</small></label><label><span>Destaque</span><input type="color" name="theme_accent" defaultValue={store.theme_accent}/><small>{store.theme_accent}</small></label><label><span>Fundo</span><input type="color" name="theme_background" defaultValue={store.theme_background}/><small>{store.theme_background}</small></label><label><span>Texto</span><input type="color" name="theme_text" defaultValue={store.theme_text}/><small>{store.theme_text}</small></label></div>
        <SubmitButton pendingText="Enviando…">Salvar identidade visual</SubmitButton>
      </form>
      <aside className="brand-live-preview">
        <div className="preview-heading"><div><span>Preview da vitrine</span><strong>O que seu cliente verá</strong></div><i>Ao vivo</i></div>
        <div className="brand-preview-window" style={{ background:store.theme_background, color:store.theme_text }}>
          <div className="brand-preview-header">{logoUrl ? <Image src={logoUrl} alt="Logo atual da loja" width={30} height={30} /> : <i>{store.name.slice(0, 1)}</i>}<strong>{store.name}</strong><span>Menu</span></div>
          <div className={`brand-preview-banner${store.show_hero_content?"":" image-only"}`} style={{ backgroundColor:store.theme_primary, ...(bannerUrl ? { backgroundImage: `url(${bannerUrl})` } : {}) }}>{store.show_hero_content&&<div style={{background:store.theme_primary}}><small>NOVA COLEÇÃO</small><h2>{store.hero_title || `${store.name}, do seu jeito.`}</h2><button style={{color:store.theme_primary}}>Explorar produtos</button></div>}{(banners?.length??0)>1&&<span className="preview-banner-count">1 / {banners!.length}</span>}</div>
          <div className="brand-preview-subtitle">{store.subtitle || "Uma frase curta apresenta o cuidado e a personalidade da sua loja."}</div>
          <div className="brand-preview-products"><i /><i /><i /></div>
        </div>
      </aside>
    </div>
  </div>;
}
