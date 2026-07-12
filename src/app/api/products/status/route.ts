import { NextResponse } from "next/server";
import { formValue, isAllowedFormOrigin, redirectWithMessage } from "@/lib/http";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!isAllowedFormOrigin(request)) return new NextResponse("Origem inválida", { status: 403 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirectWithMessage(request, "/login", "erro", "Sua sessão expirou.");
  const formData = await request.formData();
  const id = formValue(formData, "id");
  const action = formValue(formData, "action");
  const isActive = formValue(formData, "is_active") === "true";
  const { data: store } = await supabase.from("stores").select("id").eq("owner_id", user.id).maybeSingle();
  if(action==="delete"){
    const {data:images}=await supabase.from("product_images").select("storage_path, products!inner(store_id)").eq("product_id",id).eq("products.store_id",store?.id??"");
    const {error}=await supabase.from("products").delete().eq("id",id).eq("store_id",store?.id??"");
    if(error)return redirectWithMessage(request,"/painel/produtos","erro","Não foi possível excluir o produto.");
    const paths=(images??[]).map(image=>image.storage_path);if(paths.length)await supabase.storage.from("store-assets").remove(paths);
    return redirectWithMessage(request,"/painel/produtos","sucesso","Produto excluído.");
  }
  const { error } = await supabase.from("products").update({ is_active: isActive }).eq("id", id).eq("store_id", store?.id ?? "");
  if (error) return redirectWithMessage(request, "/painel/produtos", "erro", "Não foi possível alterar o produto.");
  return redirectWithMessage(request, "/painel/produtos", "sucesso", isActive ? "Produto ativado." : "Produto pausado.");
}
