import { NextResponse } from "next/server";
import { formValue, isAllowedFormOrigin, redirectWithMessage } from "@/lib/http";
import { safeFileName, validImage } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isAllowedFormOrigin(request)) return new NextResponse("Origem inválida", { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirectWithMessage(request, "/login", "erro", "Sua sessão expirou.");
  const { data: store } = await supabase.from("stores").select("id, logo_path").eq("owner_id", user.id).maybeSingle();
  if (!store) return redirectWithMessage(request, "/painel", "erro", "Crie sua loja antes de adicionar a identidade visual.");
  const { data: currentBanners } = await supabase.from("store_banners").select("id, desktop_path, mobile_path, position").eq("store_id", store.id).order("position");
  const formData = await request.formData();
  const logo = formData.get("logo");
  const hero_title = formValue(formData, "hero_title");
  const subtitle = formValue(formData, "subtitle");
  const show_hero_content = formData.get("show_hero_content") === "on";
  if (hero_title.length > 100 || subtitle.length > 180) {
    return redirectWithMessage(request, "/painel/identidade", "erro", "Revise o tamanho da chamada e do subtítulo.");
  }
  const theme_preset = formValue(formData, "theme_preset") || "custom";
  const presetColors:Record<string,[string,string,string,string]> = { novam:["#083D40","#1F4D4F","#FAF9F6","#111111"], terracota:["#6F3528","#B4674F","#FBF7F2","#211815"], rose:["#542F36","#A46B77","#FFF8F7","#211719"], olive:["#344236","#75836C","#FAF8F0","#171B17"] };
  const customColors:[string,string,string,string] = [formValue(formData, "theme_primary").toUpperCase(), formValue(formData, "theme_accent").toUpperCase(), formValue(formData, "theme_background").toUpperCase(), formValue(formData, "theme_text").toUpperCase()];
  const [theme_primary, theme_accent, theme_background, theme_text] = presetColors[theme_preset] ?? customColors;
  if (![theme_primary, theme_accent, theme_background, theme_text].every(color => /^#[0-9A-F]{6}$/.test(color))) {
    return redirectWithMessage(request, "/painel/identidade", "erro", "Escolha cores válidas para a paleta.");
  }
  const bannerFiles = Array.from({length:5},(_,position)=>({position,desktop:formData.get(`banner_desktop_${position}`),mobile:formData.get(`banner_mobile_${position}`)}));
  const invalidBanner = bannerFiles.some(({desktop,mobile})=>[desktop,mobile].some(file=>file instanceof File&&file.size>0&&!validImage(file)));
  if ((logo instanceof File && logo.size && !validImage(logo)) || invalidBanner) {
    return redirectWithMessage(request, "/painel/identidade", "erro", "Use JPG, PNG ou WebP com até 5 MB.");
  }
  const updates: { logo_path?: string; hero_title:string|null; subtitle:string|null; show_hero_content:boolean; theme_preset:string; theme_primary:string; theme_accent:string; theme_background:string; theme_text:string } = { hero_title:hero_title||null, subtitle:subtitle||null, show_hero_content, theme_preset, theme_primary, theme_accent, theme_background, theme_text };
  const pendingUploads = new Set<string>();
  const uploadImage=async(file:File,folder:string)=>{
    const path = `${user.id}/${store.id}/branding/${folder}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage.from("store-assets").upload(path, file, { contentType: file.type, upsert: false });
    if(error)throw error;
    pendingUploads.add(path);
    return path;
  };
  try {
    if(validImage(logo))updates.logo_path=await uploadImage(logo,"logo");
  } catch {
    if(pendingUploads.size)await supabase.storage.from("store-assets").remove([...pendingUploads]);
    return redirectWithMessage(request,"/painel/identidade","erro","Não foi possível enviar a logo.");
  }
  const { error:storeError } = await supabase.from("stores").update(updates).eq("id", store.id);
  if (storeError) {
    if(pendingUploads.size)await supabase.storage.from("store-assets").remove([...pendingUploads]);
    return redirectWithMessage(request, "/painel/identidade", "erro", "Não foi possível salvar a identidade visual.");
  }
  if(updates.logo_path)pendingUploads.delete(updates.logo_path);
  const oldPaths = [updates.logo_path ? store.logo_path : null].filter(Boolean) as string[];
  if (oldPaths.length) await supabase.storage.from("store-assets").remove(oldPaths);
  try {
    for(const {position,desktop,mobile} of bannerFiles){
      const current=currentBanners?.find(item=>item.position===position);
      if(formData.get(`remove_banner_${position}`)==="on"){
        if(current){const {error}=await supabase.from("store_banners").delete().eq("id",current.id);if(error)throw error;await supabase.storage.from("store-assets").remove([current.desktop_path,current.mobile_path].filter(Boolean) as string[]);}continue;
      }
      const desktopPath=validImage(desktop)?await uploadImage(desktop,`banner-${position}-desktop`):current?.desktop_path;
      let mobilePath=validImage(mobile)?await uploadImage(mobile,`banner-${position}-mobile`):current?.mobile_path??null;
      if(formData.get(`remove_mobile_${position}`)==="on")mobilePath=null;
      if(!desktopPath){if(validImage(mobile))throw new Error("desktop_required");continue;}
      if(!validImage(desktop)&&!validImage(mobile)&&formData.get(`remove_mobile_${position}`)!=="on")continue;
      const {error}=await supabase.from("store_banners").upsert({store_id:store.id,position,desktop_path:desktopPath,mobile_path:mobilePath},{onConflict:"store_id,position"});if(error)throw error;
      if(validImage(desktop))pendingUploads.delete(desktopPath);
      if(validImage(mobile)&&mobilePath)pendingUploads.delete(mobilePath);
      const replaced=[validImage(desktop)?current?.desktop_path:null,(validImage(mobile)||formData.get(`remove_mobile_${position}`)==="on")?current?.mobile_path:null].filter(Boolean) as string[];
      if(replaced.length)await supabase.storage.from("store-assets").remove(replaced);
    }
  } catch(error) {
    if(pendingUploads.size)await supabase.storage.from("store-assets").remove([...pendingUploads]);
    return redirectWithMessage(request,"/painel/identidade","erro",error instanceof Error&&error.message==="desktop_required"?"Adicione primeiro a versão desktop do banner.":"Não foi possível enviar os banners. Confirme se a migration 007 foi aplicada.");
  }
  return redirectWithMessage(request, "/painel/identidade", "sucesso", "Identidade visual atualizada.");
}
