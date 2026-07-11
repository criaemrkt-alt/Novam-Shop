import { NextResponse } from "next/server";
import { isAllowedFormOrigin, redirectWithMessage } from "@/lib/http";
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
  if (!(logo instanceof File && logo.size) && !(banner instanceof File && banner.size)) {
    return redirectWithMessage(request, "/painel/identidade", "erro", "Escolha ao menos uma imagem.");
  }
  if ((logo instanceof File && logo.size && !validImage(logo)) || (banner instanceof File && banner.size && !validImage(banner))) {
    return redirectWithMessage(request, "/painel/identidade", "erro", "Use JPG, PNG ou WebP com até 5 MB.");
  }
  const updates: { logo_path?: string; banner_path?: string } = {};
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
