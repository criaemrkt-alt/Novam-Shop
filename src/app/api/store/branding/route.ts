import { NextResponse } from "next/server";
import { formValue, isAllowedFormOrigin, redirectWithMessage } from "@/lib/http";
import { safeFileName, validImage } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isAllowedFormOrigin(request)) return new NextResponse("Origem inválida", { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirectWithMessage(request, "/login", "erro", "Sua sessão expirou.");
  const { data: store } = await supabase.from("stores").select("id, logo_path, banner_path").eq("owner_id", user.id).maybeSingle();
  if (!store) return redirectWithMessage(request, "/painel", "erro", "Crie sua loja antes de adicionar a identidade visual.");
  const formData = await request.formData();
  const logo = formData.get("logo");
  const banner = formData.get("banner");
  const hero_title = formValue(formData, "hero_title");
  const subtitle = formValue(formData, "subtitle");
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
  if ((logo instanceof File && logo.size && !validImage(logo)) || (banner instanceof File && banner.size && !validImage(banner))) {
    return redirectWithMessage(request, "/painel/identidade", "erro", "Use JPG, PNG ou WebP com até 5 MB.");
  }
  const updates: { logo_path?: string; banner_path?: string; hero_title:string|null; subtitle:string|null; theme_preset:string; theme_primary:string; theme_accent:string; theme_background:string; theme_text:string } = { hero_title:hero_title||null, subtitle:subtitle||null, theme_preset, theme_primary, theme_accent, theme_background, theme_text };
  const uploaded: string[] = [];
  for (const [kind, file] of [["logo", logo], ["banner", banner]] as const) {
    if (!validImage(file)) continue;
    const path = `${user.id}/${store.id}/branding/${kind}-${safeFileName(file.name)}`;
    const { error } = await supabase.storage.from("store-assets").upload(path, file, { contentType: file.type, upsert: false });
    if (error) {
      if (uploaded.length) await supabase.storage.from("store-assets").remove(uploaded);
      return redirectWithMessage(request, "/painel/identidade", "erro", "Não foi possível enviar as imagens. Confirme se a migration do Storage foi aplicada.");
    }
    uploaded.push(path);
    if (kind === "logo") updates.logo_path = path; else updates.banner_path = path;
  }
  const { error } = await supabase.from("stores").update(updates).eq("id", store.id);
  if (error) {
    await supabase.storage.from("store-assets").remove(uploaded);
    return redirectWithMessage(request, "/painel/identidade", "erro", "Não foi possível salvar a identidade visual.");
  }
  const oldPaths = [updates.logo_path ? store.logo_path : null, updates.banner_path ? store.banner_path : null].filter(Boolean) as string[];
  if (oldPaths.length) await supabase.storage.from("store-assets").remove(oldPaths);
  return redirectWithMessage(request, "/painel/identidade", "sucesso", "Identidade visual atualizada.");
}
